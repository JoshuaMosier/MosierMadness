import { json } from '@sveltejs/kit';

async function getMasterBracket() {
    const master = Array(63).fill('');
    const scores = Array(63).fill(null);
    const teamSeoMap = {}; // Add this to store SEO names
    
    // Fetch data from NCAA API for each round
    // 2024
    // const rounds = [
    //     "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/21/scoreboard.json",
    //     "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/22/scoreboard.json",
    //     // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/23/scoreboard.json",
    //     // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/24/scoreboard.json",
    //     // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/28/scoreboard.json",
    //     // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/29/scoreboard.json",
    //     // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/30/scoreboard.json",
    //     // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/31/scoreboard.json",
    //     // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/04/06/scoreboard.json",
    //     // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/04/08/scoreboard.json"
    // ];


    // 2025
    const rounds = [
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/20/scoreboard.json",
        "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/21/scoreboard.json",
        // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/22/scoreboard.json",
        // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/23/scoreboard.json",
        // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/27/scoreboard.json",
        // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/28/scoreboard.json",
        // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/29/scoreboard.json",
        // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/30/scoreboard.json",
        // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/04/05/scoreboard.json",
        // "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/04/07/scoreboard.json"
    ];

    const region = {"SOUTH":'2',"WEST":'1',"EAST":'3',"MIDWEST":'4'};
    
    // First get the team region mapping from first round games
    const round1Response = await fetch(rounds[0]);
    const round1Games = await round1Response.json();
    const round2Response = await fetch(rounds[1]);
    const round2Games = await round2Response.json();
    
    // Build team region dictionary like in Python
    const teamRegionDict = {};
    
    // Also build SEO name mapping while we process games
    for (const game of [...round1Games.games, ...round2Games.games]) {
        if (game.game.bracketRegion !== "") {
            teamRegionDict[game.game.away.names.short] = game.game.bracketRegion;
            teamRegionDict[game.game.home.names.short] = game.game.bracketRegion;
            
            // Store SEO names
            if (game.game.away.names.short && game.game.away.names.seo) {
                teamSeoMap[game.game.away.names.short] = game.game.away.names.seo;
            }
            if (game.game.home.names.short && game.game.home.names.seo) {
                teamSeoMap[game.game.home.names.short] = game.game.home.names.seo;
            }
        }
    }
    
    // Process each round
    for (const roundUrl of rounds) {
        const response = await fetch(roundUrl);
        const games = await response.json();
        
        for (const game of games.games) {
            // Store SEO names for any teams we find
            if (game.game.away.names.short && game.game.away.names.seo) {
                teamSeoMap[game.game.away.names.short] = game.game.away.names.seo;
            }
            if (game.game.home.names.short && game.game.home.names.seo) {
                teamSeoMap[game.game.home.names.short] = game.game.home.names.seo;
            }
            
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
                
                // Store game state and scores
                scores[index] = {
                    gameState: game.game.gameState,
                    period: game.game.currentPeriod,
                    clock: game.game.contestClock,
                    startTime: game.game.startTime,
                    awayScore: game.game.away.score,
                    homeScore: game.game.home.score,
                    awayTeam: game.game.away.names.short,
                    homeTeam: game.game.home.names.short
                };
                
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
    return { master, scores, teamSeoMap }; // Return the SEO map
}

// Helper function to format team string (e.g., "1 Houston")
function formatTeamString(team) {
    if (!team) return null;
    return `${team.seed} ${team.name}`;
}

// Helper function to find team data from bracket teams
function findTeamData(teams, teamName) {
    return teams.find(team => team.name === teamName);
}

function parseTeam(teamStr, teamData, teamSeoMap) {
    if (!teamStr) return null;
    const [seed, ...nameParts] = teamStr.split(' ');
    const name = nameParts.join(' ');
    
    // Get the SEO name if it's in our map
    const seoName = teamSeoMap[name] || '';
    
    return {
        seed: parseInt(seed),
        name: name,
        seoName: seoName,
        color: teamData?.color,
        secondaryColor: teamData?.secondaryColor
    };
}

function getTeamFromStr(teamStr) {
    return teamStr ? parseTeam(teamStr) : null;
}

export async function GET(event) {
    try {
        // Get the winners array, scores, and team SEO map
        const { master: WINNERS, scores: SCORES, teamSeoMap } = await getMasterBracket();
        
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
            const gameScores = SCORES[i];
            
            // Find team data for colors
            const teamAData = findTeamData(teams, teamAStr?.split(' ').slice(1).join(' '));
            const teamBData = findTeamData(teams, teamBStr?.split(' ').slice(1).join(' '));
            
            const teamA = parseTeam(teamAStr, teamAData, teamSeoMap);
            const teamB = parseTeam(teamBStr, teamBData, teamSeoMap);
            
            // Add scores if available - match by team name
            if (gameScores) {
                if (teamA) {
                    const isAway = teamA.name === gameScores.awayTeam;
                    teamA.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
                if (teamB) {
                    const isAway = teamB.name === gameScores.awayTeam;
                    teamB.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
            }
            
            matches[i + 1] = {
                teamA,
                teamB,
                winner: winnerStr === teamAStr ? 'A' : winnerStr === teamBStr ? 'B' : null,
                gameState: gameScores?.gameState,
                period: gameScores?.period,
                clock: gameScores?.clock,
                startTime: gameScores?.startTime
            };
        }

        // Second round - matches 33-48
        for (let i = 0; i < 16; i++) {
            const teamAStr = WINNERS[i * 2];
            const teamBStr = WINNERS[i * 2 + 1];
            const winnerStr = WINNERS[i + 32];
            const gameScores = SCORES[i + 32];
            
            // Find team data for colors
            const teamAData = findTeamData(teams, teamAStr?.split(' ').slice(1).join(' '));
            const teamBData = findTeamData(teams, teamBStr?.split(' ').slice(1).join(' '));
            
            const teamA = parseTeam(teamAStr, teamAData, teamSeoMap);
            const teamB = parseTeam(teamBStr, teamBData, teamSeoMap);
            
            // Add scores if available - match by team name
            if (gameScores) {
                if (teamA) {
                    const isAway = teamA.name === gameScores.awayTeam;
                    teamA.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
                if (teamB) {
                    const isAway = teamB.name === gameScores.awayTeam;
                    teamB.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
            }
            
            matches[i + 33] = {
                teamA,
                teamB,
                winner: winnerStr ? (winnerStr === teamAStr ? 'A' : 'B') : null,
                gameState: gameScores?.gameState,
                period: gameScores?.period,
                clock: gameScores?.clock,
                startTime: gameScores?.startTime
            };
        }

        // Sweet 16 - matches 49-56
        for (let i = 0; i < 8; i++) {
            const teamAStr = WINNERS[i * 2 + 32];
            const teamBStr = WINNERS[i * 2 + 33];
            const winnerStr = WINNERS[i + 48];
            const gameScores = SCORES[i + 48];
            
            // Find team data for colors
            const teamAData = findTeamData(teams, teamAStr?.split(' ').slice(1).join(' '));
            const teamBData = findTeamData(teams, teamBStr?.split(' ').slice(1).join(' '));
            
            const teamA = parseTeam(teamAStr, teamAData, teamSeoMap);
            const teamB = parseTeam(teamBStr, teamBData, teamSeoMap);
            
            // Add scores if available - match by team name
            if (gameScores) {
                if (teamA) {
                    const isAway = teamA.name === gameScores.awayTeam;
                    teamA.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
                if (teamB) {
                    const isAway = teamB.name === gameScores.awayTeam;
                    teamB.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
            }
            
            matches[i + 49] = {
                teamA,
                teamB,
                winner: winnerStr ? (winnerStr === teamAStr ? 'A' : 'B') : null,
                gameState: gameScores?.gameState,
                period: gameScores?.period,
                clock: gameScores?.clock,
                startTime: gameScores?.startTime
            };
        }

        // Elite 8 - matches 57-60
        for (let i = 0; i < 4; i++) {
            const teamAStr = WINNERS[i * 2 + 48];
            const teamBStr = WINNERS[i * 2 + 49];
            const winnerStr = WINNERS[i + 56];
            const gameScores = SCORES[i + 56];
            
            // Find team data for colors
            const teamAData = findTeamData(teams, teamAStr?.split(' ').slice(1).join(' '));
            const teamBData = findTeamData(teams, teamBStr?.split(' ').slice(1).join(' '));
            
            const teamA = parseTeam(teamAStr, teamAData, teamSeoMap);
            const teamB = parseTeam(teamBStr, teamBData, teamSeoMap);
            
            // Add scores if available - match by team name
            if (gameScores) {
                if (teamA) {
                    const isAway = teamA.name === gameScores.awayTeam;
                    teamA.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
                if (teamB) {
                    const isAway = teamB.name === gameScores.awayTeam;
                    teamB.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
            }
            
            matches[i + 57] = {
                teamA,
                teamB,
                winner: winnerStr ? (winnerStr === teamAStr ? 'A' : 'B') : null,
                gameState: gameScores?.gameState,
                period: gameScores?.period,
                clock: gameScores?.clock,
                startTime: gameScores?.startTime
            };
        }

        // Final Four - matches 61-62
        for (let i = 0; i < 2; i++) {
            const teamAStr = WINNERS[i * 2 + 56];
            const teamBStr = WINNERS[i * 2 + 57];
            const winnerStr = WINNERS[i + 60];
            const gameScores = SCORES[i + 60];
            
            // Find team data for colors
            const teamAData = findTeamData(teams, teamAStr?.split(' ').slice(1).join(' '));
            const teamBData = findTeamData(teams, teamBStr?.split(' ').slice(1).join(' '));
            
            const teamA = parseTeam(teamAStr, teamAData, teamSeoMap);
            const teamB = parseTeam(teamBStr, teamBData, teamSeoMap);
            
            // Add scores if available - match by team name
            if (gameScores) {
                if (teamA) {
                    const isAway = teamA.name === gameScores.awayTeam;
                    teamA.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
                if (teamB) {
                    const isAway = teamB.name === gameScores.awayTeam;
                    teamB.score = isAway ? gameScores.awayScore : gameScores.homeScore;
                }
            }
            
            matches[i + 61] = {
                teamA,
                teamB,
                winner: winnerStr ? (winnerStr === teamAStr ? 'A' : 'B') : null,
                gameState: gameScores?.gameState,
                period: gameScores?.period,
                clock: gameScores?.clock,
                startTime: gameScores?.startTime
            };
        }

        // Championship - match 63
        const championshipTeamAStr = WINNERS[60];
        const championshipTeamBStr = WINNERS[61];
        const championStr = WINNERS[62];
        const gameScores = SCORES[62];
        
        // Find team data for colors
        const teamAData = findTeamData(teams, championshipTeamAStr?.split(' ').slice(1).join(' '));
        const teamBData = findTeamData(teams, championshipTeamBStr?.split(' ').slice(1).join(' '));
        
        const teamA = parseTeam(championshipTeamAStr, teamAData, teamSeoMap);
        const teamB = parseTeam(championshipTeamBStr, teamBData, teamSeoMap);
        
        // Add scores if available - match by team name
        if (gameScores) {
            if (teamA) {
                const isAway = teamA.name === gameScores.awayTeam;
                teamA.score = isAway ? gameScores.awayScore : gameScores.homeScore;
            }
            if (teamB) {
                const isAway = teamB.name === gameScores.awayTeam;
                teamB.score = isAway ? gameScores.awayScore : gameScores.homeScore;
            }
        }
        
        matches[63] = {
            teamA,
            teamB,
            winner: championStr ? (championStr === championshipTeamAStr ? 'A' : 'B') : null,
            gameState: gameScores?.gameState,
            period: gameScores?.period,
            clock: gameScores?.clock,
            startTime: gameScores?.startTime
        };
        
        return json({ matches });
        
    } catch (error) {
        console.error('Error creating bracket data:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500
        });
    }
}
