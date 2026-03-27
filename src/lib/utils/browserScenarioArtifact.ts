import type {
  Entry,
  GeneratedScenarioArtifact,
  GeneratedScenarioEntry,
  GeneratedScenarioGamePreview,
  GeneratedScenarioTeam,
  LiveBracketData,
  ScenarioWeightingModel,
  SimulationResult,
} from '$lib/types';
import { areEquivalentSelections, parseTeamSelection } from '$lib/utils/bracketUtils';
import { getTeamsForGame } from '$lib/utils/scenarioEngine';
import { resolveTeamSeoName } from '$lib/utils/teamColorUtils';

const SWEET_SIXTEEN_START_GAME = 48;
const CHAMPIONSHIP_GAME = 62;
const GENERATED_ARTIFACT_SCHEMA_VERSION = 1;

type PreviewRoundInfo = {
  round: number;
  label: string;
};

type PreviewGameMeta = {
  gameId: number;
  round: number;
  roundLabel: string;
  mask: number;
  teamA: GeneratedScenarioTeam;
  teamB: GeneratedScenarioTeam;
  teamASelection: string;
  teamBSelection: string;
};

type PreviewGameAccumulator = PreviewGameMeta & {
  branchAScenarios: number;
  branchBScenarios: number;
  branchAWinCounts: Int32Array;
  branchBWinCounts: Int32Array;
  branchAPositionCounts: Int32Array;
  branchBPositionCounts: Int32Array;
  branchAWeightedWinCounts: Float64Array;
  branchBWeightedWinCounts: Float64Array;
  branchAWeightedPositionCounts: Float64Array;
  branchBWeightedPositionCounts: Float64Array;
  branchATotalWeight: number;
  branchBTotalWeight: number;
};

type BrowserExactArtifactConfig = {
  entries: Entry[];
  liveBracketData: LiveBracketData;
  masterBracket: string[];
  result: SimulationResult;
  teamSeoMap?: Record<string, string>;
  weighting?: ScenarioWeightingModel | null;
};

function getPreviewRoundInfo(gameId: number): PreviewRoundInfo | null {
  if (gameId >= 48 && gameId < 56) {
    return { round: 3, label: 'Sweet 16' };
  }

  if (gameId >= 56 && gameId < 60) {
    return { round: 4, label: 'Elite 8' };
  }

  if (gameId >= 60 && gameId < 62) {
    return { round: 5, label: 'Final Four' };
  }

  if (gameId === 62) {
    return { round: 6, label: 'Championship' };
  }

  return null;
}

function getRemainingGames(masterBracket: string[]): number[] {
  const remainingGames: number[] = [];

  for (let gameId = SWEET_SIXTEEN_START_GAME; gameId <= CHAMPIONSHIP_GAME; gameId += 1) {
    if (!masterBracket[gameId]) {
      remainingGames.push(gameId);
    }
  }

  return remainingGames;
}

function getEntryDisplayName(entry: Entry): string {
  const full = `${entry.firstName ?? ''} ${entry.lastName ?? ''}`.trim();
  return full || entry.entryId;
}

function buildGeneratedEntries(
  entries: Entry[],
  totalScenarios: number,
  winCounts: ArrayLike<number>,
  positionCounts: ArrayLike<number>,
  totalWeight: number,
  weightedWinCounts?: ArrayLike<number> | null,
  weightedPositionCounts?: ArrayLike<number> | null,
  picksByEntryId?: Map<string, (number | null)[]>,
): GeneratedScenarioEntry[] {
  const numEntries = entries.length;
  const supportsWeighted = totalWeight > 0 && weightedWinCounts != null && weightedPositionCounts != null;

  return entries.map((entry, entryIndex) => {
    const offset = entryIndex * numEntries;
    const placeCounts = Array.from({ length: numEntries }, (_, positionIndex) => {
      return Number(positionCounts[offset + positionIndex] ?? 0);
    });
    const weightedPlacePcts = supportsWeighted
      ? Array.from({ length: numEntries }, (_, positionIndex) => {
          return totalWeight > 0
            ? (Number(weightedPositionCounts[offset + positionIndex] ?? 0) / totalWeight) * 100
            : 0;
        })
      : undefined;
    const firstPlaceCount = Number(winCounts[entryIndex] ?? 0);

    return {
      entryId: entry.entryId,
      userId: entry.user_id || undefined,
      firstName: entry.firstName,
      lastName: entry.lastName,
      displayName: getEntryDisplayName(entry),
      lockedScore: 0,
      firstPlaceCount,
      firstPlacePct: totalScenarios > 0 ? (firstPlaceCount / totalScenarios) * 100 : 0,
      placeCounts,
      weightedFirstPlacePct: supportsWeighted
        ? (Number(weightedWinCounts[entryIndex] ?? 0) / totalWeight) * 100
        : undefined,
      weightedPlacePcts,
      picks: picksByEntryId?.get(entry.entryId),
    };
  });
}

function buildPreviewGameMeta(
  liveBracketData: LiveBracketData,
  masterBracket: string[],
  remainingGames: number[],
  teamSeoMap: Record<string, string>,
): PreviewGameMeta[] {
  if (remainingGames.length === 0) {
    return [];
  }

  const currentRoundInfo = getPreviewRoundInfo(remainingGames[0]);
  if (!currentRoundInfo) {
    return [];
  }

  const previewGames: PreviewGameMeta[] = [];

  for (const gameId of remainingGames) {
    const roundInfo = getPreviewRoundInfo(gameId);
    if (!roundInfo || roundInfo.round !== currentRoundInfo.round) {
      continue;
    }

    const gameIndexInRemaining = remainingGames.indexOf(gameId);
    if (gameIndexInRemaining === -1) {
      continue;
    }

    const teams = getTeamsForGame(gameId, masterBracket, liveBracketData);
    const parsedTeamA = parseTeamSelection(teams.teamA);
    const parsedTeamB = parseTeamSelection(teams.teamB);

    if (!parsedTeamA || !parsedTeamB) {
      continue;
    }

    previewGames.push({
      gameId,
      round: roundInfo.round,
      roundLabel: roundInfo.label,
      mask: 1 << (remainingGames.length - 1 - gameIndexInRemaining),
      teamA: {
        teamId: (gameId * 2) + 1,
        seed: parsedTeamA.seed,
        name: parsedTeamA.name,
        seoName: resolveTeamSeoName(parsedTeamA.name, teamSeoMap[parsedTeamA.name]),
      },
      teamB: {
        teamId: (gameId * 2) + 2,
        seed: parsedTeamB.seed,
        name: parsedTeamB.name,
        seoName: resolveTeamSeoName(parsedTeamB.name, teamSeoMap[parsedTeamB.name]),
      },
      teamASelection: teams.teamA ?? '',
      teamBSelection: teams.teamB ?? '',
    });
  }

  return previewGames;
}

function buildPicksByEntryId(
  entries: Entry[],
  previewGames: PreviewGameMeta[],
): Map<string, (number | null)[]> {
  const picksByEntryId = new Map<string, (number | null)[]>();

  for (const entry of entries) {
    const picks = Array.from({ length: 63 }, () => null);
    let hasTrackedPick = false;

    for (const game of previewGames) {
      const selection = entry.selections?.[game.gameId];
      if (areEquivalentSelections(selection, game.teamASelection)) {
        picks[game.gameId] = game.teamA.teamId;
        hasTrackedPick = true;
      } else if (areEquivalentSelections(selection, game.teamBSelection)) {
        picks[game.gameId] = game.teamB.teamId;
        hasTrackedPick = true;
      }
    }

    if (hasTrackedPick) {
      picksByEntryId.set(entry.entryId, picks);
    }
  }

  return picksByEntryId;
}

function createPreviewAccumulators(
  previewGames: PreviewGameMeta[],
  numEntries: number,
): PreviewGameAccumulator[] {
  return previewGames.map((game) => ({
    ...game,
    branchAScenarios: 0,
    branchBScenarios: 0,
    branchAWinCounts: new Int32Array(numEntries),
    branchBWinCounts: new Int32Array(numEntries),
    branchAPositionCounts: new Int32Array(numEntries * numEntries),
    branchBPositionCounts: new Int32Array(numEntries * numEntries),
    branchAWeightedWinCounts: new Float64Array(numEntries),
    branchBWeightedWinCounts: new Float64Array(numEntries),
    branchAWeightedPositionCounts: new Float64Array(numEntries * numEntries),
    branchBWeightedPositionCounts: new Float64Array(numEntries * numEntries),
    branchATotalWeight: 0,
    branchBTotalWeight: 0,
  }));
}

function buildPreviewGames(
  entries: Entry[],
  result: SimulationResult,
  previewGames: PreviewGameMeta[],
): GeneratedScenarioGamePreview[] {
  if (previewGames.length === 0 || result.totalScenarios === 0) {
    return [];
  }

  const numEntries = entries.length;
  const accumulators = createPreviewAccumulators(previewGames, numEntries);
  const supportsWeighted = result.totalWeight > 0;

  for (let scenarioIndex = 0; scenarioIndex < result.totalScenarios; scenarioIndex += 1) {
    const scenarioOffset = scenarioIndex * numEntries;
    const scenarioMass = supportsWeighted ? result.scenarioProbabilityMasses[scenarioIndex] : 0;

    for (const accumulator of accumulators) {
      const isBranchB = Boolean(scenarioIndex & accumulator.mask);
      const winCounts = isBranchB ? accumulator.branchBWinCounts : accumulator.branchAWinCounts;
      const positionCounts = isBranchB
        ? accumulator.branchBPositionCounts
        : accumulator.branchAPositionCounts;
      const weightedWinCounts = isBranchB
        ? accumulator.branchBWeightedWinCounts
        : accumulator.branchAWeightedWinCounts;
      const weightedPositionCounts = isBranchB
        ? accumulator.branchBWeightedPositionCounts
        : accumulator.branchAWeightedPositionCounts;

      if (isBranchB) {
        accumulator.branchBScenarios += 1;
        accumulator.branchBTotalWeight += scenarioMass;
      } else {
        accumulator.branchAScenarios += 1;
        accumulator.branchATotalWeight += scenarioMass;
      }

      for (let entryIndex = 0; entryIndex < numEntries; entryIndex += 1) {
        const position = result.scenarioPositions[scenarioOffset + entryIndex];
        if (position <= 0) {
          continue;
        }

        const positionOffset = (entryIndex * numEntries) + (position - 1);
        positionCounts[positionOffset] += 1;
        if (supportsWeighted) {
          weightedPositionCounts[positionOffset] += scenarioMass;
        }

        if (position === 1) {
          winCounts[entryIndex] += 1;
          if (supportsWeighted) {
            weightedWinCounts[entryIndex] += scenarioMass;
          }
        }
      }
    }
  }

  return accumulators.map((accumulator) => ({
    gameIndex: accumulator.gameId,
    round: accumulator.round,
    roundLabel: accumulator.roundLabel,
    teamA: accumulator.teamA,
    teamB: accumulator.teamB,
    outcomeA: {
      winnerTeamId: accumulator.teamA.teamId,
      totalScenarios: accumulator.branchAScenarios,
      weightedProbabilityPct: supportsWeighted && result.totalWeight > 0
        ? (accumulator.branchATotalWeight / result.totalWeight) * 100
        : undefined,
      entries: buildGeneratedEntries(
        entries,
        accumulator.branchAScenarios,
        accumulator.branchAWinCounts,
        accumulator.branchAPositionCounts,
        accumulator.branchATotalWeight,
        accumulator.branchAWeightedWinCounts,
        accumulator.branchAWeightedPositionCounts,
      ),
    },
    outcomeB: {
      winnerTeamId: accumulator.teamB.teamId,
      totalScenarios: accumulator.branchBScenarios,
      weightedProbabilityPct: supportsWeighted && result.totalWeight > 0
        ? (accumulator.branchBTotalWeight / result.totalWeight) * 100
        : undefined,
      entries: buildGeneratedEntries(
        entries,
        accumulator.branchBScenarios,
        accumulator.branchBWinCounts,
        accumulator.branchBPositionCounts,
        accumulator.branchBTotalWeight,
        accumulator.branchBWeightedWinCounts,
        accumulator.branchBWeightedPositionCounts,
      ),
    },
  }));
}

export function buildBrowserScenarioArtifact({
  entries,
  liveBracketData,
  masterBracket,
  result,
  teamSeoMap = {},
  weighting = null,
}: BrowserExactArtifactConfig): GeneratedScenarioArtifact {
  const remainingGames = getRemainingGames(masterBracket);
  const previewGames = buildPreviewGameMeta(
    liveBracketData,
    masterBracket,
    remainingGames,
    teamSeoMap,
  );
  const picksByEntryId = buildPicksByEntryId(entries, previewGames);

  return {
    schemaVersion: GENERATED_ARTIFACT_SCHEMA_VERSION,
    importedAt: new Date().toISOString(),
    sourceGeneratedAt: new Date().toISOString(),
    totalScenarios: result.totalScenarios,
    unresolvedGameCount: remainingGames.length,
    assumptionSummary: 'Exact browser simulation of the current remaining bracket tree.',
    reportUrl: null,
    weighting: weighting
      ? {
          summaryLabel: weighting.summaryLabel ?? 'Team strength ratings',
          sourceNote: weighting.sourceNote ?? 'Weighted branch probabilities are available for this tree.',
        }
      : null,
    entries: buildGeneratedEntries(
      entries,
      result.totalScenarios,
      result.winCounts,
      result.positionCounts,
      result.totalWeight,
      result.weightedWinCounts,
      result.weightedPositionCounts,
      picksByEntryId,
    ),
    previewGames: buildPreviewGames(entries, result, previewGames),
  };
}
