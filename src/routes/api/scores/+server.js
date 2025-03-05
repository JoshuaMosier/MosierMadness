import { json } from '@sveltejs/kit';

/**
 * Gets the current NCAA tournament scoreboard URL
 * This function should be updated with the correct dates as the tournament progresses
 * @returns {string} The URL for the current tournament phase
 */
function getCurrentScoreboardUrl() {
  const today = new Date();
  
  // First Four: March 19-20, 2024
  if (today >= new Date('2024-03-19') && today <= new Date('2024-03-20')) {
    return "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/19/scoreboard.json";
  }
  
  // First Round: March 21-22, 2024
  if (today >= new Date('2024-03-21') && today <= new Date('2024-03-22')) {
    return "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/21/scoreboard.json";
  }
  
  // Second Round: March 23-24, 2024
  if (today >= new Date('2024-03-23') && today <= new Date('2024-03-24')) {
    return "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/23/scoreboard.json";
  }
  
  // Sweet 16: March 28-29, 2024
  if (today >= new Date('2024-03-28') && today <= new Date('2024-03-29')) {
    return "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/28/scoreboard.json";
  }
  
  // Elite Eight: March 30-31, 2024
  if (today >= new Date('2024-03-30') && today <= new Date('2024-03-31')) {
    return "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/30/scoreboard.json";
  }
  
  // Final Four: April 6, 2024
  if (today >= new Date('2024-04-06') && today <= new Date('2024-04-06')) {
    return "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/04/06/scoreboard.json";
  }
  
  // Championship: April 8, 2024
  if (today >= new Date('2024-04-08') && today <= new Date('2024-04-08')) {
    return "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/04/08/scoreboard.json";
  }
  
  // Default to the most recent phase or return a fallback URL
  // This is useful for testing outside of tournament dates
  return "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/04/scoreboard.json";
}

/**
 * Fetches NCAA basketball scores from the NCAA API
 * @returns {Promise<Array>} Array of game data
 */
async function getScoreTicker() {
  try {
    // Get the appropriate URL for the current tournament phase
    const scoreboardUrl = getCurrentScoreboardUrl();
    const response = await fetch(scoreboardUrl);
    
    if (!response.ok) {
      throw new Error(`NCAA API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    const matches = [];
    
    // Check if there are any games
    if (!data.games || data.games.length === 0) {
      return matches; // Return empty array if no games
    }
    
    for (const game of data.games) {
      // Skip non-tournament games if needed
      // Uncomment this line during tournament to only show tournament games
      // if (game.game.bracketId === "") continue;
      
      const gm = [];
      
      // Away team data
      const away = [
        game.game.away.names.char6,
        game.game.away.score,
        game.game.away.seed,
        game.game.away.winner,
        game.game.away.names.short,
        game.game.away.description,
        game.game.away.names.seo
      ];
      
      // Home team data
      const home = [
        game.game.home.names.char6,
        game.game.home.score,
        game.game.home.seed,
        game.game.home.winner,
        game.game.home.names.short,
        game.game.home.description,
        game.game.home.names.seo
      ];
      
      gm.push(away);
      gm.push(home);
      gm.push(game.game.gameState);
      
      // Add period/time info
      if (game.game.gameState === 'live') {
        let period = game.game.currentPeriod;
        if (period !== "HALF" && period !== "END 2ND") {
          period += " " + game.game.contestClock;
        }
        gm.push(period);
      } else if (game.game.gameState === 'final') {
        gm.push("FINAL");
      } else {
        gm.push(game.game.startTime);
      }
      
      matches.push(gm);
    }
    
    // Sort games by status: live games first, then upcoming, then final
    return matches.sort((a, b) => {
      // Priority order: LIVE > PRE > FINAL
      const stateOrder = { 'LIVE': 0, 'PRE': 1, 'FINAL': 2 };
      const stateA = a[2].toUpperCase();
      const stateB = b[2].toUpperCase();
      
      // If states are different, sort by state priority
      if (stateA !== stateB) {
        return (stateOrder[stateA] || 3) - (stateOrder[stateB] || 3);
      }
      
      // If both are the same state, sort by time for PRE games
      if (stateA === 'PRE' && a[3] && b[3]) {
        return a[3].localeCompare(b[3]);
      }
      
      return 0;
    });
    
  } catch (error) {
    console.error('Error fetching NCAA scores:', error);
    throw error;
  }
}

/**
 * GET handler for /api/scores endpoint
 */
export async function GET() {
  try {
    const scores = await getScoreTicker();
    return json(scores);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 