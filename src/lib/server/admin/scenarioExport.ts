import { env } from '$env/dynamic/private';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { ROUND_POINT_VALUES, areEquivalentSelections, parseTeamSelection } from '$lib/utils/bracketUtils';
import { calculateScores } from '$lib/utils/scoringUtils';
import type { Entry, TournamentSnapshot } from '$lib/types';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface ScenarioExportTeam {
  id: number;
  seed: number;
  name: string;
  selection: string;
  seoName: string;
  isSynthetic: boolean;
}

interface ScenarioExportGameSlot {
  kind: 'team' | 'game';
  teamId: number | null;
  gameIndex: number | null;
}

interface ScenarioExportGame {
  gameIndex: number;
  round: number;
  roundLabel: string;
  points: number;
  slotA: ScenarioExportGameSlot;
  slotB: ScenarioExportGameSlot;
  resolvedTeamAId: number | null;
  resolvedTeamBId: number | null;
  winnerTeamId: number | null;
}

interface ScenarioExportEntry {
  entryId: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  currentScore: number;
  currentCorrectGames: number;
  picks: (number | null)[];
  pickSelections: string[];
}

export interface ScenarioExportPayload {
  schemaVersion: 1;
  generatedAt: string;
  season: {
    entrySeasonYear: number;
    displaySeasonYear: number;
    stage: string;
  };
  source: {
    snapshotFetchedAt: string;
    entryCount: number;
    remainingGameCount: number;
    totalPossibleOutcomes: string;
  };
  scoring: {
    roundPoints: number[];
    rankingPolicy: 'shared-place';
    rankingNotes: string;
  };
  teams: ScenarioExportTeam[];
  games: ScenarioExportGame[];
  entries: ScenarioExportEntry[];
}

interface TeamRegistry {
  teams: ScenarioExportTeam[];
  idByCanonicalSelection: Map<string, number>;
}

export interface ScenarioExportResult {
  fileName: string;
  payload: ScenarioExportPayload;
  writtenPath: string | null;
  writeError: string | null;
}

const ROUND_LABELS: Record<number, string> = {
  1: 'Round of 64',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite 8',
  5: 'Final Four',
  6: 'Championship',
};

function createTeamRegistry(snapshot: TournamentSnapshot): TeamRegistry {
  const teams: ScenarioExportTeam[] = [];
  const idByCanonicalSelection = new Map<string, number>();

  for (const team of snapshot.firstRoundTeams) {
    if (!team) {
      continue;
    }

    const selection = `${team.seed} ${team.name}`;
    const id = teams.length + 1;
    teams.push({
      id,
      seed: team.seed,
      name: team.name,
      selection,
      seoName: team.seoName,
      isSynthetic: false,
    });
    idByCanonicalSelection.set(selection, id);
  }

  return { teams, idByCanonicalSelection };
}

function resolveTeamId(selection: string | null | undefined, registry: TeamRegistry): number | null {
  if (!selection) {
    return null;
  }

  const exact = registry.idByCanonicalSelection.get(selection);
  if (exact) {
    return exact;
  }

  for (const [candidateSelection, candidateId] of registry.idByCanonicalSelection.entries()) {
    if (areEquivalentSelections(candidateSelection, selection)) {
      return candidateId;
    }
  }

  const parsed = parseTeamSelection(selection);
  if (!parsed) {
    return null;
  }

  const syntheticId = registry.teams.length + 1;
  registry.teams.push({
    id: syntheticId,
    seed: parsed.seed,
    name: parsed.name,
    selection,
    seoName: '',
    isSynthetic: true,
  });
  registry.idByCanonicalSelection.set(selection, syntheticId);
  return syntheticId;
}

function getRoundForGameIndex(gameIndex: number): number {
  if (gameIndex < 32) return 1;
  if (gameIndex < 48) return 2;
  if (gameIndex < 56) return 3;
  if (gameIndex < 60) return 4;
  if (gameIndex < 62) return 5;
  return 6;
}

function getPreviousGameIndices(gameIndex: number): [number, number] | null {
  if (gameIndex < 32 || gameIndex > 62) {
    return null;
  }

  if (gameIndex < 48) {
    const first = (gameIndex - 32) * 2;
    return [first, first + 1];
  }

  if (gameIndex < 56) {
    const first = 32 + (gameIndex - 48) * 2;
    return [first, first + 1];
  }

  if (gameIndex < 60) {
    const first = 48 + (gameIndex - 56) * 2;
    return [first, first + 1];
  }

  if (gameIndex < 62) {
    const first = 56 + (gameIndex - 60) * 2;
    return [first, first + 1];
  }

  return [60, 61];
}

function buildGames(snapshot: TournamentSnapshot, registry: TeamRegistry): ScenarioExportGame[] {
  const winnerTeamIds = snapshot.masterBracket.map((selection) => resolveTeamId(selection, registry));
  const games: ScenarioExportGame[] = [];

  for (let gameIndex = 0; gameIndex < 63; gameIndex++) {
    const round = getRoundForGameIndex(gameIndex);
    let slotA: ScenarioExportGameSlot;
    let slotB: ScenarioExportGameSlot;
    let resolvedTeamAId: number | null = null;
    let resolvedTeamBId: number | null = null;

    if (gameIndex < 32) {
      resolvedTeamAId = resolveTeamId(snapshot.firstRoundTeams[gameIndex * 2] ? `${snapshot.firstRoundTeams[gameIndex * 2]!.seed} ${snapshot.firstRoundTeams[gameIndex * 2]!.name}` : null, registry);
      resolvedTeamBId = resolveTeamId(snapshot.firstRoundTeams[gameIndex * 2 + 1] ? `${snapshot.firstRoundTeams[gameIndex * 2 + 1]!.seed} ${snapshot.firstRoundTeams[gameIndex * 2 + 1]!.name}` : null, registry);
      slotA = { kind: 'team', teamId: resolvedTeamAId, gameIndex: null };
      slotB = { kind: 'team', teamId: resolvedTeamBId, gameIndex: null };
    } else {
      const previousGames = getPreviousGameIndices(gameIndex);
      if (!previousGames) {
        throw new Error(`No previous games found for game ${gameIndex}`);
      }

      resolvedTeamAId = winnerTeamIds[previousGames[0]] ?? null;
      resolvedTeamBId = winnerTeamIds[previousGames[1]] ?? null;
      slotA = { kind: 'game', teamId: null, gameIndex: previousGames[0] };
      slotB = { kind: 'game', teamId: null, gameIndex: previousGames[1] };
    }

    games.push({
      gameIndex,
      round,
      roundLabel: ROUND_LABELS[round] || `Round ${round}`,
      points: ROUND_POINT_VALUES[round - 1] ?? 0,
      slotA,
      slotB,
      resolvedTeamAId,
      resolvedTeamBId,
      winnerTeamId: winnerTeamIds[gameIndex] ?? null,
    });
  }

  return games;
}

function buildEntries(entries: Entry[], snapshot: TournamentSnapshot, registry: TeamRegistry): ScenarioExportEntry[] {
  const scoresByEntryId = new Map(
    calculateScores(snapshot.masterBracket, entries).map((score) => [score.entryId, score]),
  );

  return entries.map((entry) => {
    const score = scoresByEntryId.get(entry.entryId);
    return {
      entryId: entry.entryId,
      userId: entry.user_id,
      firstName: entry.firstName,
      lastName: entry.lastName,
      displayName: `${entry.firstName} ${entry.lastName}`.trim(),
      currentScore: score?.total ?? 0,
      currentCorrectGames: score?.correctGames ?? 0,
      picks: (entry.selections || []).map((selection) => resolveTeamId(selection, registry)),
      pickSelections: [...(entry.selections || [])],
    };
  });
}

function buildFileName(displaySeasonYear: number, generatedAt: string): string {
  const compactTimestamp = generatedAt
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  return `scenario-input-${displaySeasonYear}-${compactTimestamp}.json`;
}

async function getPreferredExportDir(): Promise<string | null> {
  const configured = env.SCENARIO_EXPORT_DIR?.trim();
  if (configured) {
    return configured;
  }

  const siblingRepoRoot = path.resolve(process.cwd(), '..', 'bracket-scenarios');

  try {
    await access(siblingRepoRoot);
    return path.join(siblingRepoRoot, 'data', 'input');
  } catch {
    return null;
  }
}

async function tryWriteExportFile(fileName: string, payload: ScenarioExportPayload): Promise<{ writtenPath: string | null; writeError: string | null }> {
  const exportDir = await getPreferredExportDir();
  if (!exportDir) {
    return { writtenPath: null, writeError: null };
  }

  const targetPath = path.join(exportDir, fileName);

  try {
    await mkdir(exportDir, { recursive: true });
    await writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    return { writtenPath: targetPath, writeError: null };
  } catch (error: unknown) {
    return {
      writtenPath: null,
      writeError: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function buildScenarioExportPayload(): Promise<ScenarioExportPayload> {
  const settings = await getTournamentSettings();
  const snapshot = await getTournamentSnapshot(settings);
  const entries = await getSubmittedEntries(settings.entrySeasonYear);
  const registry = createTeamRegistry(snapshot);
  const games = buildGames(snapshot, registry);
  const exportEntries = buildEntries(entries, snapshot, registry);
  const remainingGameCount = games.filter((game) => game.winnerTeamId === null).length;

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    season: {
      entrySeasonYear: settings.entrySeasonYear,
      displaySeasonYear: settings.displaySeasonYear,
      stage: settings.stage,
    },
    source: {
      snapshotFetchedAt: snapshot.fetchedAt,
      entryCount: exportEntries.length,
      remainingGameCount,
      totalPossibleOutcomes: (1n << BigInt(remainingGameCount)).toString(),
    },
    scoring: {
      roundPoints: [...ROUND_POINT_VALUES],
      rankingPolicy: 'shared-place',
      rankingNotes: 'Matches the current site scenarios behavior: entrants with the same final score share the highest placement in that tie group.',
    },
    teams: registry.teams,
    games,
    entries: exportEntries,
  };
}

export async function createScenarioExport(): Promise<ScenarioExportResult> {
  const payload = await buildScenarioExportPayload();
  const fileName = buildFileName(payload.season.displaySeasonYear, payload.generatedAt);
  const { writtenPath, writeError } = await tryWriteExportFile(fileName, payload);

  return {
    fileName,
    payload,
    writtenPath,
    writeError,
  };
}
