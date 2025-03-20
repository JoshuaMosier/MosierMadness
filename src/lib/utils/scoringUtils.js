/**
 * Calculate scores for each user based on the master bracket
 * @param {string[]} masterBracket - The 63-element master bracket
 * @param {Object[]} entries - Array of user entries
 * @returns {Object[]} Array of score objects for each user
 */
export function calculateScores(masterBracket, entries) {
  return entries.map(entry => {
    // Check if entry has selections and is_submitted properties directly
    // or if it has a brackets array with those properties
    const selections = entry.selections || entry.brackets?.[0]?.selections || [];
    const isSubmitted = entry.is_submitted !== undefined ? entry.is_submitted : entry.brackets?.[0]?.is_submitted;
    
    if (!isSubmitted) {
      return {
        entryId: entry.entryId || entry.id,
        firstName: entry.firstName || entry.first_name,
        lastName: entry.lastName || entry.last_name,
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
        // Award points based on the round
        if (i < 32) {
          score1 += 1;  // Round 1: 1 point
        } else if (i < 48) {
          score2 += 2;  // Round 2: 2 points
        } else if (i < 56) {
          score3 += 4;  // Sweet 16: 4 points
        } else if (i < 60) {
          score4 += 8;  // Elite 8: 8 points
        } else if (i < 62) {
          score5 += 16; // Final Four: 16 points
        } else if (i === 62) {
          score6 += 32; // Championship: 32 points
        }
        games += 1;
      }
    }
    
    const total = score1 + score2 + score3 + score4 + score5 + score6;
    
    return {
      entryId: entry.entryId || entry.id,
      firstName: entry.firstName || entry.first_name,
      lastName: entry.lastName || entry.last_name,
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
  return entries.map(entry => {
    // Check if entry has selections and is_submitted properties directly
    // or if it has a brackets array with those properties
    const selections = entry.selections || entry.brackets?.[0]?.selections || [];
    const isSubmitted = entry.is_submitted !== undefined ? entry.is_submitted : entry.brackets?.[0]?.is_submitted;
    
    if (!isSubmitted) {
      return {
        entryId: entry.entryId || entry.id,
        firstName: entry.firstName || entry.first_name,
        lastName: entry.lastName || entry.last_name,
        potential: 0
      };
    }
    
    let potential = 192; // Maximum possible points
    
    // Subtract points for eliminated teams
    for (const teamStr of eliminatedTeams) {
      for (let i = 0; i < selections.length; i++) {
        if (selections[i] === teamStr) {
          if (i < 32) potential -= 1;
          else if (i < 48) potential -= 2;
          else if (i < 56) potential -= 4;
          else if (i < 60) potential -= 8;
          else if (i < 62) potential -= 16;
          else if (i === 62) potential -= 32;
        }
      }
    }
    
    // Subtract points for already correct picks
    for (let i = 0; i < selections.length; i++) {
      if (selections[i] === masterBracket[i] && masterBracket[i] !== '' && !eliminatedTeams.includes(selections[i])) {
        if (i < 32) potential -= 1;
        else if (i < 48) potential -= 2;
        else if (i < 56) potential -= 4;
        else if (i < 60) potential -= 8;
        else if (i < 62) potential -= 16;
        else if (i === 62) potential -= 32;
      }
    }
    
    return {
      entryId: entry.entryId || entry.id,
      firstName: entry.firstName || entry.first_name,
      lastName: entry.lastName || entry.last_name,
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
  const advancedTeams = new Set();
  
  // First add all teams to the eliminated set
  for (let i = 1; i <= 32; i++) {
    const match = liveBracketData.matches[i];
    if (match?.teamA) eliminatedTeams.add(`${match.teamA.seed} ${match.teamA.name}`);
    if (match?.teamB) eliminatedTeams.add(`${match.teamB.seed} ${match.teamB.name}`);
  }
  
  // Then remove teams that have advanced (winners)
  for (let i = 1; i <= 63; i++) {
    const match = liveBracketData.matches[i];
    if (match?.winner) {
      const winningTeam = match.winner === 'A' ? match.teamA : match.teamB;
      if (winningTeam) {
        const teamStr = `${winningTeam.seed} ${winningTeam.name}`;
        advancedTeams.add(teamStr);
        eliminatedTeams.delete(teamStr);
      }
    }
  }
  
  return Array.from(eliminatedTeams);
} 