import fs from 'node:fs/promises';
import path from 'node:path';

const siteRoot = process.cwd();
const standaloneOutputDir = path.resolve(siteRoot, '..', 'bracket-scenarios', 'data', 'output');
const targetDir = path.resolve(siteRoot, 'static', 'generated', 'scenarios');

async function findLatestExactOutput() {
  const entries = await fs.readdir(standaloneOutputDir, { withFileTypes: true });
  const preferredCandidates = [];
  const fallbackCandidates = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    if (entry.name.includes('-monte-carlo-')) continue;
    if (!entry.name.includes('-exact')) continue;

    const fullPath = path.join(standaloneOutputDir, entry.name);
    const stats = await fs.stat(fullPath);
    const candidate = { fullPath, mtimeMs: stats.mtimeMs };
    if (entry.name.includes('-higher-seed-through-round-1')) {
      preferredCandidates.push(candidate);
    } else {
      fallbackCandidates.push(candidate);
    }
  }

  preferredCandidates.sort((left, right) => right.mtimeMs - left.mtimeMs);
  fallbackCandidates.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return preferredCandidates[0]?.fullPath ?? fallbackCandidates[0]?.fullPath ?? null;
}

function buildAssumptionSummary(assumptions) {
  if (!Array.isArray(assumptions) || assumptions.length === 0) {
    return 'No assumption overrides';
  }

  const highestRound = assumptions.reduce((max, assumption) => {
    return Math.max(max, Number(assumption?.round ?? 0));
  }, 0);

  return `${assumptions.length} assumed games through round ${highestRound}`;
}

function normalizeEntry(entry, baseEntry = null) {
  return {
    entryId: entry?.entryId ?? baseEntry?.entryId ?? '',
    userId: entry?.userId ?? baseEntry?.userId ?? null,
    firstName: entry?.firstName ?? baseEntry?.firstName ?? '',
    lastName: entry?.lastName ?? baseEntry?.lastName ?? '',
    displayName: entry?.displayName ?? baseEntry?.displayName ?? '',
    lockedScore: Number(entry?.lockedScore ?? baseEntry?.lockedScore ?? 0),
    firstPlaceCount: Number(entry?.firstPlaceCount ?? 0),
    firstPlacePct: Number(entry?.firstPlacePct ?? 0),
    placeCounts: Array.isArray(entry?.placeCounts)
      ? entry.placeCounts.map((value) => Number(value))
      : [],
  };
}

function normalizeTeam(team) {
  return {
    teamId: Number(team?.teamId ?? team?.id ?? 0),
    seed: Number(team?.seed ?? 0),
    name: team?.name ?? '',
    seoName: team?.seoName ?? '',
  };
}

function normalizeOutcome(outcome, entryById, fallbackWinnerTeamId) {
  const rawEntries = Array.isArray(outcome?.entries) ? outcome.entries : [];
  return {
    winnerTeamId: Number(outcome?.winnerTeamId ?? fallbackWinnerTeamId ?? 0),
    totalScenarios: Number(outcome?.totalScenarios ?? 0),
    entries: rawEntries.map((entry) => normalizeEntry(entry, entryById.get(entry?.entryId) ?? null)),
  };
}

async function main() {
  const latestExactJsonPath = await findLatestExactOutput();
  if (!latestExactJsonPath) {
    throw new Error(`No exact scenario JSON files found in ${standaloneOutputDir}`);
  }

  const raw = await fs.readFile(latestExactJsonPath, 'utf8');
  const parsed = JSON.parse(raw);
  const entries = (parsed.entries ?? []).map((entry) => normalizeEntry(entry));
  const entryById = new Map(entries.map((entry) => [entry.entryId, entry]));

  const artifact = {
    schemaVersion: 1,
    importedAt: new Date().toISOString(),
    sourceGeneratedAt: parsed.generatedAt,
    totalScenarios: Number(parsed.totalScenarios),
    unresolvedGameCount: Number(parsed.unresolvedGameCount ?? 0),
    assumptionSummary: buildAssumptionSummary(parsed.assumptions),
    reportUrl: '/generated/scenarios/current-report.html',
    entries,
    previewGames: (parsed.previewGames ?? []).map((game) => {
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
    }),
  };

  await fs.mkdir(targetDir, { recursive: true });
  const targetJsonPath = path.join(targetDir, 'current.json');
  await fs.writeFile(targetJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');

  const reportPath = latestExactJsonPath.replace(/\.json$/i, '-report.html');
  try {
    await fs.copyFile(reportPath, path.join(targetDir, 'current-report.html'));
  } catch {
    artifact.reportUrl = null;
    await fs.writeFile(targetJsonPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  }

  console.log(`Imported latest exact scenario artifact: ${latestExactJsonPath}`);
  console.log(`Wrote site artifact: ${targetJsonPath}`);
  if (artifact.reportUrl) {
    console.log(`Copied report: ${path.join(targetDir, 'current-report.html')}`);
  } else {
    console.log('No matching report HTML found to copy.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
