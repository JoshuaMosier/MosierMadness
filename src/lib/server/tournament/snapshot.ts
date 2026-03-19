import {
  NCAA_SCOREBOARD_BASE_URL,
  SNAPSHOT_TTL_MS,
  getErrorMessage,
} from '$lib/server/tournament/constants';
import { parseDateParts } from '$lib/server/tournament/dates';
import { fetchTournamentDayForDate } from '$lib/server/tournament/tournamentFetch';
import { getTournamentSnapshotFingerprint, notifyTournamentRefresh } from '$lib/server/tournament/realtime';
import { getStatusPriority, sortScoreboardGames } from '$lib/utils/scoreboardUtils';
import { formatTeamSelection, parseTeamSelection } from '$lib/utils/bracketUtils';
import { getTournamentSettings, getCanonicalFirstRoundDates } from '$lib/server/tournament/settings';
import { loadTeamColors, getTeamColorSet, buildNormalizedTeam } from '$lib/server/tournament/teamColors';
import { resolveTeamSeoName } from '$lib/utils/teamColorUtils';
import { getFirstFourOverrides, checkAndResolveFirstFour } from '$lib/server/tournament/firstFour';
import type { TournamentSettings, TournamentSnapshot, ScoreboardGame, ScoreboardTeam, BracketMatch } from '$lib/types';

interface CanonicalTeam {
  name: string;
  seed: number;
  seoName: string;
  color: string;
  secondaryColor: string;
  ncaaName: string;
  char6: string;
  score?: number | null;
}

interface ParsedBracketId {
  bracketId: string;
  bracketIndex: number;
  roundNumber: number;
  gameNumber: number;
}

interface TeamLookup {
  teamByName: Map<string, CanonicalTeam>;
  teamBySelection: Map<string, CanonicalTeam>;
}

const snapshotCache: {
  value: TournamentSnapshot | null;
  cacheKey: string | null;
  fingerprint: string | null;
  expiresAt: number;
} = {
  value: null,
  cacheKey: null,
  fingerprint: null,
  expiresAt: 0,
};

let inflightSnapshotPromise: Promise<TournamentSnapshot> | null = null;
let inflightSnapshotCacheKey: string | null = null;

export function getScoreboardUrlForDate(dateValue: Date | string = new Date()): string {
  const { year, month, day } = parseDateParts(dateValue);
  return `${NCAA_SCOREBOARD_BASE_URL}/${year}/${month}/${day}/scoreboard.json`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCanonicalTeamName(teamData: any): string {
  return teamData.names.short.length < 20 ? teamData.names.short : teamData.names.char6;
}

function parseScore(scoreValue: unknown): number | null {
  if (scoreValue === '' || scoreValue === null || scoreValue === undefined) {
    return null;
  }

  const parsed = Number.parseInt(String(scoreValue), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDisplayClock(game: any): string {
  if (game.gameState === 'live') {
    let period: string = game.currentPeriod;
    if (period !== 'HALF' && period !== 'END 2ND' && game.contestClock) {
      period += ` ${game.contestClock}`;
    }
    return period;
  }

  if (game.gameState === 'final') {
    return 'FINAL';
  }

  return game.startTime || '';
}

function parseBracketId(bracketId: string | null | undefined): ParsedBracketId | null {
  if (!bracketId) {
    return null;
  }

  const roundNum = Number.parseInt(bracketId[0], 10);
  const gameNum = Number.parseInt(bracketId.slice(1), 10);
  if (!Number.isFinite(roundNum) || !Number.isFinite(gameNum)) {
    return null;
  }

  const offsetByRound: Record<number, number> = {
    2: 0,
    3: 32,
    4: 48,
    5: 56,
    6: 60,
    7: 62,
  };

  const offset = offsetByRound[roundNum];
  if (offset === undefined) {
    return null;
  }

  return {
    bracketId,
    bracketIndex: offset + gameNum,
    roundNumber: roundNum - 1,
    gameNumber: gameNum,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCanonicalTeam(teamData: any, canonicalName: string = getCanonicalTeamName(teamData)): CanonicalTeam {
  const seoName = resolveTeamSeoName(canonicalName, teamData.names.seo);
  const { primaryColor: color, secondaryColor } = getTeamColorSet(seoName);
  return {
    name: canonicalName,
    seed: Number.parseInt(teamData.seed, 10),
    seoName,
    color,
    secondaryColor,
    ncaaName: teamData.names.short,
    char6: teamData.names.char6,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFirstRoundTeams(firstRoundDays: any[], overrides: Record<number, { name: string; seed: number; seoName?: string }> = {}): { teams: (CanonicalTeam | null)[]; canonicalByNcaaName: Map<string, string> } {
  const teams: (CanonicalTeam | null)[] = new Array(64).fill(null);
  const canonicalByNcaaName = new Map<string, string>();

  for (const day of firstRoundDays) {
    for (const wrapper of day.games || []) {
      const game = wrapper.game;
      if (!game?.bracketId) {
        continue;
      }

      const parsed = parseBracketId(game.bracketId);
      if (!parsed || parsed.roundNumber !== 1) {
        continue;
      }

      const index = parsed.gameNumber - 1;
      const awayTeam = buildCanonicalTeam(game.away);
      const homeTeam = buildCanonicalTeam(game.home);

      if (awayTeam.seed < homeTeam.seed) {
        teams[index * 2] = awayTeam;
        teams[index * 2 + 1] = homeTeam;
      } else {
        teams[index * 2] = homeTeam;
        teams[index * 2 + 1] = awayTeam;
      }

      canonicalByNcaaName.set(game.away.names.short, awayTeam.name);
      canonicalByNcaaName.set(game.home.names.short, homeTeam.name);
    }
  }

  teams.forEach((team, index) => {
    const override = overrides[index];
    if (!override || !team) {
      return;
    }

    team.name = override.name;
    team.seed = override.seed;
    team.seoName = resolveTeamSeoName(override.name, override.seoName || team.seoName);
    const { primaryColor: color, secondaryColor } = getTeamColorSet(team.seoName);
    team.color = color;
    team.secondaryColor = secondaryColor;
  });

  for (const team of teams) {
    if (!team) {
      continue;
    }
    canonicalByNcaaName.set(team.ncaaName, team.name);
  }

  return { teams, canonicalByNcaaName };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeScoreboardTeam(teamData: any, canonicalByNcaaName: Map<string, string>): ScoreboardTeam {
  const canonicalName = canonicalByNcaaName.get(teamData.names.short) || teamData.names.short;
  return buildNormalizedTeam({
    name: canonicalName,
    ncaaName: teamData.names.short,
    char6: teamData.names.char6,
    seoName: resolveTeamSeoName(canonicalName, teamData.names.seo),
    score: parseScore(teamData.score),
    scoreText: teamData.score ?? '',
    seed: teamData.seed ? Number.parseInt(teamData.seed, 10) : null,
    winner: teamData.winner === true,
    description: teamData.description,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeScoreboardGame(wrapper: any, canonicalByNcaaName: Map<string, string>, options: { allowNonTournament?: boolean } = {}): ScoreboardGame | null {
  const game = wrapper.game;
  const parsed = parseBracketId(game?.bracketId);

  if (!parsed && !options.allowNonTournament) {
    return null;
  }

  const awayTeam = normalizeScoreboardTeam(game.away, canonicalByNcaaName);
  const homeTeam = normalizeScoreboardTeam(game.home, canonicalByNcaaName);
  const fallbackId = `daily-${awayTeam.seoName}-${homeTeam.seoName}-${game.startTime || game.currentPeriod || 'tbd'}`;

  return {
    gameId: parsed?.bracketId || fallbackId,
    bracketId: parsed?.bracketId || null,
    bracketIndex: parsed?.bracketIndex || null,
    roundNumber: parsed?.roundNumber || null,
    gameNumber: parsed?.gameNumber || null,
    region: game.bracketRegion || null,
    status: game.gameState,
    statusLabel: (game.gameState || '').toUpperCase(),
    displayClock: getDisplayClock(game),
    period: game.currentPeriod || '',
    clock: game.contestClock || '',
    startTime: game.startTime || '',
    awayTeam,
    homeTeam,
    matchup: `${awayTeam.description} vs ${homeTeam.description}`,
    sortPriority: getStatusPriority(game.gameState),
    isTournamentGame: Boolean(parsed),
  };
}

function buildTeamLookup(firstRoundTeams: (CanonicalTeam | null)[]): TeamLookup {
  const teamByName = new Map<string, CanonicalTeam>();
  const teamBySelection = new Map<string, CanonicalTeam>();

  for (const team of firstRoundTeams) {
    if (!team) {
      continue;
    }

    teamByName.set(team.name, team);
    teamBySelection.set(formatTeamSelection(team), team);
  }

  return { teamByName, teamBySelection };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTournamentResults(roundData: any[], canonicalByNcaaName: Map<string, string>) {
  const masterBracket: string[] = Array(63).fill('');
  const gamesById = new Map<string, ScoreboardGame>();
  const gamesByIndex = new Map<number, ScoreboardGame>();

  for (const day of roundData) {
    for (const wrapper of day.games || []) {
      const game = wrapper.game;
      if (!game?.bracketId) {
        continue;
      }

      const normalized = normalizeScoreboardGame(wrapper, canonicalByNcaaName);
      if (!normalized) {
        continue;
      }

      gamesById.set(normalized.gameId, normalized);
      if (normalized.bracketIndex !== null) {
        gamesByIndex.set(normalized.bracketIndex, normalized);
      }

      if (game.away.winner) {
        masterBracket[(normalized.bracketIndex ?? 0) - 1] = formatTeamSelection({
          seed: normalized.awayTeam.seed,
          name: normalized.awayTeam.name,
        });
      } else if (game.home.winner) {
        masterBracket[(normalized.bracketIndex ?? 0) - 1] = formatTeamSelection({
          seed: normalized.homeTeam.seed,
          name: normalized.homeTeam.name,
        });
      }
    }
  }

  return { masterBracket, gamesById, gamesByIndex };
}

function createBracketTeam(
  selection: string,
  teamBySelection: Map<string, CanonicalTeam>,
  teamByName: Map<string, CanonicalTeam>,
): CanonicalTeam | null {
  if (!selection) {
    return null;
  }

  const fromLookup = teamBySelection.get(selection);
  if (fromLookup) {
    return { ...fromLookup };
  }

  const parsed = parseTeamSelection(selection);
  if (!parsed) {
    return null;
  }

  const fromNameLookup = teamByName.get(parsed.name);
  if (fromNameLookup) {
    return { ...fromNameLookup };
  }

  const seoName = resolveTeamSeoName(parsed.name, fromNameLookup?.seoName);
  const { primaryColor: color, secondaryColor } = getTeamColorSet(seoName);
  return {
    seed: parsed.seed,
    name: parsed.name,
    seoName,
    color,
    secondaryColor,
    ncaaName: parsed.name,
    char6: parsed.name.slice(0, 6).toUpperCase(),
  };
}

function attachScores(matchTeam: CanonicalTeam | null, game: ScoreboardGame | undefined): CanonicalTeam | null {
  if (!matchTeam || !game) {
    return matchTeam;
  }

  if (matchTeam.name === game.awayTeam.name) {
    return {
      ...matchTeam,
      score: game.awayTeam.score,
    };
  }

  if (matchTeam.name === game.homeTeam.name) {
    return {
      ...matchTeam,
      score: game.homeTeam.score,
    };
  }

  return matchTeam;
}

function buildMatch(
  selectionA: string,
  selectionB: string,
  winnerSelection: string,
  game: ScoreboardGame | undefined,
  teamBySelection: Map<string, CanonicalTeam>,
  teamByName: Map<string, CanonicalTeam>,
): BracketMatch {
  const teamA = attachScores(createBracketTeam(selectionA, teamBySelection, teamByName), game);
  const teamB = attachScores(createBracketTeam(selectionB, teamBySelection, teamByName), game);

  let winner: 'A' | 'B' | null = null;
  if (winnerSelection && selectionA && winnerSelection === selectionA) {
    winner = 'A';
  } else if (winnerSelection && selectionB && winnerSelection === selectionB) {
    winner = 'B';
  }

  return {
    gameId: game?.gameId || null,
    bracketIndex: game?.bracketIndex || null,
    roundNumber: game?.roundNumber || null,
    region: game?.region || null,
    teamA,
    teamB,
    winner,
    gameState: game?.status || null,
    period: game?.period || '',
    clock: game?.clock || '',
    startTime: game?.startTime || '',
    displayClock: game?.displayClock || '',
  };
}

function buildBracketMatches(
  firstRoundTeams: (CanonicalTeam | null)[],
  masterBracket: string[],
  gamesByIndex: Map<number, ScoreboardGame>,
  teamBySelection: Map<string, CanonicalTeam>,
  teamByName: Map<string, CanonicalTeam>,
): Record<number, BracketMatch> {
  const matches: Record<number, BracketMatch> = {};
  const initialSelections = firstRoundTeams.map(team => formatTeamSelection(team));

  for (let i = 0; i < 32; i++) {
    matches[i + 1] = buildMatch(
      initialSelections[i * 2],
      initialSelections[i * 2 + 1],
      masterBracket[i],
      gamesByIndex.get(i + 1),
      teamBySelection,
      teamByName,
    );
  }

  for (let i = 0; i < 16; i++) {
    matches[i + 33] = buildMatch(
      masterBracket[i * 2],
      masterBracket[i * 2 + 1],
      masterBracket[i + 32],
      gamesByIndex.get(i + 33),
      teamBySelection,
      teamByName,
    );
  }

  for (let i = 0; i < 8; i++) {
    matches[i + 49] = buildMatch(
      masterBracket[i * 2 + 32],
      masterBracket[i * 2 + 33],
      masterBracket[i + 48],
      gamesByIndex.get(i + 49),
      teamBySelection,
      teamByName,
    );
  }

  for (let i = 0; i < 4; i++) {
    matches[i + 57] = buildMatch(
      masterBracket[i * 2 + 48],
      masterBracket[i * 2 + 49],
      masterBracket[i + 56],
      gamesByIndex.get(i + 57),
      teamBySelection,
      teamByName,
    );
  }

  for (let i = 0; i < 2; i++) {
    matches[i + 61] = buildMatch(
      masterBracket[i * 2 + 56],
      masterBracket[i * 2 + 57],
      masterBracket[i + 60],
      gamesByIndex.get(i + 61),
      teamBySelection,
      teamByName,
    );
  }

  matches[63] = buildMatch(
    masterBracket[60],
    masterBracket[61],
    masterBracket[62],
    gamesByIndex.get(63),
    teamBySelection,
    teamByName,
  );

  return matches;
}

function buildChampion(matches: Record<number, BracketMatch>): CanonicalTeam | null {
  const finalMatch = matches[63];
  if (!finalMatch?.winner) {
    return null;
  }

  return (finalMatch.winner === 'A' ? finalMatch.teamA : finalMatch.teamB) as CanonicalTeam | null;
}

function getUniqueRoundDates(settings: TournamentSettings): string[] {
  return [...new Set((settings.tickerRounds || []).flatMap(round => round.dates || []))].sort();
}

function buildSnapshotCacheKey(settings: TournamentSettings): string {
  return JSON.stringify({
    displaySeasonYear: settings.displaySeasonYear,
    stage: settings.stage,
    archiveScoreboardDate: settings.archiveScoreboardDate,
    firstRoundDates: settings.firstRoundDates,
    tickerRounds: settings.tickerRounds,
    firstFourConfig: settings.firstFourConfig,
  });
}

function buildEmptyBracketMatches(): Record<number, BracketMatch> {
  const matches: Record<number, BracketMatch> = {};

  for (let bracketIndex = 1; bracketIndex <= 63; bracketIndex++) {
    matches[bracketIndex] = {
      gameId: null,
      bracketIndex,
      roundNumber: null,
      region: null,
      teamA: null,
      teamB: null,
      winner: null,
      gameState: null,
      period: '',
      clock: '',
      startTime: '',
      displayClock: '',
    };
  }

  return matches;
}

function buildEmptyTournamentSnapshot(settings: TournamentSettings): TournamentSnapshot {
  return {
    fetchedAt: new Date().toISOString(),
    settings,
    canonicalByNcaaName: new Map(),
    firstRoundTeams: new Array(64).fill(null),
    masterBracket: new Array(63).fill(''),
    bracketMatches: buildEmptyBracketMatches(),
    champion: null,
    gamesById: new Map(),
    gamesByIndex: new Map(),
    scoreboardGames: [],
    teamByName: new Map(),
    teamBySelection: new Map(),
  };
}

async function buildTournamentSnapshot(settings: TournamentSettings): Promise<TournamentSnapshot> {
  await loadTeamColors();
  const firstRoundDates =
    (settings.firstRoundDates?.length ?? 0) >= 2
      ? (settings.firstRoundDates || [])
      : getCanonicalFirstRoundDates(settings.entrySeasonYear);
  const roundDates = getUniqueRoundDates(settings);
  const [firstRoundDays, roundData] = await Promise.all([
    Promise.all(firstRoundDates.map(fetchTournamentDayForDate)),
    Promise.all(roundDates.map(fetchTournamentDayForDate)),
  ]);

  const overrides = getFirstFourOverrides(settings);
  const { teams: firstRoundTeams, canonicalByNcaaName } = buildFirstRoundTeams(firstRoundDays, overrides);
  const { teamByName, teamBySelection } = buildTeamLookup(firstRoundTeams);
  const { masterBracket, gamesById, gamesByIndex } = buildTournamentResults(roundData, canonicalByNcaaName);
  const bracketMatches = buildBracketMatches(firstRoundTeams, masterBracket, gamesByIndex, teamBySelection, teamByName);
  const scoreboardGames = sortScoreboardGames(Array.from(gamesById.values()));

  return {
    fetchedAt: new Date().toISOString(),
    settings,
    canonicalByNcaaName,
    firstRoundTeams,
    masterBracket,
    bracketMatches,
    champion: buildChampion(bracketMatches),
    gamesById,
    gamesByIndex,
    scoreboardGames,
    teamByName,
    teamBySelection,
  };
}

export async function getTournamentSnapshot(explicitSettings: TournamentSettings | null = null): Promise<TournamentSnapshot> {
  const settings = explicitSettings || await getTournamentSettings();
  const cacheKey = buildSnapshotCacheKey(settings);
  const now = Date.now();
  if (snapshotCache.value && snapshotCache.cacheKey === cacheKey && snapshotCache.expiresAt > now) {
    return snapshotCache.value;
  }

  // Coalesce concurrent requests: share a single in-flight build
  if (inflightSnapshotPromise && inflightSnapshotCacheKey === cacheKey) {
    return inflightSnapshotPromise;
  }

  inflightSnapshotCacheKey = cacheKey;
  inflightSnapshotPromise = buildTournamentSnapshot(settings)
    .then(snapshot => {
      const nextFingerprint = getTournamentSnapshotFingerprint(snapshot);
      const shouldNotify = snapshotCache.cacheKey !== cacheKey || snapshotCache.fingerprint !== nextFingerprint;

      snapshotCache.value = snapshot;
      snapshotCache.cacheKey = cacheKey;
      snapshotCache.fingerprint = nextFingerprint;
      snapshotCache.expiresAt = Date.now() + SNAPSHOT_TTL_MS;

      if (shouldNotify) {
        notifyTournamentRefresh().catch(() => {});
      }

      checkAndResolveFirstFour(settings).catch((err: Error) => console.warn('First Four check failed:', err.message));

      return snapshot;
    })
    .catch((error: unknown) => {
      if (snapshotCache.value && snapshotCache.cacheKey === cacheKey) {
        console.warn(`Using stale tournament snapshot cache: ${getErrorMessage(error)}`);
        return snapshotCache.value;
      }

      console.warn(`Falling back to empty tournament snapshot: ${getErrorMessage(error)}`);
      const emptySnapshot = buildEmptyTournamentSnapshot(settings);
      snapshotCache.value = emptySnapshot;
      snapshotCache.cacheKey = cacheKey;
      snapshotCache.fingerprint = getTournamentSnapshotFingerprint(emptySnapshot);
      snapshotCache.expiresAt = Date.now() + SNAPSHOT_TTL_MS;
      return emptySnapshot;
    })
    .finally(() => {
      inflightSnapshotPromise = null;
      inflightSnapshotCacheKey = null;
    });

  return inflightSnapshotPromise;
}

export async function getScoreboardGamesForDate(
  date: Date | string = new Date(),
  options: { settings?: TournamentSettings; allowNonTournament?: boolean } = {},
): Promise<ScoreboardGame[]> {
  const snapshot = await getTournamentSnapshot(options.settings ?? null);
  const { year, month, day } = parseDateParts(date);
  const dateStr = `${year}-${month}-${day}`;
  const dayData = await fetchTournamentDayForDate(dateStr);

  return sortScoreboardGames(
    (dayData.games || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((game: any) => normalizeScoreboardGame(game, snapshot.canonicalByNcaaName, {
        allowNonTournament: options.allowNonTournament,
      }))
      .filter(Boolean),
  );
}
