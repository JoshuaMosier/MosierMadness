import { calculateScores, assignPositions } from '$lib/utils/scoringUtils';

/**
 * Get an HSL-alpha heatmap color for a probability value (0–100).
 * Green for high, red for low, dark gray for zero.
 */
export function getHeatmapColor(probability) {
  if (probability === 0) {
    return 'rgba(50, 50, 50, 0.2)';
  }
  const hue = Math.min(120, Math.round(probability * 1.2));
  const alpha = Math.min(0.9, 0.2 + (probability / 100) * 0.7);
  return `hsla(${hue}, 75%, 50%, ${alpha})`;
}

/**
 * Get a heatmap color relative to the row's maximum probability.
 */
export function getRowHeatmapColor(probability, maxInRow) {
  if (probability === 0) {
    return 'rgba(50, 50, 50, 0.2)';
  }
  const relativeStrength = probability / maxInRow;
  const hue = Math.min(120, Math.round(relativeStrength * 120));
  const alpha = Math.min(0.85, 0.2 + relativeStrength * 0.65);
  return `hsla(${hue}, 65%, 45%, ${alpha})`;
}

/**
 * Return the ordinal suffix for a number (st, nd, rd, th).
 */
export function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

/**
 * Sort position probability data by best possible finish, then by probability of that finish.
 */
export function getSortedPositionData(positionProbabilities) {
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

/**
 * Resolve which two teams play in a given bracket game.
 * Sweet 16 (48–55): teams from liveBracketData.matches
 * Elite 8+: teams from winners of feeder games in the bracket array
 *
 * @param {number} gameId - Bracket index (48–62)
 * @param {string[]} bracket - 63-element master bracket array
 * @param {Object} liveBracketData - { matches: { [matchId]: { teamA, teamB, ... } } }
 * @returns {{ teamA: string|null, teamB: string|null }}
 */
export function getTeamsForGame(gameId, bracket, liveBracketData) {
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

function getPreviousGameIds(gameId) {
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

/**
 * Run the full 2^N scenario simulation.
 *
 * @param {Object} config
 * @param {string[]} config.masterBracket - 63-element bracket
 * @param {Object[]} config.entries - User entries with selections
 * @param {number[]} config.filteredRemainingGames - Game indices to simulate (no user-selected winners)
 * @param {Object} config.selectedWinners - { gameId: winnerString } for locked-in outcomes
 * @param {Object} config.liveBracketData - Live bracket for Sweet 16 team resolution
 * @returns {{ totalScenarios: number, winCounts: Map, positionCounts: Map, scenarioPositions: Uint8Array }}
 */
export function runSimulation({ masterBracket, entries, filteredRemainingGames, selectedWinners, liveBracketData }) {
  const numEntries = entries.length;
  const numGames = filteredRemainingGames.length;
  const totalScenarios = 1 << numGames; // 2^numGames

  // Pre-build entry ID → index map for O(1) lookups in base case
  const entryIdToIndex = new Map();
  for (let i = 0; i < numEntries; i++) {
    entryIdToIndex.set(entries[i].entryId, i);
  }

  // Initialize counters
  const winCountArr = new Int32Array(numEntries);
  // positionCountArr[entryIndex * numEntries + (position-1)] = count
  const positionCountArr = new Int32Array(numEntries * numEntries);
  // scenarioPositions[scenarioIndex * numEntries + entryIndex] = position (1-based)
  const scenarioPositions = new Uint8Array(totalScenarios * numEntries);

  // Build working bracket with selected winners applied
  const bracket = [...masterBracket];
  for (const [gameId, winner] of Object.entries(selectedWinners)) {
    bracket[parseInt(gameId)] = winner;
  }

  let scenarioIndex = 0;

  function explore(gameIdx) {
    if (gameIdx >= numGames) {
      // Base case: score this scenario
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

    // Team A wins (bit = 0)
    const saved = bracket[currentGame];
    bracket[currentGame] = teams.teamA;
    explore(gameIdx + 1);

    // Team B wins (bit = 1)
    bracket[currentGame] = teams.teamB;
    explore(gameIdx + 1);

    // Backtrack
    bracket[currentGame] = saved;
  }

  explore(0);

  // Convert arrays to Maps for the component's existing interface
  const winCounts = new Map();
  const positionCounts = new Map();
  for (let i = 0; i < numEntries; i++) {
    const entryId = entries[i].entryId;
    winCounts.set(entryId, winCountArr[i]);

    const positions = {};
    for (let p = 0; p < numEntries; p++) {
      positions[p + 1] = positionCountArr[i * numEntries + p];
    }
    positionCounts.set(entryId, positions);
  }

  return { totalScenarios, winCounts, positionCounts, scenarioPositions };
}

/**
 * Aggregate Root For data from stored scenario positions.
 * For each remaining game, partitions scenarios by that game's outcome
 * and counts how many put the target user at the target position.
 *
 * @param {Object} config
 * @param {number[]} config.filteredRemainingGames - Game indices that were simulated
 * @param {Uint8Array} config.scenarioPositions - Flat array from runSimulation
 * @param {number} config.numEntries - Number of entries
 * @param {number} config.totalScenarios - 2^numGames
 * @param {number} config.entryIndex - Index of the selected user in entries array
 * @param {number} config.targetPosition - Position to optimize for (1-based)
 * @returns {Map<number, { countIfA: number, countIfB: number, totalA: number, totalB: number }>}
 */
export function aggregateRootFor({ filteredRemainingGames, scenarioPositions, numEntries, totalScenarios, entryIndex, targetPosition }) {
  const numGames = filteredRemainingGames.length;
  const results = new Map();

  for (let j = 0; j < numGames; j++) {
    const gameId = filteredRemainingGames[j];
    // Bit position for this game: in the DFS order, game at index j
    // corresponds to the (numGames-1-j)th bit of the scenario index.
    // Scenario index = choice[0]*2^(N-1) + choice[1]*2^(N-2) + ... + choice[N-1]*2^0
    // So choice[j] = (scenarioIndex >> (numGames-1-j)) & 1
    const bitMask = 1 << (numGames - 1 - j);

    let countIfA = 0;
    let countIfB = 0;
    let totalA = 0;
    let totalB = 0;

    for (let s = 0; s < totalScenarios; s++) {
      const pos = scenarioPositions[s * numEntries + entryIndex];
      if (s & bitMask) {
        // Team B won this game
        totalB++;
        if (pos === targetPosition) countIfB++;
      } else {
        // Team A won this game
        totalA++;
        if (pos === targetPosition) countIfA++;
      }
    }

    results.set(gameId, { countIfA, countIfB, totalA, totalB });
  }

  return results;
}
