import { json } from '@sveltejs/kit';

/**
 * Fetches NCAA basketball scores from the NCAA API
 * @returns {Promise<Array>} Array of game data
 */
async function getScoreTicker() {
  try {
    const response = await fetch("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/28/scoreboard.json");
    
    if (!response.ok) {
      throw new Error(`NCAA API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    const matches = [];
    
    for (const game of data.games) {
      if (game.game.bracketId === "") continue; // Skip non-tournament games
      
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
        gm.push("");
      } else {
        gm.push(game.game.startTime);
      }
      
      matches.push(gm);
    }
    
    // Sort by game state (live games first)
    return matches.sort((a, b) => {
      if (a[3] && !b[3]) return -1;
      if (!a[3] && b[3]) return 1;
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