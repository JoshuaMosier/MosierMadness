// Utility functions for bracket operations

// Get the next game index for a team that wins a game
export function getNextGameIndex(currentIndex) {
  // First round (games 0-31)
  if (currentIndex < 32) {
    // Calculate the next game index in the second round
    return 32 + Math.floor(currentIndex / 2);
  }
  // Second round (games 32-47)
  else if (currentIndex < 48) {
    // Calculate the next game index in the Sweet 16
    return 48 + Math.floor((currentIndex - 32) / 2);
  }
  // Sweet 16 (games 48-55)
  else if (currentIndex < 56) {
    // Calculate the next game index in the Elite 8
    return 56 + Math.floor((currentIndex - 48) / 2);
  }
  // Elite 8 (games 56-59)
  else if (currentIndex < 60) {
    // Calculate the next game index in the Final Four
    return 60 + Math.floor((currentIndex - 56) / 2);
  }
  // Final Four (games 60-61)
  else if (currentIndex < 62) {
    // The championship game
    return 62;
  }
  // Championship game (game 62)
  else {
    // No next game
    return -1;
  }
}

// Get the position (0 or 1) in the next game
export function getNextGamePosition(currentIndex) {
  // For each pair of games, the winner of the first goes to position 0,
  // and the winner of the second goes to position 1
  return currentIndex % 2;
}

// Propagate a team selection through the bracket
export function propagateSelection(selections, gameIndex, team) {
  // Make a copy of the selections array
  const newSelections = [...selections];
  
  // Set the current selection
  newSelections[gameIndex] = team;
  
  // Get the next game index
  const nextGameIndex = getNextGameIndex(gameIndex);
  
  // If there is a next game
  if (nextGameIndex !== -1) {
    // Get the position in the next game
    const nextGamePosition = getNextGamePosition(gameIndex);
    
    // Get the current teams in the next game
    const currentNextGame = newSelections[nextGameIndex];
    
    // If the next game already has a team in this position that matches this selection,
    // we don't need to do anything
    if (currentNextGame === team) {
      return newSelections;
    }
    
    // If the next game has a team in this position that doesn't match this selection,
    // we need to update it and propagate the change
    newSelections[nextGameIndex] = team;
    
    // Recursively propagate the selection
    return propagateSelection(newSelections, nextGameIndex, team);
  }
  
  return newSelections;
}

// Check if a bracket is complete
export function isBracketComplete(selections) {
  // Check if all 63 positions have a team selected
  return selections.length === 63 && !selections.includes('');
}

// Get the team name without the seed
export function getTeamName(teamWithSeed) {
  // Team format is typically "1 Alabama" or similar
  const parts = teamWithSeed.split(' ');
  return parts.slice(1).join(' ');
}

// Get the seed from a team string
export function getTeamSeed(teamWithSeed) {
  // Team format is typically "1 Alabama" or similar
  return teamWithSeed.split(' ')[0];
}

// Format a team name for display
export function formatTeamForDisplay(teamWithSeed) {
  if (!teamWithSeed) return '';
  
  const seed = getTeamSeed(teamWithSeed);
  const name = getTeamName(teamWithSeed);
  
  return `(${seed}) ${name}`;
}

// Get the region for a team based on its position in the bracket
export function getTeamRegion(index) {
  if (index < 16) return 'South';
  if (index < 32) return 'East';
  if (index < 48) return 'West';
  if (index < 64) return 'Midwest';
  return '';
} 