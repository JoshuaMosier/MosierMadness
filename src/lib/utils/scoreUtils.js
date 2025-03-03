// Utility functions for scoring operations

// Get the points value for a game based on its index
export function getPointsForGame(gameIndex) {
  if (gameIndex < 32) return 1;      // Round of 64
  if (gameIndex < 48) return 2;      // Round of 32
  if (gameIndex < 56) return 4;      // Sweet 16
  if (gameIndex < 60) return 8;      // Elite 8
  if (gameIndex < 62) return 16;     // Final Four
  if (gameIndex === 62) return 32;   // Championship
  return 0;
}

// Calculate the maximum possible score
export function getMaxPossibleScore() {
  let maxScore = 0;
  for (let i = 0; i < 63; i++) {
    maxScore += getPointsForGame(i);
  }
  return maxScore;
}

// Format a score for display
export function formatScore(score) {
  return score.toString().padStart(3, ' ');
}

// Format a percentage for display
export function formatPercentage(value, total) {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${Math.round(percentage)}%`;
}

// Get the round name for a game index
export function getRoundName(gameIndex) {
  if (gameIndex < 32) return 'Round of 64';
  if (gameIndex < 48) return 'Round of 32';
  if (gameIndex < 56) return 'Sweet 16';
  if (gameIndex < 60) return 'Elite 8';
  if (gameIndex < 62) return 'Final Four';
  if (gameIndex === 62) return 'Championship';
  return '';
}

// Get the short round name for a game index
export function getShortRoundName(gameIndex) {
  if (gameIndex < 32) return 'R64';
  if (gameIndex < 48) return 'R32';
  if (gameIndex < 56) return 'S16';
  if (gameIndex < 60) return 'E8';
  if (gameIndex < 62) return 'F4';
  if (gameIndex === 62) return 'NCG';
  return '';
}

// Calculate the accuracy percentage for a user's bracket
export function calculateAccuracy(masterBracket, userBracket) {
  let correct = 0;
  let total = 0;
  
  userBracket.forEach((selection, index) => {
    if (masterBracket[index] !== '') {
      total++;
      if (selection === masterBracket[index]) {
        correct++;
      }
    }
  });
  
  if (total === 0) return 0;
  return (correct / total) * 100;
}

// Calculate the weighted accuracy (by round) for a user's bracket
export function calculateWeightedAccuracy(masterBracket, userBracket) {
  let weightedCorrect = 0;
  let weightedTotal = 0;
  
  userBracket.forEach((selection, index) => {
    if (masterBracket[index] !== '') {
      const points = getPointsForGame(index);
      weightedTotal += points;
      if (selection === masterBracket[index]) {
        weightedCorrect += points;
      }
    }
  });
  
  if (weightedTotal === 0) return 0;
  return (weightedCorrect / weightedTotal) * 100;
} 