import {
  NCAA_SCOREBOARD_BASE_URL,
  SNAPSHOT_TTL_MS,
} from '$lib/server/tournament/constants';
import { fetchJsonWithCache } from '$lib/server/tournament/httpCache';
import { parseDateParts } from '$lib/server/tournament/dates';
import { getStatusPriority, sortScoreboardGames } from '$lib/utils/scoreboardUtils';
import { formatTeamSelection, parseTeamSelection } from '$lib/utils/bracketUtils';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { loadTeamColors, getTeamColorSet, buildNormalizedTeam } from '$lib/server/tournament/teamColors';
import { resolveTeamSeoName } from '$lib/utils/teamColorUtils';
import { supabase } from '$lib/supabase';
import { getFirstFourOverrides, checkAndResolveFirstFour } from '$lib/server/tournament/firstFour';

const snapshotCache = {
  value: null,
  cacheKey: null,
  expiresAt: 0,
};

let inflightSnapshotPromise = null;
let inflightSnapshotCacheKey = null;

export function getScoreboardUrlForDate(dateValue = new Date()) {
  const { year, month, day } = parseDateParts(dateValue);
  return `${NCAA_SCOREBOARD_BASE_URL}/${year}/${month}/${day}/scoreboard.json`;
}

export function getCanonicalTeamName(teamData) {
  return teamData.names.short.length < 20 ? teamData.names.short : teamData.names.char6;
}

function parseScore(scoreValue) {
  if (scoreValue === '' || scoreValue === null || scoreValue === undefined) {
    return null;
  }

  const parsed = Number.parseInt(scoreValue, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDisplayClock(game) {
  if (game.gameState === 'live') {
    let period = game.currentPeriod;
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

function parseBracketId(bracketId) {
  if (!bracketId) {
    return null;
  }

  const roundNum = Number.parseInt(bracketId[0], 10);
  const gameNum = Number.parseInt(bracketId.slice(1), 10);
  if (!Number.isFinite(roundNum) || !Number.isFinite(gameNum)) {
    return null;
  }

  const offsetByRound = {
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

function buildCanonicalTeam(teamData, canonicalName = getCanonicalTeamName(teamData)) {
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

function buildFirstRoundTeams(firstRoundDays, overrides = {}) {
  const teams = new Array(64).fill(null);
  const canonicalByNcaaName = new Map();

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

function normalizeScoreboardTeam(teamData, canonicalByNcaaName) {
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

function normalizeScoreboardGame(wrapper, canonicalByNcaaName, options = {}) {
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

function buildTeamLookup(firstRoundTeams) {
  const teamByName = new Map();
  const teamBySelection = new Map();

  for (const team of firstRoundTeams) {
    if (!team) {
      continue;
    }

    teamByName.set(team.name, team);
    teamBySelection.set(formatTeamSelection(team), team);
  }

  return { teamByName, teamBySelection };
}

function buildTournamentResults(roundData, canonicalByNcaaName) {
  const masterBracket = Array(63).fill('');
  const gamesById = new Map();
  const gamesByIndex = new Map();

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
      gamesByIndex.set(normalized.bracketIndex, normalized);

      if (game.away.winner) {
        masterBracket[normalized.bracketIndex - 1] = formatTeamSelection({
          seed: normalized.awayTeam.seed,
          name: normalized.awayTeam.name,
        });
      } else if (game.home.winner) {
        masterBracket[normalized.bracketIndex - 1] = formatTeamSelection({
          seed: normalized.homeTeam.seed,
          name: normalized.homeTeam.name,
        });
      }
    }
  }

  return { masterBracket, gamesById, gamesByIndex };
}

function createBracketTeam(selection, teamBySelection, teamByName) {
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
  };
}

function attachScores(matchTeam, game) {
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

function buildMatch(selectionA, selectionB, winnerSelection, game, teamBySelection, teamByName) {
  const teamA = attachScores(createBracketTeam(selectionA, teamBySelection, teamByName), game);
  const teamB = attachScores(createBracketTeam(selectionB, teamBySelection, teamByName), game);

  let winner = null;
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

function buildBracketMatches(firstRoundTeams, masterBracket, gamesByIndex, teamBySelection, teamByName) {
  const matches = {};
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

function buildChampion(matches) {
  const finalMatch = matches[63];
  if (!finalMatch?.winner) {
    return null;
  }

  return finalMatch.winner === 'A' ? finalMatch.teamA : finalMatch.teamB;
}

function getUniqueRoundDates(settings) {
  return [...new Set((settings.tickerRounds || []).flatMap(round => round.dates || []))].sort();
}

function buildSnapshotCacheKey(settings) {
  return JSON.stringify({
    displaySeasonYear: settings.displaySeasonYear,
    stage: settings.stage,
    archiveScoreboardDate: settings.archiveScoreboardDate,
    firstRoundDates: settings.firstRoundDates,
    tickerRounds: settings.tickerRounds,
    firstFourConfig: settings.firstFourConfig,
  });
}

async function buildTournamentSnapshot(settings) {
  await loadTeamColors();
  const firstRoundUrls = (settings.firstRoundDates || []).map(getScoreboardUrlForDate);
  const roundUrls = getUniqueRoundDates(settings).map(getScoreboardUrlForDate);
  const [firstRoundDays, roundData] = await Promise.all([
    Promise.all(firstRoundUrls.map(fetchJsonWithCache)),
    Promise.all(roundUrls.map(fetchJsonWithCache)),
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

export async function getTournamentSnapshot(explicitSettings = null) {
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
      snapshotCache.value = snapshot;
      snapshotCache.cacheKey = cacheKey;
      snapshotCache.expiresAt = Date.now() + SNAPSHOT_TTL_MS;

      supabase
        .from('realtime_updates')
        .upsert({ scope: 'tournament', updated_at: new Date().toISOString() })
        .then(() => {})
        .catch(err => console.warn('Realtime notify failed:', err.message));

      checkAndResolveFirstFour(settings).catch(err => console.warn('First Four check failed:', err.message));

      return snapshot;
    })
    .finally(() => {
      inflightSnapshotPromise = null;
      inflightSnapshotCacheKey = null;
    });

  return inflightSnapshotPromise;
}

export async function getScoreboardGamesForDate(date = new Date(), options = {}) {
  const snapshot = await getTournamentSnapshot(options.settings);
  let dayData;

  try {
    dayData = await fetchJsonWithCache(getScoreboardUrlForDate(date));
  } catch (error) {
    if (error?.status === 404) {
      return [];
    }

    throw error;
  }

  return sortScoreboardGames(
    (dayData.games || [])
      .map(game => normalizeScoreboardGame(game, snapshot.canonicalByNcaaName, {
        allowNonTournament: options.allowNonTournament,
      }))
      .filter(Boolean),
  );
}
