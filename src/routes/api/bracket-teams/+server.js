import { json } from '@sveltejs/kit';

/**
 * Gets the current NCAA tournament first round URL
 * @returns {string} The URL for the first round games
 */
function getFirstRoundUrls() {
  // First Round: March 21-22, 2024
  return [
    "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/21/scoreboard.json",
    "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/22/scoreboard.json"
  ];
}

/**
 * Fetches and formats bracket teams from NCAA API
 */
async function getBracketTeams() {
  try {
    const urls = getFirstRoundUrls();
    const teams = new Array(64).fill(null);
    
    // Fetch both days of first round games
    const responses = await Promise.all(urls.map(url => fetch(url)));
    const datas = await Promise.all(responses.map(res => res.json()));
    
    // Process all games
    for (const data of datas) {
      if (!data.games) continue;
      
      for (const game of data.games) {
        if (!game.game.bracketId) continue;
        
        const index = parseInt(game.game.bracketId.slice(1)) - 1;
        
        // Format away team
        const awayTeam = {
          name: game.game.away.names.short.length < 20 ? 
                game.game.away.names.short : 
                game.game.away.names.char6,
          seed: parseInt(game.game.away.seed),
          seoName: game.game.away.names.seo
        };
        
        // Format home team
        const homeTeam = {
          name: game.game.home.names.short.length < 20 ? 
                game.game.home.names.short : 
                game.game.home.names.char6,
          seed: parseInt(game.game.home.seed),
          seoName: game.game.home.names.seo
        };
        
        // Place teams in correct order based on seed
        if (awayTeam.seed < homeTeam.seed) {
          teams[index * 2] = awayTeam;
          teams[index * 2 + 1] = homeTeam;
        } else {
          teams[index * 2] = homeTeam;
          teams[index * 2 + 1] = awayTeam;
        }
      }
    }
    
    // Filter out any null entries
    return teams.filter(team => team !== null);
    
  } catch (error) {
    console.error('Error fetching bracket teams:', error);
    throw error;
  }
}

/**
 * GET handler for /api/bracket-teams endpoint
 */
export async function GET() {
  try {
    const teams = await getBracketTeams();
    
    // If we don't have enough teams, throw an error
    if (teams.length < 64) {
      throw new Error('Could not fetch all teams from the NCAA API');
    }
    
    return json(teams);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 