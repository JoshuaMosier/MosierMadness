import { json } from '@sveltejs/kit';
import teamColors from '$lib/ncaa_team_colors.json';

// Add this configuration object at the top of the file after the imports
const TEAM_OVERRIDES = {
  // Format: bracketPosition: { name: string, seed: number }
  // 1: { name: "Ala. St/St. Francis", seed: 16 },
  // 9: { name: "SDSU/UNC", seed: 11 },
  // 33: { name: "AMER/Mt. SM", seed: 16 },
  // 57: { name: "Texas/Xavier", seed: 11 },
};

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
 * Helper function to find team color by matching the display name
 * @param {Object} teamData - The team data from NCAA API
 * @returns {string} The primary color for the team
 */
function findTeamColor(teamData) {
  // Use the display name (short name) for matching
  const displayName = teamData.names.short;
  const colors = teamColors[displayName];
  
  return {
    primary_color: colors?.primary_color || '#666666',
    secondary_color: colors?.secondary_color
  };
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
        const awayTeamColors = findTeamColor(game.game.away);
        const awayTeam = {
          name: game.game.away.names.short.length < 20 ? 
                game.game.away.names.short : 
                game.game.away.names.char6,
          seed: parseInt(game.game.away.seed),
          seoName: game.game.away.names.seo,
          color: awayTeamColors.primary_color,
          secondaryColor: awayTeamColors.secondary_color
        };
        
        // Format home team
        const homeTeamColors = findTeamColor(game.game.home);
        const homeTeam = {
          name: game.game.home.names.short.length < 20 ? 
                game.game.home.names.short : 
                game.game.home.names.char6,
          seed: parseInt(game.game.home.seed),
          seoName: game.game.home.names.seo,
          color: homeTeamColors.primary_color,
          secondaryColor: homeTeamColors.secondary_color
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
    
    // Update the override section to handle both name and seed
    teams.forEach((team, index) => {
      if (TEAM_OVERRIDES[index] && team) {
        team.name = TEAM_OVERRIDES[index].name;
        team.seed = TEAM_OVERRIDES[index].seed;
      }
    });
    
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