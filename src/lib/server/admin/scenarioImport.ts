import type {
  GeneratedScenarioArtifact,
  GeneratedScenarioEntry,
  GeneratedScenarioGamePreview,
  GeneratedScenarioOutcome,
  GeneratedScenarioTeam,
} from '$lib/types';
import { getGeneratedScenarioArtifactPath } from '$lib/server/scenarios/generated';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface ExactOutputCandidate {
  fullPath: string;
  mtimeMs: number;
}

interface ScenarioImportSummary {
  sourceOutputPath: string;
  sourceInputPath: string | null;
  targetPath: string;
  entryCount: number;
  previewGameCount: number;
  totalScenarios: number;
  unresolvedGameCount: number;
  assumptionSummary: string;
  weightingSummaryLabel: string | null;
  weightingSourceNote: string | null;
}

export interface ScenarioImportResult {
  artifact: GeneratedScenarioArtifact;
  summary: ScenarioImportSummary;
}

interface SourceScenarioEntry {
  entryId?: string;
  userId?: string | null;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  lockedScore?: number;
  firstPlaceCount?: number;
  firstPlacePct?: number;
  placeCounts?: unknown[];
  weightedFirstPlacePct?: number;
  weightedPlacePcts?: unknown[];
  picks?: unknown[];
}

interface SourceScenarioTeam {
  teamId?: number;
  id?: number;
  seed?: number;
  name?: string;
  seoName?: string;
}

interface SourceScenarioOutcome {
  winnerTeamId?: number;
  totalScenarios?: number;
  weightedProbabilityPct?: number;
  entries?: SourceScenarioEntry[];
}

interface SourceScenarioGamePreview {
  gameIndex?: number;
  round?: number;
  roundLabel?: string;
  teamA?: SourceScenarioTeam;
  teamB?: SourceScenarioTeam;
  outcomeA?: SourceScenarioOutcome;
  outcomeB?: SourceScenarioOutcome;
}

interface ExactScenarioOutput {
  schemaVersion?: number;
  inputFile?: string;
  generatedAt?: string;
  totalScenarios?: number;
  unresolvedGameCount?: number;
  weightingSummaryLabel?: string;
  weightingSourceNote?: string;
  assumptions?: { round?: number }[];
  entries?: SourceScenarioEntry[];
  previewGames?: SourceScenarioGamePreview[];
}

function getStandaloneScenarioOutputDir(): string {
  return path.resolve(process.cwd(), '..', 'bracket-scenarios', 'data', 'output');
}

async function findLatestExactOutput(outputDir: string): Promise<string | null> {
  const entries = await readdir(outputDir, { withFileTypes: true });
  const preferredCandidates: ExactOutputCandidate[] = [];
  const fallbackCandidates: ExactOutputCandidate[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue;
    }

    if (entry.name.includes('-monte-carlo-') || !entry.name.includes('-exact')) {
      continue;
    }

    const fullPath = path.join(outputDir, entry.name);
    const candidate = {
      fullPath,
      mtimeMs: (await stat(fullPath)).mtimeMs,
    };

    if (entry.name.includes('-higher-seed-through-round-1')) {
      preferredCandidates.push(candidate);
      continue;
    }

    fallbackCandidates.push(candidate);
  }

  preferredCandidates.sort((left, right) => right.mtimeMs - left.mtimeMs);
  fallbackCandidates.sort((left, right) => right.mtimeMs - left.mtimeMs);

  return preferredCandidates[0]?.fullPath ?? fallbackCandidates[0]?.fullPath ?? null;
}

function buildAssumptionSummary(assumptions: { round?: number }[] | undefined): string {
  if (!Array.isArray(assumptions) || assumptions.length === 0) {
    return 'No assumption overrides';
  }

  const highestRound = assumptions.reduce((max, assumption) => {
    return Math.max(max, Number(assumption?.round ?? 0));
  }, 0);

  return `${assumptions.length} assumed games through round ${highestRound}`;
}

function normalizeWeightingSummaryLabel(label: string | undefined): string | null {
  const trimmed = label?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.toLowerCase().includes('barthag')) {
    return 'Team strength ratings';
  }

  return trimmed;
}

function normalizeWeightingSourceNote(note: string | undefined): string {
  const trimmed = note?.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.toLowerCase().includes('barthag')) {
    return 'Likely Paths weights each remaining game using team strength ratings so more realistic outcomes count more.';
  }

  return trimmed;
}

function normalizeEntry(
  entry: SourceScenarioEntry | undefined,
  baseEntry: SourceScenarioEntry | null = null,
): GeneratedScenarioEntry {
  return {
    entryId: entry?.entryId ?? baseEntry?.entryId ?? '',
    userId: entry?.userId ?? baseEntry?.userId ?? undefined,
    firstName: entry?.firstName ?? baseEntry?.firstName ?? undefined,
    lastName: entry?.lastName ?? baseEntry?.lastName ?? undefined,
    displayName: entry?.displayName ?? baseEntry?.displayName ?? '',
    lockedScore: Number(entry?.lockedScore ?? baseEntry?.lockedScore ?? 0),
    firstPlaceCount: Number(entry?.firstPlaceCount ?? 0),
    firstPlacePct: Number(entry?.firstPlacePct ?? 0),
    placeCounts: Array.isArray(entry?.placeCounts)
      ? entry.placeCounts.map((value) => Number(value))
      : [],
    weightedFirstPlacePct: entry?.weightedFirstPlacePct == null ? undefined : Number(entry.weightedFirstPlacePct),
    weightedPlacePcts: Array.isArray(entry?.weightedPlacePcts)
      ? entry.weightedPlacePcts.map((value) => Number(value))
      : undefined,
    picks: Array.isArray(baseEntry?.picks)
      ? baseEntry.picks.map((value) => value == null ? null : Number(value))
      : undefined,
  };
}

function normalizeTeam(team: SourceScenarioTeam | undefined): GeneratedScenarioTeam {
  return {
    teamId: Number(team?.teamId ?? team?.id ?? 0),
    seed: Number(team?.seed ?? 0),
    name: team?.name ?? '',
    seoName: team?.seoName ?? '',
  };
}

function normalizeOutcome(
  outcome: SourceScenarioOutcome | undefined,
  entryById: Map<string, GeneratedScenarioEntry>,
  fallbackWinnerTeamId: number,
): GeneratedScenarioOutcome {
  const rawEntries = Array.isArray(outcome?.entries) ? outcome.entries : [];

  return {
    winnerTeamId: Number(outcome?.winnerTeamId ?? fallbackWinnerTeamId ?? 0),
    totalScenarios: Number(outcome?.totalScenarios ?? 0),
    weightedProbabilityPct: outcome?.weightedProbabilityPct == null ? undefined : Number(outcome.weightedProbabilityPct),
    entries: rawEntries.map((entry) => normalizeEntry(entry, entryById.get(entry?.entryId ?? '') ?? null)),
  };
}

function normalizePreviewGames(
  previewGames: SourceScenarioGamePreview[] | undefined,
  entryById: Map<string, GeneratedScenarioEntry>,
): GeneratedScenarioGamePreview[] {
  if (!Array.isArray(previewGames)) {
    return [];
  }

  return previewGames.map((game) => {
    const teamA = normalizeTeam(game?.teamA);
    const teamB = normalizeTeam(game?.teamB);

    return {
      gameIndex: Number(game?.gameIndex ?? 0),
      round: Number(game?.round ?? 0),
      roundLabel: game?.roundLabel ?? '',
      teamA,
      teamB,
      outcomeA: normalizeOutcome(game?.outcomeA, entryById, teamA.teamId),
      outcomeB: normalizeOutcome(game?.outcomeB, entryById, teamB.teamId),
    };
  });
}

async function loadSourceEntries(
  parsed: ExactScenarioOutput,
  outputDir: string,
): Promise<Map<string, SourceScenarioEntry>> {
  if (typeof parsed.inputFile !== 'string' || parsed.inputFile.length === 0) {
    return new Map();
  }

  try {
    const sourcePath = path.isAbsolute(parsed.inputFile)
      ? parsed.inputFile
      : path.resolve(outputDir, '..', '..', parsed.inputFile);
    const sourceRaw = await readFile(sourcePath, 'utf8');
    const sourceParsed = JSON.parse(sourceRaw) as { entries?: SourceScenarioEntry[] };
    const sourceEntries = Array.isArray(sourceParsed.entries) ? sourceParsed.entries : [];
    return new Map(sourceEntries.map((entry) => [entry.entryId ?? '', entry]));
  } catch {
    return new Map();
  }
}

export async function importLatestScenarioArtifact(): Promise<ScenarioImportResult> {
  const outputDir = getStandaloneScenarioOutputDir();
  let latestExactOutputPath: string | null;

  try {
    latestExactOutputPath = await findLatestExactOutput(outputDir);
  } catch (error: unknown) {
    throw new Error(
      `Unable to read standalone scenario output from ${outputDir}. Run the standalone generator first and confirm the sibling bracket-scenarios repo is available.`,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  if (!latestExactOutputPath) {
    throw new Error(`No generated scenario JSON files found in ${outputDir}`);
  }

  const raw = await readFile(latestExactOutputPath, 'utf8');
  const parsed = JSON.parse(raw) as ExactScenarioOutput;
  const sourceEntryById = await loadSourceEntries(parsed, outputDir);
  const entries = (parsed.entries ?? []).map((entry) => normalizeEntry(entry, sourceEntryById.get(entry.entryId ?? '') ?? null));
  const entryById = new Map(entries.map((entry) => [entry.entryId, entry]));
  const previewGames = normalizePreviewGames(parsed.previewGames, entryById);

  const artifact: GeneratedScenarioArtifact = {
    schemaVersion: Number(parsed.schemaVersion ?? 1),
    importedAt: new Date().toISOString(),
    sourceGeneratedAt: parsed.generatedAt ?? '',
    totalScenarios: Number(parsed.totalScenarios ?? 0),
    unresolvedGameCount: Number(parsed.unresolvedGameCount ?? 0),
    assumptionSummary: buildAssumptionSummary(parsed.assumptions),
    reportUrl: null,
    weighting: normalizeWeightingSummaryLabel(parsed.weightingSummaryLabel)
      ? {
          summaryLabel: normalizeWeightingSummaryLabel(parsed.weightingSummaryLabel) ?? '',
          sourceNote: normalizeWeightingSourceNote(parsed.weightingSourceNote),
        }
      : null,
    entries,
    previewGames,
  };

  const targetPath = getGeneratedScenarioArtifactPath();
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');

  const sourceInputPath = typeof parsed.inputFile === 'string' && parsed.inputFile.length > 0
    ? (path.isAbsolute(parsed.inputFile)
      ? parsed.inputFile
      : path.resolve(outputDir, '..', '..', parsed.inputFile))
    : null;

  return {
    artifact,
    summary: {
      sourceOutputPath: latestExactOutputPath,
      sourceInputPath,
      targetPath,
      entryCount: entries.length,
      previewGameCount: previewGames.length,
      totalScenarios: artifact.totalScenarios,
      unresolvedGameCount: artifact.unresolvedGameCount,
      assumptionSummary: artifact.assumptionSummary,
      weightingSummaryLabel: artifact.weighting?.summaryLabel ?? null,
      weightingSourceNote: artifact.weighting?.sourceNote ?? null,
    },
  };
}
