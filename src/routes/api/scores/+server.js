import { json } from '@sveltejs/kit';

/**
 * Gets the NCAA tournament scoreboard URL for a specific date
 * @param {Date} date - The date to get scores for (defaults to current date in ET)
 * @returns {string} The URL for the specified date
 */
function getScoreboardUrl(date = new Date()) {
  // Convert the date to ET
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [month, day, year] = etFormatter.format(date).split('/');
  const formattedDate = `${year}/${month}/${day}`;
  return `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/${formattedDate}/scoreboard.json`;
}

/**
 * Fetches NCAA basketball scores from the NCAA API
 * @param {Date} date - Optional date to get scores for (in ET)
 * @returns {Promise<Array>} Array of game data
 */
async function getScoreTicker(date = new Date()) {
  try {
    const scoreboardUrl = getScoreboardUrl(date);
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
      if (game.game.bracketId === "") continue;
      
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
export async function GET({ url }) {
  try {
    // Check for date parameter in query string (format: YYYY-MM-DD)
    const dateParam = url.searchParams.get('date');
    let date;
    
    if (dateParam) {
      // If date parameter provided, interpret it as ET
      date = new Date(`${dateParam}T00:00:00-04:00`);
    } else {
      // Get current date in ET
      date = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    }
    
    const scores = await getScoreTicker(date);
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