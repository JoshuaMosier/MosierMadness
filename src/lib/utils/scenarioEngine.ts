import type { Entry, LiveBracketData, SimulationConfig, SimulationResult, RootForConfig } from '$lib/types';
import { calculateScores, assignPositions } from '$lib/utils/scoringUtils';

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
  if (gameId >= 48 && gameId < 56) {
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

export function runSimulation({ masterBracket, entries, filteredRemainingGames, selectedWinners, liveBracketData }: SimulationConfig): SimulationResult {
  const numEntries = entries.length;
  const numGames = filteredRemainingGames.length;
  const totalScenarios = 1 << numGames;

  const entryIdToIndex = new Map<string, number>();
  for (let i = 0; i < numEntries; i++) {
    entryIdToIndex.set(entries[i].entryId, i);
  }

  const winCountArr = new Int32Array(numEntries);
  const positionCountArr = new Int32Array(numEntries * numEntries);
  const scenarioPositions = new Uint8Array(totalScenarios * numEntries);

  const bracket = [...masterBracket];
  for (const [gameId, winner] of Object.entries(selectedWinners)) {
    bracket[parseInt(gameId)] = winner;
  }

  let scenarioIndex = 0;

  function explore(gameIdx: number): void {
    if (gameIdx >= numGames) {
      const scores = calculateScores(bracket, entries);
      const positions = assignPositions(scores);

      const base = scenarioIndex * numEntries;
      for (const score of scores) {
        const idx = entryIdToIndex.get(score.entryId);
        const pos = positions.get(score.entryId);
        if (idx !== undefined && pos !== undefined) {
          scenarioPositions[base + idx] = pos;
          if (pos === 1) winCountArr[idx]++;
          positionCountArr[idx * numEntries + (pos - 1)]++;
        }
      }

      scenarioIndex++;
      return;
    }

    const currentGame = filteredRemainingGames[gameIdx];
    const teams = getTeamsForGame(currentGame, bracket, liveBracketData);
    if (!teams.teamA || !teams.teamB) return;

    const saved = bracket[currentGame];
    bracket[currentGame] = teams.teamA;
    explore(gameIdx + 1);

    bracket[currentGame] = teams.teamB;
    explore(gameIdx + 1);

    bracket[currentGame] = saved;
  }

  explore(0);

  const winCounts = new Map<string, number>();
  const positionCounts = new Map<string, Record<number, number>>();
  for (let i = 0; i < numEntries; i++) {
    const entryId = entries[i].entryId;
    winCounts.set(entryId, winCountArr[i]);

    const positions: Record<number, number> = {};
    for (let p = 0; p < numEntries; p++) {
      positions[p + 1] = positionCountArr[i * numEntries + p];
    }
    positionCounts.set(entryId, positions);
  }

  return { totalScenarios, winCounts, positionCounts, scenarioPositions };
}

export function aggregateRootFor({ filteredRemainingGames, scenarioPositions, numEntries, totalScenarios, entryIndex, targetPosition }: RootForConfig): Map<number, { countIfA: number; countIfB: number; totalA: number; totalB: number }> {
  const numGames = filteredRemainingGames.length;
  const results = new Map<number, { countIfA: number; countIfB: number; totalA: number; totalB: number }>();

  for (let j = 0; j < numGames; j++) {
    const gameId = filteredRemainingGames[j];
    const bitMask = 1 << (numGames - 1 - j);

    let countIfA = 0;
    let countIfB = 0;
    let totalA = 0;
    let totalB = 0;

    for (let s = 0; s < totalScenarios; s++) {
      const pos = scenarioPositions[s * numEntries + entryIndex];
      if (s & bitMask) {
        totalB++;
        if (pos === targetPosition) countIfB++;
      } else {
        totalA++;
        if (pos === targetPosition) countIfA++;
      }
    }

    results.set(gameId, { countIfA, countIfB, totalA, totalB });
  }

  return results;
}
