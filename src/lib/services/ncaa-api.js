// NCAA API service for fetching game data

// Helper function to format date for API URL
function formatDateForAPI(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// Get current date formatted for API
function getCurrentDateForAPI() {
  const today = new Date();
  return formatDateForAPI(today);
}

// Get game scores from NCAA API
export async function getGameScores() {
  try {
    const dateStr = getCurrentDateForAPI();
    const response = await fetch(`https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/${dateStr}/scoreboard.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch scores: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Format the data similar to the original implementation
    const matches = [];
    
    for (const game of data.games) {
      if (game.game.bracketId === "") continue;
      
      const away = [
        game.game.away.names.char6,
        game.game.away.score,
        game.game.away.seed,
        game.game.away.winner,
        game.game.away.names.short,
        game.game.away.description,
        game.game.away.names.seo
      ];
      
      const home = [
        game.game.home.names.char6,
        game.game.home.score,
        game.game.home.seed,
        game.game.home.winner,
        game.game.home.names.short,
        game.game.home.description,
        game.game.home.names.seo
      ];
      
      const gameInfo = [];
      gameInfo.push(away);
      gameInfo.push(home);
      gameInfo.push(game.game.gameState);
      
      if (game.game.gameState === 'live') {
        let period = game.game.currentPeriod;
        if (period !== "HALF" && period !== "END 2ND") {
          period += " " + game.game.contestClock;
        }
        gameInfo.push(period);
      } else if (game.game.gameState === 'final') {
        gameInfo.push("");
      } else {
        gameInfo.push(game.game.startTime);
      }
      
      matches.push(gameInfo);
    }
    
    // Sort by game status (live games first, then upcoming, then final)
    return matches.sort((a, b) => {
      const statusOrder = { 'live': 0, 'pre': 1, 'final': 2 };
      return statusOrder[a[2]] - statusOrder[b[2]];
    });
  } catch (error) {
    console.error('Error fetching game scores:', error);
    return [];
  }
}

// Get bracket teams
export async function getBracketTeams() {
  try {
    // This would typically fetch from an API, but for now we'll return a static array
    // In a real implementation, this would fetch the current tournament teams
    return [
      "1 Alabama", "16 TAMU-CC/SEMO", "8 Maryland", "9 West Virginia",
      "5 San Diego St", "12 Charleston", "4 Virginia", "13 Furman",
      "6 Creighton", "11 NC State", "3 Baylor", "14 UCSB",
      "7 Missouri", "10 Utah St", "2 Arizona", "15 Princeton",
      
      "1 Purdue", "16 FDU/TX SOU", "8 Memphis", "9 FAU",
      "5 Duke", "12 Oral Roberts", "4 Tennessee", "13 Louisiana",
      "6 Kentucky", "11 Providence", "3 Kansas St", "14 Montana St",
      "7 Michigan St", "10 USC", "2 Marquette", "15 Vermont",
      
      "1 Houston", "16 N Kentucky", "8 Iowa", "9 Auburn",
      "5 Miami", "12 Drake", "4 Indiana", "13 Kent St",
      "6 Iowa St", "11 Miss St/Pitt", "3 Xavier", "14 Kennesaw St",
      "7 Texas A&M", "10 Penn St", "2 Texas", "15 Colgate",
      
      "1 Kansas", "16 Howard", "8 Arkansas", "9 Illinois",
      "5 Saint Mary's", "12 VCU", "4 UConn", "13 Iona",
      "6 TCU", "11 Ariz St/Nevada", "3 Gonzaga", "14 GCU",
      "7 Northwestern", "10 Boise St", "2 UCLA", "15 UNC Asheville"
    ];
  } catch (error) {
    console.error('Error fetching bracket teams:', error);
    return [];
  }
}

// Get master bracket
export async function getMasterBracket() {
  try {
    // In a real implementation, this would fetch the current master bracket
    // For now, we'll return a placeholder array
    const masterBracket = Array(63).fill("");
    
    // Populate with some example data
    masterBracket[0] = "1 Alabama";
    masterBracket[1] = "8 Maryland";
    // ... and so on
    
    return masterBracket;
  } catch (error) {
    console.error('Error fetching master bracket:', error);
    return Array(63).fill("");
  }
}

// Get eliminated teams
export async function getEliminatedTeams() {
  try {
    // In a real implementation, this would fetch the current eliminated teams
    // For now, we'll return a placeholder array
    return [
      "16 TAMU-CC/SEMO", "9 West Virginia", "12 Charleston", "13 Furman",
      "11 NC State", "14 UCSB", "10 Utah St", "15 Princeton"
    ];
  } catch (error) {
    console.error('Error fetching eliminated teams:', error);
    return [];
  }
}

// Convert short team names to SEO-friendly names
export function convertShortToSeo() {
  // This would typically be fetched from an API or database
  // For now, we'll return a static mapping
  return {
    "Alabama": "alabama-crimson-tide",
    "Maryland": "maryland-terrapins",
    "West Virginia": "west-virginia-mountaineers",
    "San Diego St": "san-diego-state-aztecs",
    "Charleston": "charleston-cougars",
    "Virginia": "virginia-cavaliers",
    "Furman": "furman-paladins",
    "Creighton": "creighton-bluejays",
    "NC State": "nc-state-wolfpack",
    "Baylor": "baylor-bears",
    "UCSB": "uc-santa-barbara-gauchos",
    "Missouri": "missouri-tigers",
    "Utah St": "utah-state-aggies",
    "Arizona": "arizona-wildcats",
    "Princeton": "princeton-tigers"
    // ... and so on for all teams
  };
} 