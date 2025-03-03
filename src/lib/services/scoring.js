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
    // Get all brackets
    const { data: brackets, error: bracketsError } = await getAllBrackets();
    
    if (bracketsError) {
      console.error('Error fetching brackets for leaderboard:', bracketsError);
      return [];
    }
    
    // Get master bracket and eliminated teams
    const masterBracket = await getMasterBracket();
    const eliminatedTeams = await getEliminatedTeams();
    
    // Calculate scores and potentials for each bracket
    const leaderboardData = brackets.map(bracket => {
      const score = calculateScore(masterBracket, bracket.selections);
      const potential = calculatePotential(masterBracket, bracket.selections, eliminatedTeams);
      
      return {
        userId: bracket.user_id,
        firstName: bracket.users.firstname,
        lastName: bracket.users.lastname,
        totalScore: score.total,
        r64Score: score.r64,
        r32Score: score.r32,
        s16Score: score.s16,
        e8Score: score.e8,
        f4Score: score.f4,
        ncgScore: score.ncg,
        correctGames: score.correctGames,
        potential: potential,
        // Add Final Four, Finals, and Champion picks for display
        finalFour: bracket.selections.slice(56, 60),
        finals: bracket.selections.slice(60, 62),
        champion: bracket.selections[62]
      };
    });
    
    // Sort by total score (descending)
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
    
    // Add rank
    let currentRank = 1;
    let currentScore = leaderboardData.length > 0 ? leaderboardData[0].totalScore : 0;
    
    leaderboardData.forEach((entry, index) => {
      if (entry.totalScore < currentScore) {
        currentRank = index + 1;
        currentScore = entry.totalScore;
      }
      entry.rank = currentRank;
    });
    
    return leaderboardData;
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    return [];
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