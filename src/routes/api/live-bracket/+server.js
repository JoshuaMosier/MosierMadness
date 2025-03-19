import { json } from '@sveltejs/kit';

async function getMasterBracket() {
    const master = Array(63).fill('');
    
    // Fetch data from NCAA API for each round
    const rounds = [
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/21/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/22/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/23/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/24/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/28/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/29/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/30/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/31/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/04/06/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/04/08/scoreboard.json"
    ];

    const region = {"SOUTH":'2',"WEST":'1',"EAST":'3',"MIDWEST":'4'};
    
    // First get the team region mapping from first round games
    const round1Response = await fetch(rounds[0]);
    const round1Games = await round1Response.json();
    const round2Response = await fetch(rounds[1]);
    const round2Games = await round2Response.json();
    
    // Build team region dictionary like in Python
    const teamRegionDict = {};
    for (const game of [...round1Games.games, ...round2Games.games]) {
        if (game.game.bracketRegion !== "") {
            teamRegionDict[game.game.away.names.short] = game.game.bracketRegion;
            teamRegionDict[game.game.home.names.short] = game.game.bracketRegion;
        }
    }
    
    // Process each round
    for (const roundUrl of rounds) {
        const response = await fetch(roundUrl);
        const games = await response.json();
        
        for (const game of games.games) {
            if (game.game.bracketId) {
                const roundNum = parseInt(game.game.bracketId[0]);
                const gameNum = parseInt(game.game.bracketId.slice(1));
                let offset = 0;
                
                if (roundNum === 3) offset = 32;
                else if (roundNum === 4) offset = 48;
                else if (roundNum === 5) offset = 56;
                else if (roundNum === 6) offset = 60;
                else if (roundNum === 7) offset = 62;
                
                const index = gameNum - 1 + offset;
                
                // Handle Final Four and Championship games differently
                if (roundNum >= 6) {
                    if (game.game.away.winner) {
                        const teamRegion = teamRegionDict[game.game.away.names.short];
                        master[index] = `${game.game.away.seed} ${game.game.away.names.short}`;
                    }
                    if (game.game.home.winner) {
                        const teamRegion = teamRegionDict[game.game.home.names.short];
                        master[index] = `${game.game.home.seed} ${game.game.home.names.short}`;
                    }
                }
                // Handle earlier rounds normally
                else if (game.game.bracketRegion !== "") {
                    if (game.game.away.winner) {
                        master[index] = `${game.game.away.seed} ${game.game.away.names.short}`;
                    }
                    if (game.game.home.winner) {
                        master[index] = `${game.game.home.seed} ${game.game.home.names.short}`;
                    }
                }
            }
        }
    }
    
    console.log(master);
    return master;
}

// Helper function to format team string (e.g., "1 Houston")
function formatTeamString(team) {
    if (!team) return null;
    return `${team.seed} ${team.name}`;
}

function parseTeam(teamStr) {
    if (!teamStr) return null;
    const [seed, ...nameParts] = teamStr.split(' ');
    return {
        seed: parseInt(seed),
        name: nameParts.join(' ')
    };
}

function getTeamFromStr(teamStr) {
    return teamStr ? parseTeam(teamStr) : null;
}

export async function GET(event) {
    try {
        // Get the winners array using the new getMasterBracket function
        const WINNERS = await getMasterBracket();
        
        // Fetch teams from bracket-teams endpoint
        const response = await event.fetch('/api/bracket-teams');
        if (!response.ok) {
            throw new Error('Failed to fetch bracket teams');
        }
        const teams = await response.json();
        
        // Convert teams to the format we need
        const INITIAL_TEAMS = teams.map(team => formatTeamString(team));
        
        const matches = {};
        
        // First round - matches 1-32
        for (let i = 0; i < 32; i++) {
            const teamAStr = INITIAL_TEAMS[i * 2];
            const teamBStr = INITIAL_TEAMS[i * 2 + 1];
            const winnerStr = WINNERS[i];
            
            matches[i + 1] = {
                teamA: parseTeam(teamAStr),
                teamB: parseTeam(teamBStr),
                winner: winnerStr === teamAStr ? 'A' : 'B'
            };
        }

        // Second round - matches 33-48
        for (let i = 0; i < 16; i++) {
            const teamAStr = WINNERS[i * 2];
            const teamBStr = WINNERS[i * 2 + 1];
            const winnerStr = WINNERS[i + 32];
            
            matches[i + 33] = {
                teamA: getTeamFromStr(teamAStr),
                teamB: getTeamFromStr(teamBStr),
                winner: winnerStr ? (winnerStr === teamAStr ? 'A' : 'B') : null
            };
        }

        // Sweet 16 - matches 49-56
        for (let i = 0; i < 8; i++) {
            const teamAStr = WINNERS[i * 2 + 32];
            const teamBStr = WINNERS[i * 2 + 33];
            const winnerStr = WINNERS[i + 48];
            
            matches[i + 49] = {
                teamA: getTeamFromStr(teamAStr),
                teamB: getTeamFromStr(teamBStr),
                winner: winnerStr ? (winnerStr === teamAStr ? 'A' : 'B') : null
            };
        }

        // Elite 8 - matches 57-60
        for (let i = 0; i < 4; i++) {
            const teamAStr = WINNERS[i * 2 + 48];
            const teamBStr = WINNERS[i * 2 + 49];
            const winnerStr = WINNERS[i + 56];
            
            matches[i + 57] = {
                teamA: getTeamFromStr(teamAStr),
                teamB: getTeamFromStr(teamBStr),
                winner: winnerStr ? (winnerStr === teamAStr ? 'A' : 'B') : null
            };
        }

        // Final Four - matches 61-62
        for (let i = 0; i < 2; i++) {
            const teamAStr = WINNERS[i * 2 + 56];
            const teamBStr = WINNERS[i * 2 + 57];
            const winnerStr = WINNERS[i + 60];
            
            matches[i + 61] = {
                teamA: getTeamFromStr(teamAStr),
                teamB: getTeamFromStr(teamBStr),
                winner: winnerStr ? (winnerStr === teamAStr ? 'A' : 'B') : null
            };
        }

        // Championship - match 63
        const championshipTeamAStr = WINNERS[60];
        const championshipTeamBStr = WINNERS[61];
        const championStr = WINNERS[62];
        
        matches[63] = {
            teamA: getTeamFromStr(championshipTeamAStr),
            teamB: getTeamFromStr(championshipTeamBStr),
            winner: championStr ? (championStr === championshipTeamAStr ? 'A' : 'B') : null
        };
        
        return json({ matches });
        
    } catch (error) {
        console.error('Error creating bracket data:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500
        });
    }
}
