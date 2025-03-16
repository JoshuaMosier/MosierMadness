import { json } from '@sveltejs/kit';
import teamColors from '$lib/ncaa_team_colors.json';

/**
 * Gets URLs for all rounds of the 2024 NCAA tournament
 * @returns {Array<string>} Array of URLs for all tournament games
 */
function getTournamentUrls() {
  // Tournament Dates 2024:
  // First Round: March 21-22
  // Second Round: March 23-24
  // Sweet 16: March 28-29
  // Elite Eight: March 30-31
  // Final Four: April 6
  // Championship: April 8
  const dates = [
    "2024/03/21", // First Round Day 1
    "2024/03/22", // First Round Day 2
    "2024/03/23", // Second Round Day 1
    "2024/03/24", // Second Round Day 2
    "2024/03/28", // Sweet 16 Day 1
    "2024/03/29", // Sweet 16 Day 2
    "2024/03/30", // Elite Eight Day 1
    "2024/03/31", // Elite Eight Day 2
    "2024/04/06", // Final Four
    "2024/04/08"  // Championship
  ];

  return dates.map(date => 
    `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/${date}/scoreboard.json`
  );
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
 * Fetches and formats bracket teams from NCAA API for all rounds
 */
async function getBracketTeams() {
  try {
    const urls = getTournamentUrls();
    const teams = new Map(); // Use Map to store unique teams
    
    // Fetch all tournament games
    const responses = await Promise.all(urls.map(url => fetch(url)));
    const datas = await Promise.all(responses.map(res => res.json()));
    
    // Process all games from all rounds
    for (const data of datas) {
      if (!data.games) continue;
      
      for (const game of data.games) {
        if (!game.game.bracketId) continue;
        
        // Process away team
        const awayTeamColors = findTeamColor(game.game.away);
        const awayTeam = {
          name: game.game.away.names.short.length < 20 ? 
                game.game.away.names.short : 
                game.game.away.names.char6,
          seed: parseInt(game.game.away.seed),
          seoName: game.game.away.names.seo,
          color: awayTeamColors.primary_color,
          secondaryColor: awayTeamColors.secondary_color,
          isWinner: game.game.away.winner,
          score: game.game.away.score
        };
        
        // Process home team
        const homeTeamColors = findTeamColor(game.game.home);
        const homeTeam = {
          name: game.game.home.names.short.length < 20 ? 
                game.game.home.names.short : 
                game.game.home.names.char6,
          seed: parseInt(game.game.home.seed),
          seoName: game.game.home.names.seo,
          color: homeTeamColors.primary_color,
          secondaryColor: homeTeamColors.secondary_color,
          isWinner: game.game.home.winner,
          score: game.game.home.score
        };

        // Store teams in Map using seoName as key to avoid duplicates
        teams.set(awayTeam.seoName, awayTeam);
        teams.set(homeTeam.seoName, homeTeam);
      }
    }
    
    // Convert Map values to array and sort by seed
    return Array.from(teams.values()).sort((a, b) => a.seed - b.seed);
    
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
    
    // Return whatever teams we found
    return json({
      teams,
      total: teams.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 