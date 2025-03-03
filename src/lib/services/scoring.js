import { getAllBrackets } from './bracket';
import { getMasterBracket, getEliminatedTeams } from './ncaa-api';

// Calculate score for a single bracket
export function calculateScore(masterBracket, userBracket) {
  let score = {
    r64: 0,
    r32: 0,
    s16: 0,
    e8: 0,
    f4: 0,
    ncg: 0,
    total: 0,
    correctGames: 0
  };
  
  userBracket.forEach((selection, index) => {
    if (selection === masterBracket[index]) {
      // Increment correct games counter
      score.correctGames++;
      
      // Assign points based on round
      if (index < 32) {
        score.r64 += 1;
        score.total += 1;
      } else if (index < 48) {
        score.r32 += 2;
        score.total += 2;
      } else if (index < 56) {
        score.s16 += 4;
        score.total += 4;
      } else if (index < 60) {
        score.e8 += 8;
        score.total += 8;
      } else if (index < 62) {
        score.f4 += 16;
        score.total += 16;
      } else if (index === 62) {
        score.ncg += 32;
        score.total += 32;
      }
    }
  });
  
  return score;
}

// Calculate potential remaining points
export function calculatePotential(masterBracket, userBracket, eliminatedTeams) {
  let potential = 192; // Maximum possible score
  
  // Subtract points for eliminated teams in user's bracket
  userBracket.forEach((selection, index) => {
    if (eliminatedTeams.includes(selection)) {
      if (index < 32) potential -= 1;
      else if (index < 48) potential -= 2;
      else if (index < 56) potential -= 4;
      else if (index < 60) potential -= 8;
      else if (index < 62) potential -= 16;
      else if (index === 62) potential -= 32;
    }
  });
  
  // Subtract points for already correct picks
  userBracket.forEach((selection, index) => {
    if (selection === masterBracket[index] && masterBracket[index] !== "" && !eliminatedTeams.includes(selection)) {
      if (index < 32) potential -= 1;
      else if (index < 48) potential -= 2;
      else if (index < 56) potential -= 4;
      else if (index < 60) potential -= 8;
      else if (index < 62) potential -= 16;
      else if (index === 62) potential -= 32;
    }
  });
  
  return potential;
}

// Get leaderboard data
export async function getLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard data');
    }
    
    const data = await response.json();
    
    // Transform the data to match the component's expected structure
    return data.map((entry, index) => ({
      rank: index + 1,
      userId: entry.id,
      firstName: entry.firstname,
      lastName: entry.lastname,
      totalScore: entry.score[6], // Total score
      r64Score: entry.score[0],   // Round of 64 score
      r32Score: entry.score[1],   // Round of 32 score
      s16Score: entry.score[2],   // Sweet 16 score
      e8Score: entry.score[3],    // Elite 8 score
      f4Score: entry.score[4],    // Final Four score
      ncgScore: entry.score[5],   // National Championship Game score
      potential: entry.potential,  // Potential remaining score
      correctGames: entry.score[7], // Total correct games
      finalFour: entry.end_rounds.slice(0, 4).map(team => ({
        name: team.replace('.png', ''),
        isWinner: team.replace('.png', '') === entry.master[56] || 
                 team.replace('.png', '') === entry.master[57] || 
                 team.replace('.png', '') === entry.master[58] || 
                 team.replace('.png', '') === entry.master[59],
        isEliminated: entry.elim.includes(team.replace('.png', ''))
      })),
      finals: entry.end_rounds.slice(4, 6).map(team => ({
        name: team.replace('.png', ''),
        isWinner: team.replace('.png', '') === entry.master[60] || 
                 team.replace('.png', '') === entry.master[61],
        isEliminated: entry.elim.includes(team.replace('.png', ''))
      })),
      champion: {
        name: entry.end_rounds[6].replace('.png', ''),
        isWinner: entry.end_rounds[6].replace('.png', '') === entry.master[62],
        isEliminated: entry.elim.includes(entry.end_rounds[6].replace('.png', ''))
      }
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}

// Get end rounds (Final Four, Finals, Champion) for all users
export async function getEndRounds() {
  try {
    const { data: brackets, error } = await getAllBrackets();
    
    if (error) {
      console.error('Error fetching brackets for end rounds:', error);
      return [];
    }
    
    return brackets.map(bracket => {
      return bracket.selections.slice(56, 63).map(team => `${team}.png`);
    });
  } catch (error) {
    console.error('Error getting end rounds:', error);
    return [];
  }
} 