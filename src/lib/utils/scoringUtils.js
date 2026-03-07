import {
  formatTeamSelection,
  getPointsForSelectionIndex,
} from '$lib/utils/bracketUtils';

function getEntrySelections(entry) {
  return entry.selections || entry.brackets?.[0]?.selections || [];
}

function isEntrySubmitted(entry) {
  return entry.is_submitted !== undefined ? entry.is_submitted : entry.brackets?.[0]?.is_submitted;
}

function getEntryIdentity(entry) {
  return {
    entryId: entry.entryId || entry.id,
    firstName: entry.firstName || entry.first_name,
    lastName: entry.lastName || entry.last_name,
  };
}

/**
 * Calculate scores for each user based on the master bracket
 * @param {string[]} masterBracket - The 63-element master bracket
 * @param {Object[]} entries - Array of user entries
 * @returns {Object[]} Array of score objects for each user
 */
export function calculateScores(masterBracket, entries) {
  return entries.map(entry => {
    const selections = getEntrySelections(entry);
    const isSubmitted = isEntrySubmitted(entry);
    const identity = getEntryIdentity(entry);
    
    if (!isSubmitted) {
      return {
        ...identity,
        round1: 0,
        round2: 0,
        round3: 0,
        round4: 0,
        round5: 0,
        round6: 0,
        total: 0,
        correctGames: 0
      };
    }
    
    let score1 = 0, score2 = 0, score3 = 0, score4 = 0, score5 = 0, score6 = 0, games = 0;
    
    // Compare user selections with master bracket
    for (let i = 0; i < selections.length; i++) {
      if (selections[i] === masterBracket[i] && masterBracket[i] !== '') {
        const points = getPointsForSelectionIndex(i);
        if (i < 32) score1 += points;
        else if (i < 48) score2 += points;
        else if (i < 56) score3 += points;
        else if (i < 60) score4 += points;
        else if (i < 62) score5 += points;
        else if (i === 62) score6 += points;
        games += 1;
      }
    }
    
    const total = score1 + score2 + score3 + score4 + score5 + score6;
    
    return {
      ...identity,
      round1: score1,
      round2: score2,
      round3: score3,
      round4: score4,
      round5: score5,
      round6: score6,
      total: total,
      correctGames: games
    };
  });
}

/**
 * Calculate potential remaining points for each user
 * @param {string[]} masterBracket - The 63-element master bracket
 * @param {string[]} eliminatedTeams - List of eliminated team strings
 * @param {Object[]} entries - Array of user entries
 * @returns {Object[]} Array of potential point objects for each user
 */
export function calculatePotential(masterBracket, eliminatedTeams, entries) {
  const eliminatedTeamSet = new Set(eliminatedTeams);

  return entries.map(entry => {
    const selections = getEntrySelections(entry);
    const isSubmitted = isEntrySubmitted(entry);
    const identity = getEntryIdentity(entry);
    
    if (!isSubmitted) {
      return {
        ...identity,
        potential: 0
      };
    }
    
    let potential = 192; // Maximum possible points
    
    // Subtract points for eliminated teams
    for (const teamStr of eliminatedTeamSet) {
      for (let i = 0; i < selections.length; i++) {
        if (selections[i] === teamStr) {
          potential -= getPointsForSelectionIndex(i);
        }
      }
    }
    
    // Subtract points for already correct picks
    for (let i = 0; i < selections.length; i++) {
      if (selections[i] === masterBracket[i] && masterBracket[i] !== '' && !eliminatedTeamSet.has(selections[i])) {
        potential -= getPointsForSelectionIndex(i);
      }
    }
    
    return {
      ...identity,
      potential: potential
    };
  });
}

/**
 * Build a list of eliminated team strings from the live bracket data
 * @param {Object} liveBracketData - The live bracket data object
 * @returns {string[]} Array of eliminated team strings
 */
export function getEliminatedTeams(liveBracketData) {
  const eliminatedTeams = new Set();
  
  // First add teams that have lost games to the eliminated set
  for (let i = 1; i <= 63; i++) {
    const match = liveBracketData.matches[i];
    // Only consider matches that have been played (have a winner)
    if (match?.winner) {
      const losingTeam = match.winner === 'A' ? match.teamB : match.teamA;
      if (losingTeam) {
        eliminatedTeams.add(formatTeamSelection(losingTeam));
      }
    }
  }
  
  return Array.from(eliminatedTeams);
} 

export function sortLeaderboardScores(scores) {
  return [...scores].sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }

    if ((b.potential ?? 0) !== (a.potential ?? 0)) {
      return (b.potential ?? 0) - (a.potential ?? 0);
    }

    const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }

    return (a.firstName || '').localeCompare(b.firstName || '');
  });
}

export function buildLeaderboardRanks(sortedScores) {
  return sortedScores.reduce((acc, score, index) => {
    if (index === 0) {
      acc.push(1);
      return acc;
    }

    const previous = sortedScores[index - 1];
    if (score.total === previous.total && (score.potential ?? 0) === (previous.potential ?? 0)) {
      acc.push(acc[index - 1]);
      return acc;
    }

    acc.push(index + 1);
    return acc;
  }, []);
}

export function assignPositions(scores) {
  const sortedScores = [...scores].sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }

    return (b.potential ?? 0) - (a.potential ?? 0);
  });

  let currentPosition = 1;
  let currentScore = null;
  let currentPotential = null;
  let tieGroup = [];
  const positions = new Map();

  for (const score of sortedScores) {
    if (currentScore === null || score.total !== currentScore || (score.potential ?? 0) !== currentPotential) {
      if (tieGroup.length > 0) {
        for (const tiedScore of tieGroup) {
          positions.set(tiedScore.entryId, currentPosition);
        }
        currentPosition += tieGroup.length;
      }

      currentScore = score.total;
      currentPotential = score.potential ?? 0;
      tieGroup = [score];
      continue;
    }

    tieGroup.push(score);
  }

  if (tieGroup.length > 0) {
    for (const tiedScore of tieGroup) {
      positions.set(tiedScore.entryId, currentPosition);
    }
  }

  return positions;
}