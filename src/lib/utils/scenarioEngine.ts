import type { Entry, LiveBracketData, SimulationConfig, SimulationResult, RootForConfig } from '$lib/types';
import { getPointsForSelectionIndex, parseTeamSelection } from '$lib/utils/bracketUtils';
import { resolveTeamSeoName } from '$lib/utils/teamColorUtils';

const BRACKET_SELECTION_COUNT = 63;
const MAX_TOTAL_SCORE = 192;
const ROUND_OF_32_START_GAME = 32;
const ROUND_OF_32_END_GAME = 48;
const SWEET_SIXTEEN_START_GAME = 48;
const SWEET_SIXTEEN_END_GAME = 56;

export function getHeatmapColor(probability: number): string {
  if (probability === 0) {
    return 'rgba(50, 50, 50, 0.2)';
  }
  const hue = Math.min(120, Math.round(probability * 1.2));
  const alpha = Math.min(0.9, 0.2 + (probability / 100) * 0.7);
  return `hsla(${hue}, 75%, 50%, ${alpha})`;
}

export function getRowHeatmapColor(probability: number, maxInRow: number): string {
  if (probability === 0) {
    return 'rgba(50, 50, 50, 0.2)';
  }
  const relativeStrength = probability / maxInRow;
  const hue = Math.min(120, Math.round(relativeStrength * 120));
  const alpha = Math.min(0.85, 0.2 + relativeStrength * 0.65);
  return `hsla(${hue}, 65%, 45%, ${alpha})`;
}

export function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

interface PositionProbabilityEntry {
  positionProbabilities: Record<string, number>;
  [key: string]: unknown;
}

export function getSortedPositionData(positionProbabilities: PositionProbabilityEntry[]): PositionProbabilityEntry[] {
  return [...positionProbabilities].sort((a, b) => {
    const aHighestPos = Object.entries(a.positionProbabilities)
      .filter(([_, probability]) => probability > 0)
      .sort(([posA], [posB]) => Number(posA) - Number(posB))[0];

    const bHighestPos = Object.entries(b.positionProbabilities)
      .filter(([_, probability]) => probability > 0)
      .sort(([posA], [posB]) => Number(posA) - Number(posB))[0];

    if (!aHighestPos) return 1;
    if (!bHighestPos) return -1;

    const positionDiff = Number(aHighestPos[0]) - Number(bHighestPos[0]);
    if (positionDiff !== 0) return positionDiff;

    return bHighestPos[1] - aHighestPos[1];
  });
}

export function getTeamsForGame(gameId: number, bracket: string[], liveBracketData: LiveBracketData): { teamA: string | null; teamB: string | null } {
  if (gameId >= ROUND_OF_32_START_GAME && gameId < SWEET_SIXTEEN_END_GAME) {
    const match = liveBracketData.matches[gameId + 1];
    return {
      teamA: match?.teamA ? `${match.teamA.seed} ${match.teamA.name}` : null,
      teamB: match?.teamB ? `${match.teamB.seed} ${match.teamB.name}` : null,
    };
  }

  const prev = getPreviousGameIds(gameId);
  if (!prev) return { teamA: null, teamB: null };

  return {
    teamA: bracket[prev.game1] || null,
    teamB: bracket[prev.game2] || null,
  };
}

function getPreviousGameIds(gameId: number): { game1: number; game2: number } | null {
  if (gameId >= SWEET_SIXTEEN_START_GAME && gameId < SWEET_SIXTEEN_END_GAME) {
    const game1 = ROUND_OF_32_START_GAME + (gameId - SWEET_SIXTEEN_START_GAME) * 2;
    return { game1, game2: game1 + 1 };
  }
  if (gameId >= 56 && gameId < 60) {
    const game1 = 48 + (gameId - 56) * 2;
    return { game1, game2: game1 + 1 };
  }
  if (gameId >= 60 && gameId < 62) {
    const game1 = 56 + (gameId - 60) * 2;
    return { game1, game2: game1 + 1 };
  }
  if (gameId === 62) {
    return { game1: 60, game2: 61 };
  }
  return null;
}

interface CompactSimulationState {
  entrySelectionIds: Uint16Array;
  submittedEntries: Uint8Array;
  bracketIds: Uint16Array;
  liveMatchTeamAIds: Uint16Array;
  liveMatchTeamBIds: Uint16Array;
  pointValues: Uint8Array;
  unresolvedMask: Uint8Array;
  selectionRatings: number[];
}

function getSelectionIdentity(
  selection: string | null | undefined,
  teamSeoMap: Record<string, string>,
): { identity: string; seoName: string } | null {
  const parsed = parseTeamSelection(selection);
  if (!parsed) {
    return null;
  }

  const seoName = resolveTeamSeoName(parsed.name, teamSeoMap[parsed.name]);
  return {
    identity: `${parsed.seed}:${seoName || parsed.name.toLowerCase()}`,
    seoName,
  };
}

function getTeamIdentity(
  seed: number | null | undefined,
  name: string | null | undefined,
  seoName?: string | null,
): { identity: string; seoName: string } | null {
  if (!seed || !name) {
    return null;
  }

  const resolvedSeoName = resolveTeamSeoName(name, seoName ?? undefined);
  return {
    identity: `${seed}:${resolvedSeoName || name.toLowerCase()}`,
    seoName: resolvedSeoName,
  };
}

function createSelectionIdResolver(
  teamSeoMap: Record<string, string>,
  weighting: SimulationConfig['weighting'] = null,
) {
  const selectionIds = new Map<string, number>();
  const selectionRatings: number[] = [Number.NaN];
  let nextId = 1;

  function getOrCreateId(selection: { identity: string; seoName: string } | null): number {
    if (!selection) {
      return 0;
    }

    const existing = selectionIds.get(selection.identity);
    if (existing) {
      return existing;
    }

    const created = nextId++;
    selectionIds.set(selection.identity, created);
    selectionRatings[created] = Number.isFinite(weighting?.ratingsBySeoName?.[selection.seoName])
      ? Number(weighting?.ratingsBySeoName?.[selection.seoName])
      : Number.NaN;
    return created;
  }

  return {
    getSelectionId(selection: string | null | undefined): number {
      return getOrCreateId(getSelectionIdentity(selection, teamSeoMap));
    },
    getTeamId(seed: number | null | undefined, name: string | null | undefined, seoName?: string | null): number {
      return getOrCreateId(getTeamIdentity(seed, name, seoName));
    },
    selectionRatings,
  };
}

function buildCompactSimulationState({
  masterBracket,
  entries,
  filteredRemainingGames,
  selectedWinners,
  liveBracketData,
  teamSeoMap = {},
  weighting = null,
}: SimulationConfig): CompactSimulationState {
  const resolver = createSelectionIdResolver(teamSeoMap, weighting);
  const entrySelectionIds = new Uint16Array(entries.length * BRACKET_SELECTION_COUNT);
  const submittedEntries = new Uint8Array(entries.length);
  const bracketIds = new Uint16Array(BRACKET_SELECTION_COUNT);
  const liveMatchTeamAIds = new Uint16Array(BRACKET_SELECTION_COUNT);
  const liveMatchTeamBIds = new Uint16Array(BRACKET_SELECTION_COUNT);
  const pointValues = new Uint8Array(BRACKET_SELECTION_COUNT);
  const unresolvedMask = new Uint8Array(BRACKET_SELECTION_COUNT);

  for (let gameId = 0; gameId < BRACKET_SELECTION_COUNT; gameId += 1) {
    pointValues[gameId] = getPointsForSelectionIndex(gameId);
    bracketIds[gameId] = resolver.getSelectionId(masterBracket[gameId]);
  }

  for (const [gameId, winner] of Object.entries(selectedWinners)) {
    bracketIds[Number.parseInt(gameId, 10)] = resolver.getSelectionId(winner);
  }

  for (const gameId of filteredRemainingGames) {
    unresolvedMask[gameId] = 1;
  }

  for (let gameId = ROUND_OF_32_START_GAME; gameId < SWEET_SIXTEEN_END_GAME; gameId += 1) {
    const match = liveBracketData.matches[gameId + 1];
    liveMatchTeamAIds[gameId] = resolver.getTeamId(match?.teamA?.seed, match?.teamA?.name, match?.teamA?.seoName);
    liveMatchTeamBIds[gameId] = resolver.getTeamId(match?.teamB?.seed, match?.teamB?.name, match?.teamB?.seoName);
  }

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const entry = entries[entryIndex];
    submittedEntries[entryIndex] = entry.is_submitted ? 1 : 0;
    const selections = entry.selections || [];
    const offset = entryIndex * BRACKET_SELECTION_COUNT;

    for (let gameId = 0; gameId < BRACKET_SELECTION_COUNT; gameId += 1) {
      entrySelectionIds[offset + gameId] = resolver.getSelectionId(selections[gameId]);
    }
  }

  return {
    entrySelectionIds,
    submittedEntries,
    bracketIds,
    liveMatchTeamAIds,
    liveMatchTeamBIds,
    pointValues,
    unresolvedMask,
    selectionRatings: resolver.selectionRatings,
  };
}

function log5Probability(teamA: number, teamB: number): number {
  const a = Math.min(0.999, Math.max(0.001, teamA));
  const b = Math.min(0.999, Math.max(0.001, teamB));
  const denominator = a + b - (2 * a * b);
  if (Math.abs(denominator) < Number.EPSILON) {
    return 0.5;
  }

  return Math.min(0.999, Math.max(0.001, (a - a * b) / denominator));
}

function getWeightedGameWinProbability(
  weighting: SimulationConfig['weighting'],
  selectionRatings: number[],
  teamAId: number,
  teamBId: number,
): number {
  if (!weighting || teamAId <= 0 || teamBId <= 0) {
    return 0.5;
  }

  const ratingA = selectionRatings[teamAId];
  const ratingB = selectionRatings[teamBId];
  if (!Number.isFinite(ratingA) || !Number.isFinite(ratingB)) {
    return 0.5;
  }

  if (weighting.kind === 'log5') {
    return log5Probability(ratingA, ratingB);
  }

  const scale = Math.max(weighting.scale ?? 10, 0.001);
  const exponent = -((ratingA - ratingB) / scale);
  return Math.min(0.999, Math.max(0.001, 1 / (1 + Math.exp(exponent))));
}

function buildBaseScores(
  entries: Entry[],
  entrySelectionIds: Uint16Array,
  submittedEntries: Uint8Array,
  bracketIds: Uint16Array,
  pointValues: Uint8Array,
  unresolvedMask: Uint8Array,
): Int16Array {
  const baseScores = new Int16Array(entries.length);

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    if (!submittedEntries[entryIndex]) {
      continue;
    }

    let total = 0;
    const offset = entryIndex * BRACKET_SELECTION_COUNT;

    for (let gameId = 0; gameId < BRACKET_SELECTION_COUNT; gameId += 1) {
      if (unresolvedMask[gameId]) {
        continue;
      }

      const winnerId = bracketIds[gameId];
      if (winnerId !== 0 && entrySelectionIds[offset + gameId] === winnerId) {
        total += pointValues[gameId];
      }
    }

    baseScores[entryIndex] = total;
  }

  return baseScores;
}

function recordScenarioResults(
  entries: Entry[],
  entrySelectionIds: Uint16Array,
  submittedEntries: Uint8Array,
  filteredRemainingGames: number[],
  bracketIds: Uint16Array,
  baseScores: Int16Array,
  pointValues: Uint8Array,
  scenarioScores: Int16Array,
  bucketCounts: Uint16Array,
  positionByScore: Uint16Array,
  winCountArr: Int32Array,
  weightedWinCountArr: Float64Array,
  positionCountArr: Int32Array,
  weightedPositionCountArr: Float64Array,
  scenarioPositions: Uint8Array,
  scenarioProbabilityMasses: Float64Array,
  scenarioIndex: number,
  probabilityMass: number,
): void {
  bucketCounts.fill(0);

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    let total = baseScores[entryIndex];

    if (submittedEntries[entryIndex]) {
      const offset = entryIndex * BRACKET_SELECTION_COUNT;
      for (let gameIdx = 0; gameIdx < filteredRemainingGames.length; gameIdx += 1) {
        const gameId = filteredRemainingGames[gameIdx];
        const winnerId = bracketIds[gameId];
        if (winnerId !== 0 && entrySelectionIds[offset + gameId] === winnerId) {
          total += pointValues[gameId];
        }
      }
    }

    scenarioScores[entryIndex] = total;
    bucketCounts[total] += 1;
  }

  positionByScore.fill(0);
  let nextPosition = 1;
  for (let score = MAX_TOTAL_SCORE; score >= 0; score -= 1) {
    const count = bucketCounts[score];
    if (count === 0) {
      continue;
    }

    positionByScore[score] = nextPosition;
    nextPosition += count;
  }

  scenarioProbabilityMasses[scenarioIndex] = probabilityMass;
  const baseOffset = scenarioIndex * entries.length;
  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const position = positionByScore[scenarioScores[entryIndex]];
    scenarioPositions[baseOffset + entryIndex] = position;
    const posIdx = (entryIndex * entries.length) + (position - 1);
    positionCountArr[posIdx] += 1;
    if (position === 1) {
      winCountArr[entryIndex] += 1;
      if (probabilityMass > 0) {
        weightedWinCountArr[entryIndex] += probabilityMass;
      }
    }
    if (probabilityMass > 0) {
      weightedPositionCountArr[posIdx] += probabilityMass;
    }
  }
}

function getCompactTeamsForGame(
  gameId: number,
  bracketIds: Uint16Array,
  liveMatchTeamAIds: Uint16Array,
  liveMatchTeamBIds: Uint16Array,
): { teamAId: number; teamBId: number } {
  if (gameId >= ROUND_OF_32_START_GAME && gameId < SWEET_SIXTEEN_END_GAME) {
    return {
      teamAId: liveMatchTeamAIds[gameId],
      teamBId: liveMatchTeamBIds[gameId],
    };
  }

  const prev = getPreviousGameIds(gameId);
  if (!prev) {
    return { teamAId: 0, teamBId: 0 };
  }

  return {
    teamAId: bracketIds[prev.game1],
    teamBId: bracketIds[prev.game2],
  };
}

export function runSimulation({
  masterBracket,
  entries,
  filteredRemainingGames,
  selectedWinners,
  liveBracketData,
  teamSeoMap = {},
  weighting = null,
}: SimulationConfig): SimulationResult {
  const numEntries = entries.length;
  const numGames = filteredRemainingGames.length;
  const totalScenarios = 1 << numGames;

  const winCountArr = new Int32Array(numEntries);
  const weightedWinCountArr = new Float64Array(numEntries);
  const positionCountArr = new Int32Array(numEntries * numEntries);
  const weightedPositionCountArr = new Float64Array(numEntries * numEntries);
  const scenarioPositions = new Uint8Array(totalScenarios * numEntries);
  const scenarioProbabilityMasses = new Float64Array(totalScenarios);
  const compactState = buildCompactSimulationState({
    masterBracket,
    entries,
    filteredRemainingGames,
    selectedWinners,
    liveBracketData,
    teamSeoMap,
    weighting,
  });
  const baseScores = buildBaseScores(
    entries,
    compactState.entrySelectionIds,
    compactState.submittedEntries,
    compactState.bracketIds,
    compactState.pointValues,
    compactState.unresolvedMask,
  );
  const scenarioScores = new Int16Array(numEntries);
  const bucketCounts = new Uint16Array(MAX_TOTAL_SCORE + 1);
  const positionByScore = new Uint16Array(MAX_TOTAL_SCORE + 1);

  let scenarioIndex = 0;
  let totalWeight = 0;

  function explore(gameIdx: number, probabilityMass: number): void {
    if (gameIdx >= numGames) {
      recordScenarioResults(
        entries,
        compactState.entrySelectionIds,
        compactState.submittedEntries,
        filteredRemainingGames,
        compactState.bracketIds,
        baseScores,
        compactState.pointValues,
        scenarioScores,
        bucketCounts,
        positionByScore,
        winCountArr,
        weightedWinCountArr,
        positionCountArr,
        weightedPositionCountArr,
        scenarioPositions,
        scenarioProbabilityMasses,
        scenarioIndex,
        probabilityMass,
      );
      totalWeight += probabilityMass;
      scenarioIndex++;
      return;
    }

    const currentGame = filteredRemainingGames[gameIdx];
    const teams = getCompactTeamsForGame(
      currentGame,
      compactState.bracketIds,
      compactState.liveMatchTeamAIds,
      compactState.liveMatchTeamBIds,
    );
    if (!teams.teamAId || !teams.teamBId) return;

    const teamAProbability = getWeightedGameWinProbability(
      weighting,
      compactState.selectionRatings,
      teams.teamAId,
      teams.teamBId,
    );
    const saved = compactState.bracketIds[currentGame];
    compactState.bracketIds[currentGame] = teams.teamAId;
    explore(gameIdx + 1, probabilityMass * teamAProbability);

    compactState.bracketIds[currentGame] = teams.teamBId;
    explore(gameIdx + 1, probabilityMass * (1 - teamAProbability));

    compactState.bracketIds[currentGame] = saved;
  }

  explore(0, weighting ? 1 : 0);

  return {
    totalScenarios,
    totalWeight,
    winCounts: winCountArr,
    weightedWinCounts: weightedWinCountArr,
    positionCounts: positionCountArr,
    weightedPositionCounts: weightedPositionCountArr,
    scenarioPositions,
    scenarioProbabilityMasses,
  };
}

export interface RootForResult {
  countIfA: number;
  countIfB: number;
  totalA: number;
  totalB: number;
  weightIfA: number;
  weightIfB: number;
  totalWeightA: number;
  totalWeightB: number;
}

export function aggregateRootFor({ filteredRemainingGames, scenarioPositions, numEntries, totalScenarios, entryIndex, targetPosition, scenarioProbabilityMasses, totalWeight }: RootForConfig): Map<number, RootForResult> {
  const numGames = filteredRemainingGames.length;
  const results = new Map<number, RootForResult>();
  const countIfA = new Int32Array(numGames);
  const countIfB = new Int32Array(numGames);
  const weightIfA = new Float64Array(numGames);
  const weightIfB = new Float64Array(numGames);
  const totalWeightA = new Float64Array(numGames);
  const totalWeightB = new Float64Array(numGames);
  const halfScenarioCount = numGames > 0 ? totalScenarios / 2 : 0;
  const scenarioStride = numEntries;
  const hasWeights = scenarioProbabilityMasses != null && (totalWeight ?? 0) > 0;

  if (hasWeights) {
    for (let scenarioIndex = 0; scenarioIndex < totalScenarios; scenarioIndex++) {
      const mass = scenarioProbabilityMasses![scenarioIndex];
      for (let gameIdx = 0; gameIdx < numGames; gameIdx++) {
        const bitMask = 1 << (numGames - 1 - gameIdx);
        if (scenarioIndex & bitMask) {
          totalWeightB[gameIdx] += mass;
        } else {
          totalWeightA[gameIdx] += mass;
        }
      }
    }
  }

  for (let scenarioIndex = 0; scenarioIndex < totalScenarios; scenarioIndex++) {
    const position = scenarioPositions[(scenarioIndex * scenarioStride) + entryIndex];
    if (position !== targetPosition) {
      continue;
    }

    const mass = hasWeights ? scenarioProbabilityMasses![scenarioIndex] : 0;

    for (let gameIdx = 0; gameIdx < numGames; gameIdx++) {
      const bitMask = 1 << (numGames - 1 - gameIdx);
      if (scenarioIndex & bitMask) {
        countIfB[gameIdx] += 1;
        if (hasWeights) weightIfB[gameIdx] += mass;
      } else {
        countIfA[gameIdx] += 1;
        if (hasWeights) weightIfA[gameIdx] += mass;
      }
    }
  }

  for (let gameIdx = 0; gameIdx < numGames; gameIdx++) {
    results.set(filteredRemainingGames[gameIdx], {
      countIfA: countIfA[gameIdx],
      countIfB: countIfB[gameIdx],
      totalA: halfScenarioCount,
      totalB: halfScenarioCount,
      weightIfA: weightIfA[gameIdx],
      weightIfB: weightIfB[gameIdx],
      totalWeightA: totalWeightA[gameIdx],
      totalWeightB: totalWeightB[gameIdx],
    });
  }

  return results;
}
