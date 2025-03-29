<script>
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { calculateScores } from '$lib/utils/scoringUtils';

  let entries = [];
  let loading = true;
  let error = null;
  let liveBracketData = null;
  let masterBracket = [];
  let remainingGames = []; // Games that haven't been played yet
  let simulationInProgress = false;
  let scenariosCalculated = false;
  let totalScenarios = 0;
  let selectedTab = 'win'; // Default tab, will be updated based on screen size
  let displayMode = 'percent'; // 'count' or 'percent'
  let currentUser = null; // Store the current user

  // Match selections
  let selectedWinners = {}; // gameId -> winner team string
  let matchSimulationDetails = []; // Details about matches for the UI
  let hasSelections = false; // Flag to track if user has made any selections
  
  // Tracking hover state for highlighting
  let hoveredRow = null;
  let hoveredCol = null;
  let hoveredCell = null; // Track the specific cell being hovered
  
  // Results tracking
  let userWinCounts = [];
  let positionProbabilities = []; // Track probabilities for each position
  
  // Added for Root For tab
  let selectedUser = null;
  let teamWinContributions = {};
  let targetPosition = 1; // Default target position for rooting guide
  let bestPossibleFinish = 1; // Track best possible finish for selected user

  onMount(async () => {
    try {
      // Set default tab based on screen width
      if (window.matchMedia('(min-width: 768px)').matches) {
        // Desktop - default to win chances instead of full standings
        selectedTab = 'win';
      } else {
        // Mobile - default to win chances since Full Standings is hidden on mobile
        selectedTab = 'win';
      }

      // Add resize event listener to handle tab switching when screen size changes
      const mediaQuery = window.matchMedia('(min-width: 768px)');
      const handleResize = (e) => {
        // We no longer need to switch tabs based on screen size
        // since all tabs are now available on all screen sizes
      };
      
      mediaQuery.addEventListener('change', handleResize);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;

      await fetchData();

      // Automatically calculate scenarios when page loads
      if (!scenariosCalculated && entries.length > 0) {
        await calculateAllScenarios();
      }

      // If user is logged in, automatically select their bracket for the Root For tab
      if (currentUser) {
        // Find the entry that belongs to this user
        const userEntry = entries.find(entry => entry.user_id === currentUser.id);
        if (userEntry) {
          selectedUser = userEntry.entryId;
          calculateTeamContributions(selectedUser);
          // Set the tab to Root For tab if user is logged in
          selectedTab = 'root';
        }
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
  
  async function fetchData() {
    // Fetch the live bracket data
    const liveResponse = await fetch('/api/live-bracket');
    if (!liveResponse.ok) {
      throw new Error('Failed to fetch live bracket data');
    }
    liveBracketData = await liveResponse.json();
    
    // Fetch the master bracket data
    const masterResponse = await fetch('/api/master-bracket');
    if (!masterResponse.ok) {
      throw new Error('Failed to fetch master bracket data');
    }
    const masterData = await masterResponse.json();
    masterBracket = masterData.masterBracket;
    
    // Find all remaining games (empty winners) starting from Sweet 16
    remainingGames = [];
    for (let i = 48; i < 63; i++) {
      if (!masterBracket[i]) {
        remainingGames.push(i);
      }
    }
    
    // Setup match simulation details
    prepareMatchDetails();
    
    // Fetch all brackets with user profiles
    const { data, error: bracketsError } = await supabase
      .from('brackets')
      .select('*, profiles(*)');
    
    if (bracketsError) throw new Error('Failed to fetch brackets: ' + bracketsError.message);
    
    entries = data.map(bracket => ({
      entryId: bracket.id,
      user_id: bracket.user_id,
      firstName: bracket.profiles?.first_name || 'Unknown',
      lastName: bracket.profiles?.last_name || 'User',
      selections: bracket.selections || [],
      is_submitted: bracket.is_submitted || false
    }));
    
    // Filter out incomplete entries
    entries = entries.filter(entry => entry.is_submitted && entry.selections && entry.selections.length > 0);
    
    // Initialize user win counters
    userWinCounts = entries.map(entry => ({
      entryId: entry.entryId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      winCount: 0,
      winProbability: 0
    }));
    
    // Initialize position probabilities
    initializePositionProbabilities();
  }
  
  // Function to prepare match details for the UI
  function prepareMatchDetails() {
    matchSimulationDetails = [];
    
    // Group the matches by round
    const rounds = {
      "Sweet 16": { range: [48, 56], games: [] },
      "Elite 8": { range: [56, 60], games: [] },
      "Final Four": { range: [60, 62], games: [] },
      "Championship": { range: [62, 63], games: [] }
    };
    
    // Process each remaining game to build match details
    for (const gameId of remainingGames) {
      let round;
      if (gameId >= 48 && gameId < 56) round = "Sweet 16";
      else if (gameId >= 56 && gameId < 60) round = "Elite 8";
      else if (gameId >= 60 && gameId < 62) round = "Final Four";
      else if (gameId === 62) round = "Championship";
      
      if (!round) continue;
      
      let teamA, teamB;
      let teamASeoName, teamBSeoName;
      
      if (gameId >= 48 && gameId < 56) {
        // Sweet 16 games - teams come from the liveBracketData
        const match = liveBracketData.matches[gameId + 1];
        if (match?.teamA && match?.teamB) {
          teamA = `${match.teamA.seed} ${match.teamA.name}`;
          teamB = `${match.teamB.seed} ${match.teamB.name}`;
          teamASeoName = match.teamA.seoName || match.teamA.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          teamBSeoName = match.teamB.seoName || match.teamB.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        } else {
          continue; // Skip if teams aren't available
        }
      } else {
        // Later rounds - teams come from winners of previous rounds or current master bracket
        let prevGame1, prevGame2;
        
        // Elite 8
        if (gameId >= 56 && gameId < 60) {
          prevGame1 = 48 + (gameId - 56) * 2;
          prevGame2 = prevGame1 + 1;
        }
        // Final Four
        else if (gameId >= 60 && gameId < 62) {
          prevGame1 = 56 + (gameId - 60) * 2;
          prevGame2 = prevGame1 + 1;
        }
        // Championship
        else if (gameId === 62) {
          prevGame1 = 60;
          prevGame2 = 61;
        }
        
        // Get teams from either master bracket or selected winners
        teamA = masterBracket[prevGame1] || selectedWinners[prevGame1] || null;
        teamB = masterBracket[prevGame2] || selectedWinners[prevGame2] || null;
        
        // Skip games where both teams are undetermined
        if (!teamA && !teamB) {
          continue;
        }
        
        // Get team seoNames if available
        if (teamA) {
          const teamAName = getTeamNameFromSelection(teamA);
          teamASeoName = getTeamSeoName(teamAName);
        }
        
        if (teamB) {
          const teamBName = getTeamNameFromSelection(teamB);
          teamBSeoName = getTeamSeoName(teamBName);
        }
      }
      
      rounds[round].games.push({
        gameId,
        teamA,
        teamB,
        teamASeoName,
        teamBSeoName,
        selected: selectedWinners[gameId] || null
      });
    }
    
    // Convert to array for UI rendering
    for (const [roundName, roundData] of Object.entries(rounds)) {
      if (roundData.games.length > 0) {
        matchSimulationDetails.push({
          name: roundName,
          games: roundData.games
        });
      }
    }
  }
  
  // Helper function to extract team name from selection string (e.g. "1 Houston" -> "Houston")
  function getTeamNameFromSelection(selection) {
    if (!selection) return null;
    const parts = selection.split(' ');
    if (parts.length < 2) return selection; // Return original if can't parse
    return parts.slice(1).join(' ');
  }
  
  // Helper function to get team seoName for logo path
  function getTeamSeoName(teamName) {
    if (!teamName) return '';
    
    // First try to find the team in the live bracket data 
    for (let i = 1; i <= 63; i++) {
      const match = liveBracketData?.matches[i];
      if (match?.teamA?.name === teamName && match.teamA.seoName) {
        return match.teamA.seoName;
      }
      if (match?.teamB?.name === teamName && match.teamB.seoName) {
        return match.teamB.seoName;
      }
    }
    
    // Fallback to simple transformation
    return teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  
  // Handle image error for team logos
  function handleImageError(event) {
    event.target.src = '/images/placeholder-team.svg';
  }
  
  function initializePositionProbabilities() {
    positionProbabilities = entries.map(entry => {
      const positions = {};
      // Create a position counter for each possible position (1 to entries.length)
      for (let i = 1; i <= entries.length; i++) {
        positions[i] = 0;
      }
      
      return {
        entryId: entry.entryId,
        firstName: entry.firstName,
        lastName: entry.lastName,
        positions: positions,
        // We'll calculate these percentages later
        positionProbabilities: {}
      };
    });
  }
  
  // Function to select a winner for a match
  function selectWinner(gameId, team) {
    // If already selected, deselect
    if (selectedWinners[gameId] === team) {
      delete selectedWinners[gameId];
    } else {
      selectedWinners[gameId] = team;
    }
    
    // Update UI state
    selectedWinners = {...selectedWinners};
    hasSelections = Object.keys(selectedWinners).length > 0;
    
    // Recalculate match details (important for dependent matches)
    prepareMatchDetails();
    
    // If scenarios have been calculated, recalculate with the new selection
    if (scenariosCalculated) {
      calculateAllScenarios();
    }
  }
  
  // Function to reset all selections
  function resetSelections() {
    selectedWinners = {};
    hasSelections = false;
    prepareMatchDetails();
    
    // Recalculate if needed
    if (scenariosCalculated) {
      calculateAllScenarios();
    }
  }
  
  // Generate all possible remaining scenarios and count winners
  async function calculateAllScenarios() {
    simulationInProgress = true;
    scenariosCalculated = false;
    
    // Reset win counts
    userWinCounts = userWinCounts.map(user => ({
      ...user,
      winCount: 0,
      winProbability: 0
    }));
    
    // Reset position counts
    initializePositionProbabilities();
    
    // Start with the current master bracket
    const scenarioBracket = [...masterBracket];
    
    // Apply any selected winners to the starting bracket
    for (const [gameId, winner] of Object.entries(selectedWinners)) {
      scenarioBracket[parseInt(gameId)] = winner;
    }
    
    // Recalculate which games still need simulation
    const filteredRemainingGames = remainingGames.filter(
      gameId => !selectedWinners.hasOwnProperty(gameId)
    );
    
    // Calculate total number of scenarios
    // Each game has 2 possible outcomes, so total is 2^(number of remaining games)
    totalScenarios = Math.pow(2, filteredRemainingGames.length);
    
    // Create a recursive function to explore all possible scenario branches
    await exploreScenarios(scenarioBracket, 0, filteredRemainingGames);
    
    // Convert win counts to percentages
    userWinCounts = userWinCounts.map(user => ({
      ...user,
      winProbability: (user.winCount / totalScenarios) * 100
    }));
    
    // Convert position counts to percentages
    positionProbabilities = positionProbabilities.map(user => {
      const positionPercentages = {};
      
      for (const [position, count] of Object.entries(user.positions)) {
        positionPercentages[position] = (count / totalScenarios) * 100;
      }
      
      return {
        ...user,
        positionProbabilities: positionPercentages
      };
    });
    
    // Sort by win probability (descending)
    userWinCounts.sort((a, b) => b.winProbability - a.winProbability);
    
    // If we have a selected user, calculate their rooting interests
    if (selectedUser) {
      calculateTeamContributions(selectedUser);
    }
    
    simulationInProgress = false;
    scenariosCalculated = true;
  }
  
  // Recursive function to explore all possible scenario branches
  async function exploreScenarios(bracket, gameIndex, gamesToSimulate) {
    // Base case: if we've assigned winners to all remaining games
    if (gameIndex >= gamesToSimulate.length) {
      // Calculate final standings for this scenario
      const scenarioScores = calculateScores(bracket, entries);
      
      // Sort scores to determine rankings
      const sortedScores = [...scenarioScores].sort((a, b) => b.total - a.total);
      
      // Process tie groups and assign positions
      let currentPosition = 1;
      let currentScore = null;
      let tieGroup = [];
      
      // Process all scores
      for (let i = 0; i < sortedScores.length; i++) {
        const score = sortedScores[i];
        
        // If this is a new score (or the first score), start a new tie group
        if (currentScore === null || score.total !== currentScore) {
          // Process previous tie group if it exists
          if (tieGroup.length > 0) {
            // For ties, we'll use a "shared position" approach
            // e.g., two users tied for 2nd place are both considered 2nd place
            
            for (const tiedScore of tieGroup) {
              // Update win count if tied for first
              if (currentPosition === 1) {
                const winCounter = userWinCounts.find(u => u.entryId === tiedScore.entryId);
                if (winCounter) {
                  winCounter.winCount += 1;
                }
              }
              
              // Update position counts - each user gets exactly ONE position
              const positionCounter = positionProbabilities.find(p => p.entryId === tiedScore.entryId);
              if (positionCounter) {
                // Just increment the counter for their position
                positionCounter.positions[currentPosition] += 1;
              }
            }
            
            // Update position for the next group
            currentPosition += tieGroup.length;
            // Clear the tie group
            tieGroup = [];
          }
          
          // Start new tie group with this score
          currentScore = score.total;
          tieGroup.push(score);
        } else {
          // This score is tied with the previous one, add to tie group
          tieGroup.push(score);
        }
      }
      
      // Process the final tie group if it exists
      if (tieGroup.length > 0) {
        for (const tiedScore of tieGroup) {
          // Update win count if tied for first
          if (currentPosition === 1) {
            const winCounter = userWinCounts.find(u => u.entryId === tiedScore.entryId);
            if (winCounter) {
              winCounter.winCount += 1;
            }
          }
          
          // Update position counts
          const positionCounter = positionProbabilities.find(p => p.entryId === tiedScore.entryId);
          if (positionCounter) {
            // Just increment the counter for their position
            positionCounter.positions[currentPosition] += 1;
          }
        }
      }
      
      return;
    }
    
    // For each remaining game, try both possible outcomes
    const currentGame = gamesToSimulate[gameIndex];
    
    // Get the teams playing in this game
    let teamA, teamB;
    
    if (currentGame >= 48 && currentGame < 56) {
      // Sweet 16 games - teams come from the liveBracketData
      const match = liveBracketData.matches[currentGame + 1];
      if (match?.teamA && match?.teamB) {
        teamA = `${match.teamA.seed} ${match.teamA.name}`;
        teamB = `${match.teamB.seed} ${match.teamB.name}`;
      } else {
        return; // Can't proceed without both teams
      }
    } else {
      // Later rounds - teams come from winners of previous rounds
      // For Elite 8
      if (currentGame >= 56 && currentGame < 60) {
        const prevGame1 = 48 + (currentGame - 56) * 2;
        const prevGame2 = prevGame1 + 1;
        teamA = bracket[prevGame1];
        teamB = bracket[prevGame2];
      }
      // For Final Four
      else if (currentGame >= 60 && currentGame < 62) {
        const prevGame1 = 56 + (currentGame - 60) * 2;
        const prevGame2 = prevGame1 + 1;
        teamA = bracket[prevGame1];
        teamB = bracket[prevGame2];
      }
      // For Championship
      else if (currentGame === 62) {
        teamA = bracket[60];
        teamB = bracket[61];
      }
      
      if (!teamA || !teamB) {
        return; // Can't proceed without both teams
      }
    }
    
    // Try outcome 1: Team A wins
    const bracketWithA = [...bracket];
    bracketWithA[currentGame] = teamA;
    await exploreScenarios(bracketWithA, gameIndex + 1, gamesToSimulate);
    
    // Try outcome 2: Team B wins
    const bracketWithB = [...bracket];
    bracketWithB[currentGame] = teamB;
    await exploreScenarios(bracketWithB, gameIndex + 1, gamesToSimulate);
    
    // For large tournaments, we need to allow UI updates
    if (gameIndex === 0 && gamesToSimulate.length > 10) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  // Function to get color for a probability cell based on percentage
  function getHeatmapColor(probability) {
    // Special case for 0% probability
    if (probability === 0) {
      return 'rgba(50, 50, 50, 0.2)'; // Very dark gray, nearly transparent
    }
    
    // Green for high probabilities, red for low
    const hue = Math.min(120, Math.round(probability * 1.2));
    const saturation = 75;
    const lightness = 50;
    const alpha = Math.min(0.9, 0.2 + (probability / 100) * 0.7);
    
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
  }
  
  // New function to get color for a probability cell relative to row max
  function getRowHeatmapColor(probability, maxInRow) {
    // Special case for 0% probability
    if (probability === 0) {
      return 'rgba(50, 50, 50, 0.2)'; // Very dark gray, nearly transparent
    }
    
    // Calculate relative strength (0 to 1)
    const relativeStrength = probability / maxInRow;
    
    // More muted green for high probabilities, yellow for medium, red for low
    const hue = Math.min(120, Math.round(relativeStrength * 120));
    const saturation = 65; // Reduced from 75%
    const lightness = 45; // Reduced from 50%
    
    // Alpha increases with relative strength
    const alpha = Math.min(0.85, 0.2 + relativeStrength * 0.65);
    
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
  }
  
  // Function to sort the position data for display
  function getSortedPositionData() {
    return [...positionProbabilities].sort((a, b) => {
      // Find highest possible finish (lowest position number with >0% chance) for each user
      const aHighestPos = Object.entries(a.positionProbabilities)
        .filter(([_, probability]) => probability > 0)
        .sort(([posA], [posB]) => Number(posA) - Number(posB))[0];
      
      const bHighestPos = Object.entries(b.positionProbabilities)
        .filter(([_, probability]) => probability > 0)
        .sort(([posA], [posB]) => Number(posA) - Number(posB))[0];
      
      // If one doesn't have any possible finishes, sort to the bottom
      if (!aHighestPos) return 1;
      if (!bHighestPos) return -1;
      
      // First sort by highest possible position
      const positionDiff = Number(aHighestPos[0]) - Number(bHighestPos[0]);
      if (positionDiff !== 0) return positionDiff;
      
      // If tied on highest position, sort by probability of that position (descending)
      return bHighestPos[1] - aHighestPos[1];
    });
  }

  // Function to get correct ordinal suffix for numbers
  function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  }

  // Function to calculate team win contributions for a selected user
  function calculateTeamContributions(userId) {
    if (!scenariosCalculated || !userId) return;
    
    // Reset contributions
    teamWinContributions = {};
    
    // Find the user
    const user = entries.find(entry => entry.entryId === userId);
    if (!user) return;
    
    // Find the best possible finish for this user
    const userPositionData = positionProbabilities.find(p => p.entryId === userId);
    if (!userPositionData) return;

    // Check if user has a chance at 1st place
    const hasChanceForFirst = userPositionData.positionProbabilities[1] > 0;
    
    // If no chance for 1st, find their best possible finish
    if (!hasChanceForFirst) {
      for (let i = 2; i <= entries.length; i++) {
        if (userPositionData.positionProbabilities[i] > 0) {
          bestPossibleFinish = i;
          break;
        }
      }
    } else {
      bestPossibleFinish = 1;
    }
    
    // Update the target position for rooting guide
    targetPosition = bestPossibleFinish;
    
    // For each remaining game, calculate how each team affects position probability
    for (const round of matchSimulationDetails) {
      for (const game of round.games) {
        // Skip if a winner is already selected
        if (selectedWinners[game.gameId]) continue;
        
        // Initialize if needed
        if (!teamWinContributions[game.gameId]) {
          teamWinContributions[game.gameId] = {
            teamA: { team: game.teamA, wins: 0, winPct: 0, totalScenarios: 0 },
            teamB: { team: game.teamB, wins: 0, winPct: 0, totalScenarios: 0 },
            deltaText: "",
            favoredTeam: null
          };
        }
        
        // Calculate both scenarios
        // First, what if Team A wins?
        const withA = {...selectedWinners, [game.gameId]: game.teamA};
        let scenarioBracketA = [...masterBracket];
        for (const [gId, winner] of Object.entries(withA)) {
          scenarioBracketA[parseInt(gId)] = winner;
        }
        
        // Calculate remaining games for Team A win
        const remainingGamesA = remainingGames.filter(
          gId => !withA.hasOwnProperty(gId)
        );
        const totalScenariosA = Math.pow(2, remainingGamesA.length);
        let positionCountWithA = 0;

        // Run a complete simulation for team A winning
        const tempSelectedWinners = {...selectedWinners};
        selectedWinners = withA;
        positionCountWithA = countScenariosForUserPosition(user.entryId, remainingGamesA, targetPosition);
        selectedWinners = tempSelectedWinners;
        
        // Then, what if Team B wins?
        const withB = {...selectedWinners, [game.gameId]: game.teamB};
        let scenarioBracketB = [...masterBracket];
        for (const [gId, winner] of Object.entries(withB)) {
          scenarioBracketB[parseInt(gId)] = winner;
        }
        
        // Calculate remaining games for Team B win
        const remainingGamesB = remainingGames.filter(
          gId => !withB.hasOwnProperty(gId)
        );
        const totalScenariosB = Math.pow(2, remainingGamesB.length);
        let positionCountWithB = 0;

        // Run a complete simulation for team B winning
        selectedWinners = withB;
        positionCountWithB = countScenariosForUserPosition(user.entryId, remainingGamesB, targetPosition);
        selectedWinners = tempSelectedWinners;
        
        // Update team contributions
        const pctWithA = (positionCountWithA / totalScenariosA) * 100;
        const pctWithB = (positionCountWithB / totalScenariosB) * 100;
        
        teamWinContributions[game.gameId].teamA.wins = positionCountWithA;
        teamWinContributions[game.gameId].teamA.winPct = pctWithA;
        teamWinContributions[game.gameId].teamA.totalScenarios = totalScenariosA;
        teamWinContributions[game.gameId].teamB.wins = positionCountWithB;
        teamWinContributions[game.gameId].teamB.winPct = pctWithB;
        teamWinContributions[game.gameId].teamB.totalScenarios = totalScenariosB;
        
        // Calculate delta and determine favored team
        const delta = pctWithA - pctWithB;
        teamWinContributions[game.gameId].delta = delta;
        
        if (delta > 0) {
          teamWinContributions[game.gameId].favoredTeam = 'A';
          teamWinContributions[game.gameId].deltaText = `${positionCountWithA}`;
        } else if (delta < 0) {
          teamWinContributions[game.gameId].favoredTeam = 'B';
          teamWinContributions[game.gameId].deltaText = `${positionCountWithB}`;
        } else {
          teamWinContributions[game.gameId].favoredTeam = null;
          teamWinContributions[game.gameId].deltaText = `${positionCountWithA}`;
        }
      }
    }
  }
  
  // Helper function to count scenarios where user finishes in a specific position
  function countScenariosForUserPosition(userId, gamesToSimulate, targetPosition) {
    // If no games left to simulate, we can calculate position probability directly
    if (gamesToSimulate.length === 0) {
      // Build the bracket with current selections
      const bracket = [...masterBracket];
      for (const [gameId, winner] of Object.entries(selectedWinners)) {
        bracket[parseInt(gameId)] = winner;
      }
      
      // Calculate scores and determine final positions
      const scenarioScores = calculateScores(bracket, entries);
      const sortedScores = [...scenarioScores].sort((a, b) => b.total - a.total);
      
      // Process scores to determine positions (handling ties)
      let currentPosition = 1;
      let currentScore = null;
      let tieGroup = [];
      let userPosition = null;
      
      // Process all scores
      for (let i = 0; i < sortedScores.length; i++) {
        const score = sortedScores[i];
        
        // If this is a new score (or the first score), process previous tie group
        if (currentScore === null || score.total !== currentScore) {
          // Process previous tie group if it exists
          if (tieGroup.length > 0) {
            // Check if our user is in this tie group
            if (tieGroup.some(s => s.entryId === userId)) {
              userPosition = currentPosition;
            }
            
            // Update position for the next group
            currentPosition += tieGroup.length;
            // Clear the tie group
            tieGroup = [];
          }
          
          // Start new tie group with this score
          currentScore = score.total;
          tieGroup.push(score);
        } else {
          // This score is tied with the previous one, add to tie group
          tieGroup.push(score);
        }
      }
      
      // Process the final tie group if it exists
      if (tieGroup.length > 0 && userPosition === null) {
        // Check if our user is in this tie group
        if (tieGroup.some(s => s.entryId === userId)) {
          userPosition = currentPosition;
        }
      }
      
      // Return 1 if user finishes in target position, 0 otherwise
      return userPosition === targetPosition ? 1 : 0;
    }
    
    // If there are remaining games, we need to simulate both outcomes for each
    let positionCount = 0;
    const bracket = [...masterBracket];
    
    // Apply current selections
    for (const [gameId, winner] of Object.entries(selectedWinners)) {
      bracket[parseInt(gameId)] = winner;
    }
    
    // Recursive helper to explore all scenarios
    function explorePositionScenarios(bracket, gameIndex, gamesToSimulate) {
      // Base case: if we've assigned winners to all remaining games
      if (gameIndex >= gamesToSimulate.length) {
        // Calculate final standings for this scenario
        const scenarioScores = calculateScores(bracket, entries);
        
        // Find positions
        const sortedScores = [...scenarioScores].sort((a, b) => b.total - a.total);
        
        // Process scores to determine positions (handling ties)
        let currentPosition = 1;
        let currentScore = null;
        let tieGroup = [];
        let userPosition = null;
        
        // Process all scores
        for (let i = 0; i < sortedScores.length; i++) {
          const score = sortedScores[i];
          
          // If this is a new score (or the first score), process previous tie group
          if (currentScore === null || score.total !== currentScore) {
            // Process previous tie group if it exists
            if (tieGroup.length > 0) {
              // Check if our user is in this tie group
              if (tieGroup.some(s => s.entryId === userId)) {
                userPosition = currentPosition;
              }
              
              // Update position for the next group
              currentPosition += tieGroup.length;
              // Clear the tie group
              tieGroup = [];
            }
            
            // Start new tie group with this score
            currentScore = score.total;
            tieGroup.push(score);
          } else {
            // This score is tied with the previous one, add to tie group
            tieGroup.push(score);
          }
        }
        
        // Process the final tie group if it exists
        if (tieGroup.length > 0 && userPosition === null) {
          // Check if our user is in this tie group
          if (tieGroup.some(s => s.entryId === userId)) {
            userPosition = currentPosition;
          }
        }
        
        // Count this scenario if user finishes in target position
        if (userPosition === targetPosition) {
          positionCount += 1;
        }
        
        return;
      }
      
      // For each remaining game, try both possible outcomes
      const currentGame = gamesToSimulate[gameIndex];
      
      // Get the teams playing in this game
      let teamA, teamB;
      
      if (currentGame >= 48 && currentGame < 56) {
        // Sweet 16 games
        const match = liveBracketData.matches[currentGame + 1];
        if (match?.teamA && match?.teamB) {
          teamA = `${match.teamA.seed} ${match.teamA.name}`;
          teamB = `${match.teamB.seed} ${match.teamB.name}`;
        } else {
          return;
        }
      } else {
        // Later rounds
        if (currentGame >= 56 && currentGame < 60) {
          const prevGame1 = 48 + (currentGame - 56) * 2;
          const prevGame2 = prevGame1 + 1;
          teamA = bracket[prevGame1];
          teamB = bracket[prevGame2];
        } else if (currentGame >= 60 && currentGame < 62) {
          const prevGame1 = 56 + (currentGame - 60) * 2;
          const prevGame2 = prevGame1 + 1;
          teamA = bracket[prevGame1];
          teamB = bracket[prevGame2];
        } else if (currentGame === 62) {
          teamA = bracket[60];
          teamB = bracket[61];
        }
        
        if (!teamA || !teamB) return;
      }
      
      // Try outcome 1: Team A wins
      const bracketWithA = [...bracket];
      bracketWithA[currentGame] = teamA;
      explorePositionScenarios(bracketWithA, gameIndex + 1, gamesToSimulate);
      
      // Try outcome 2: Team B wins
      const bracketWithB = [...bracket];
      bracketWithB[currentGame] = teamB;
      explorePositionScenarios(bracketWithB, gameIndex + 1, gamesToSimulate);
    }
    
    // Start the recursive exploration
    explorePositionScenarios(bracket, 0, gamesToSimulate);
    
    return positionCount;
  }
  
  // Helper function to count win scenarios for a user
  function countWinScenariosForUser(userId, gamesToSimulate) {
    return countScenariosForUserPosition(userId, gamesToSimulate, 1);
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-9xl">
  {#if loading}
    <div class="flex justify-center items-center min-h-[400px]" in:fade={{ duration: 100 }}>
      <div class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-amber-600 font-medium">Loading bracket data...</div>
      </div>
    </div>
  {:else if error}
    <div 
      class="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-lg text-center mb-4" 
      in:fade={{ duration: 100, delay: 100 }}
    >
      {error}
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-8">
      <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700">
        <div class="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h2 class="text-xl font-bold text-amber-500">Tournament Outcome Probabilities</h2>
            <p class="text-zinc-400 text-sm mt-1">
              {#if hasSelections}
                Based on {scenariosCalculated ? totalScenarios.toLocaleString() : 'filtered'} tournament outcomes
                <span class="text-amber-500">(filtered by {Object.keys(selectedWinners).length} selections)</span>
              {:else}
                Based on {scenariosCalculated ? totalScenarios.toLocaleString() : 'all possible'} tournament outcomes
              {/if}
            </p>
          </div>
          
          <div class="hidden">
            <button 
              class="mt-4 md:mt-0 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center"
              on:click={calculateAllScenarios}
              disabled={simulationInProgress}
            >
              {#if simulationInProgress}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Calculating...
              {:else}
                {scenariosCalculated ? 'Recalculate' : 'Calculate'} {hasSelections ? 'Filtered' : 'All'} Scenarios
              {/if}
            </button>
          </div>
        </div>
        
        {#if remainingGames.length > 12}
          <div class="bg-amber-800/20 border border-amber-800/30 text-amber-400 p-3 rounded mb-4 text-sm">
            Warning: There are {remainingGames.length} games remaining, which means {Math.pow(2, remainingGames.length).toLocaleString()} possible scenarios. 
            Calculation may take a long time or crash your browser.
          </div>
        {/if}
        
        {#if scenariosCalculated}
          <!-- Match Cards (hidden on mobile, shown on desktop) -->
          <div class="mb-6 hidden md:block">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-sm font-medium text-amber-500">Select Match Winners to Filter Scenarios</h3>
              <button
                class="px-3 py-1 text-xs rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
                on:click={resetSelections}
              >
                Reset Selections
              </button>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-9 gap-1">
              {#each matchSimulationDetails as round}
                {#each round.games as game}
                  <div class="bg-zinc-800/80 border border-zinc-700 rounded-lg overflow-hidden">
                    <div class="bg-zinc-700/50 px-2 py-1 text-xs font-medium text-zinc-300 truncate">
                      {round.name}
                    </div>
                    <div class="p-0.5">
                      <!-- Team A -->
                      <button 
                        class="w-full flex items-center gap-1 py-1.5 px-1 rounded mb-1 transition-colors
                               {game.selected === game.teamA && game.teamA 
                                ? 'bg-amber-600/80 text-white' 
                                : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'}"
                        on:click={() => selectWinner(game.gameId, game.teamA)}
                        disabled={!game.teamA}
                        style={!game.teamA ? 'opacity: 0.7;' : ''}
                      >
                        {#if game.teamA}
                          <div class="w-6 h-6 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1">
                            <img 
                              src={game.teamASeoName ? `/images/team-logos/${game.teamASeoName}.svg` : '/images/placeholder-team.svg'}
                              alt="Team logo"
                              class="w-full h-full object-contain"
                              style="filter: url(#teamLogoOutline);"
                              on:error={handleImageError}
                            />
                          </div>
                          <div class="truncate text-xs">{game.teamA}</div>
                        {:else}
                          <div class="w-6 h-6 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1 flex items-center justify-center">
                            <span class="text-xs text-zinc-400">?</span>
                          </div>
                          <div class="truncate text-xs text-zinc-400">TBD</div>
                        {/if}
                      </button>
                      
                      <!-- Team B -->
                      <button 
                        class="w-full flex items-center gap-1 py-1.5 px-1 rounded transition-colors
                               {game.selected === game.teamB && game.teamB 
                                ? 'bg-amber-600/80 text-white' 
                                : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'}"
                        on:click={() => selectWinner(game.gameId, game.teamB)}
                        disabled={!game.teamB}
                        style={!game.teamB ? 'opacity: 0.7;' : ''}
                      >
                        {#if game.teamB}
                          <div class="w-6 h-6 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1">
                            <img 
                              src={game.teamBSeoName ? `/images/team-logos/${game.teamBSeoName}.svg` : '/images/placeholder-team.svg'}
                              alt="Team logo"
                              class="w-full h-full object-contain"
                              style="filter: url(#teamLogoOutline);"
                              on:error={handleImageError}
                            />
                          </div>
                          <div class="truncate text-xs">{game.teamB}</div>
                        {:else}
                          <div class="w-6 h-6 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1 flex items-center justify-center">
                            <span class="text-xs text-zinc-400">?</span>
                          </div>
                          <div class="truncate text-xs text-zinc-400">TBD</div>
                        {/if}
                      </button>
                    </div>
                  </div>
                {/each}
              {/each}
              
              {#if matchSimulationDetails.length === 0}
                <div class="col-span-full text-center py-4 text-zinc-500 italic">
                  No upcoming games found in the tournament data.
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Tab Buttons -->
          <div class="mb-6">
            <div class="border-b border-zinc-700">
              <div class="flex">
                <button
                  class={`py-2 px-4 font-medium text-sm ${selectedTab === 'win' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                  on:click={() => selectedTab = 'win'}
                >
                  Win Chances
                </button>
                <button
                  class={`py-2 px-4 font-medium text-sm hidden md:block ${selectedTab === 'full' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                  on:click={() => selectedTab = 'full'}
                >
                  Full Standings
                </button>
                <button
                  class={`py-2 px-4 font-medium text-sm ${selectedTab === 'root' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                  on:click={() => {
                    selectedTab = 'root';
                  }}
                >
                  Rooting Guide
                </button>
              </div>
            </div>
          </div>
          
          <!-- Tab Content -->
          {#if selectedTab === 'win'}
            <!-- Win probability table -->
            <div class="overflow-x-auto rounded-lg border border-zinc-700 max-w-2xl mx-auto">
              <table class="w-full divide-y divide-zinc-700">
                <thead class="bg-zinc-800">
                  <tr>
                    <th scope="col" class="px-2 py-2 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" class="px-2 py-2 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Win %
                    </th>
                    <th scope="col" class="px-2 py-2 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Wins
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-zinc-800/50 divide-y divide-zinc-700">
                  {#each userWinCounts as user, i}
                    <tr class={i % 2 === 0 ? 'bg-zinc-800' : ''}>
                      <td class="px-2 py-2 whitespace-nowrap text-sm text-zinc-300">
                        {user.firstName} {user.lastName}
                      </td>
                      <td class="px-2 py-2 whitespace-nowrap text-sm text-zinc-300 text-center">
                        <div class="inline-flex items-center">
                          <span class="text-amber-500 font-medium text-sm">{user.winProbability.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td class="px-2 py-2 whitespace-nowrap text-xs text-zinc-400 text-right">
                        {user.winCount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          
          {:else if selectedTab === 'full'}
            <!-- Full position probability table -->
            <div class="mb-2 text-xs text-zinc-400 flex justify-between items-center">
              <p>Table sorted by best possible finish, then by probability of that finish. A dash (-) indicates zero scenarios. Total scenarios: {totalScenarios.toLocaleString()}</p>
              
              <div class="flex items-center gap-1">
                <span class="text-zinc-300">Display:</span>
                <button 
                  class={`px-3 py-1 text-xs rounded ${displayMode === 'count' ? 'bg-amber-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                  on:click={() => displayMode = 'count'}
                >
                  Counts
                </button>
                <button 
                  class={`px-3 py-1 text-xs rounded ${displayMode === 'percent' ? 'bg-amber-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                  on:click={() => displayMode = 'percent'}
                >
                  Percentages
                </button>
              </div>
            </div>
            <div class="overflow-x-auto pb-4 max-h-[70vh]">
              <table class="min-w-full divide-y divide-zinc-700 whitespace-nowrap">
                <thead class="bg-zinc-800 sticky top-0 z-10">
                  <tr>
                    <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider sticky left-0 bg-zinc-800 z-20">
                      Name
                    </th>
                    {#each Array(entries.length) as _, i}
                      <th scope="col" 
                          class="py-2 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider w-20 bg-zinc-800 transition-colors duration-150"
                          class:bg-amber-800={hoveredCol === i}
                      >
                        {i + 1}{getOrdinalSuffix(i + 1)}
                      </th>
                    {/each}
                  </tr>
                </thead>
                <tbody class="bg-zinc-800/50 divide-y divide-zinc-700">
                  {#each getSortedPositionData() as user, i}
                    {@const userProbabilities = Object.values(user.positionProbabilities)}
                    {@const maxProbability = Math.max(...userProbabilities, 0.1)}
                    <tr class={i % 2 === 0 ? 'bg-zinc-800' : ''}>
                      <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-zinc-300 sticky left-0 z-10 transition-colors duration-150"
                          class:bg-amber-800={hoveredRow === i}
                          class:bg-zinc-700={i % 2 === 0 && hoveredRow !== i}
                          class:bg-zinc-800={i % 2 !== 0 && hoveredRow !== i}>
                        {user.firstName} {user.lastName}
                      </td>
                      {#each Array(entries.length) as _, j}
                        {@const position = j + 1}
                        {@const count = user.positions[position] || 0}
                        {@const probability = user.positionProbabilities[position] || 0}
                        <td class="py-2 whitespace-nowrap text-center min-w-[2.5rem]" 
                            style="background-color: {getRowHeatmapColor(probability, maxProbability)}"
                            on:mouseenter={() => { 
                              hoveredRow = i; 
                              hoveredCol = j; 
                              hoveredCell = `${i}-${j}`; 
                            }}
                            on:mouseleave={() => { 
                              hoveredRow = null; 
                              hoveredCol = null; 
                              hoveredCell = null; 
                            }}
                            class:ring-2={hoveredCell === `${i}-${j}`}
                            class:ring-stone-300={hoveredCell === `${i}-${j}`}
                            class:ring-inset={hoveredCell === `${i}-${j}`}>
                          <span class="{count === 0 ? 'text-zinc-500 font-normal' : 'text-white font-medium'} text-xs">
                            {#if displayMode === 'count'}
                              {count === 0 ? '-' : count.toLocaleString()}
                            {:else}
                              {probability === 0 ? '-' : probability.toFixed(1) + '%'}
                            {/if}
                          </span>
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            
            <div class="mt-4 p-3 bg-zinc-800/30 rounded text-xs text-zinc-400">
              <div class="flex items-center justify-center gap-6 mb-2">
                <div class="flex items-center gap-1">
                  <div class="w-4 h-4 rounded" style="background-color: hsla(120, 65%, 45%, 0.8)"></div>
                  <span>Most common position</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-4 h-4 rounded" style="background-color: hsla(60, 65%, 45%, 0.6)"></div>
                  <span>Medium frequency</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-4 h-4 rounded" style="background-color: hsla(0, 65%, 45%, 0.4)"></div>
                  <span>Less common position</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-4 h-4 rounded" style="background-color: rgba(50, 50, 50, 0.2)"></div>
                  <span>0 scenarios</span>
                </div>
              </div>
            </div>
            
          {:else if selectedTab === 'root'}
            <!-- Root For Who Tab -->
            <div class="mb-6">
              <div class="mb-4">
                <div class="flex flex-col md:flex-row items-start gap-4">
                  <div class="w-full md:w-auto">
                    <label for="userSelect" class="block text-sm font-medium text-zinc-300 mb-1">
                      {#if currentUser && selectedUser && entries.find(entry => entry.entryId === selectedUser && entry.user_id === currentUser.id)}
                        Your bracket is automatically selected:
                      {:else}
                        Select a bracket:
                      {/if}
                    </label>
                    <div class="flex flex-wrap items-center gap-3">
                      <select 
                        id="userSelect"
                        class="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-200 w-full md:w-64"
                        bind:value={selectedUser}
                        on:change={() => calculateTeamContributions(selectedUser)}
                      >
                        <option value={null} disabled selected={!selectedUser}>Select a user...</option>
                        {#each entries.slice().sort((a, b) => {
                          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                          return nameA.localeCompare(nameB);
                        }) as entry}
                          <option value={entry.entryId}>{entry.firstName} {entry.lastName}{entry.user_id === currentUser?.id ? ' (You)' : ''}</option>
                        {/each}
                      </select>
                      
                      {#if selectedUser && scenariosCalculated}
                        {#if targetPosition === 1}
                          <div class="bg-zinc-800 border border-amber-600 rounded-lg p-2 flex items-center gap-2 flex-wrap">
                            <span class="text-zinc-200 text-sm">Chances for 1st:</span> 
                            <span class="bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded text-sm font-semibold">
                              {countWinScenariosForUser(selectedUser, remainingGames.filter(gameId => !selectedWinners.hasOwnProperty(gameId)))} of {totalScenarios}
                            </span>
                            <span class="text-base font-bold text-amber-500">{(positionProbabilities.find(p => p.entryId === selectedUser)?.positionProbabilities[1] || 0).toFixed(1)}%</span>
                          </div>
                        {:else}
                          <div class="bg-zinc-800 border border-amber-800/50 rounded-lg p-2 flex items-center gap-2 flex-wrap">
                            <span class="bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded text-sm font-medium">No 1st place chance</span> 
                            <span class="text-sm text-white">Best finish: <strong class="text-amber-500">{targetPosition}{getOrdinalSuffix(targetPosition)}</strong></span>
                          </div>
                        {/if}
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
              
              {#if selectedUser && Object.keys(teamWinContributions).length > 0}
                <div class="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4 mb-4">
                  <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {#each matchSimulationDetails as round}
                      {#each round.games.filter(game => !selectedWinners[game.gameId] && game.teamA && game.teamB) as game}
                        {#if teamWinContributions[game.gameId]}
                          <div class="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                            <div class="bg-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300">
                              {round.name} Match
                            </div>
                            
                            <div class="p-3">
                              <!-- Team A -->
                              <div class="flex items-center justify-between mb-2 p-2 rounded
                                        {teamWinContributions[game.gameId].favoredTeam === 'A' 
                                          ? 'bg-green-900/30 border border-green-900' 
                                          : teamWinContributions[game.gameId].teamA.wins === 0
                                            ? 'bg-red-900/30 border border-red-900'
                                            : 'bg-zinc-700/30'}"
                              >
                                <div class="flex items-center gap-2">
                                  <div class="w-8 h-8 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1">
                                    <img 
                                      src={game.teamASeoName ? `/images/team-logos/${game.teamASeoName}.svg` : '/images/placeholder-team.svg'}
                                      alt="Team logo"
                                      class="w-full h-full object-contain"
                                      on:error={handleImageError}
                                    />
                                  </div>
                                  <div>
                                    <div class="text-zinc-200 font-medium">{game.teamA}</div>
                                    <div class="text-xs text-zinc-400">
                                      {teamWinContributions[game.gameId].teamA.wins} of {teamWinContributions[game.gameId].teamA.totalScenarios} scenarios ({teamWinContributions[game.gameId].teamA.winPct.toFixed(1)}%)
                                    </div>
                                  </div>
                                </div>
                                
                                <div class="{teamWinContributions[game.gameId].favoredTeam === 'A' ? 'text-green-400' : teamWinContributions[game.gameId].teamA.wins === 0 ? 'text-red-400' : 'text-amber-400'} font-medium text-sm">
                                  {teamWinContributions[game.gameId].teamA.wins}
                                </div>
                              </div>
                              
                              <!-- Team B -->
                              <div class="flex items-center justify-between p-2 rounded
                                        {teamWinContributions[game.gameId].favoredTeam === 'B' 
                                          ? 'bg-green-900/30 border border-green-900' 
                                          : teamWinContributions[game.gameId].teamB.wins === 0
                                            ? 'bg-red-900/30 border border-red-900'
                                            : 'bg-zinc-700/30'}"
                              >
                                <div class="flex items-center gap-2">
                                  <div class="w-8 h-8 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1">
                                    <img 
                                      src={game.teamBSeoName ? `/images/team-logos/${game.teamBSeoName}.svg` : '/images/placeholder-team.svg'}
                                      alt="Team logo"
                                      class="w-full h-full object-contain"
                                      on:error={handleImageError}
                                    />
                                  </div>
                                  <div>
                                    <div class="text-zinc-200 font-medium">{game.teamB}</div>
                                    <div class="text-xs text-zinc-400">
                                      {teamWinContributions[game.gameId].teamB.wins} of {teamWinContributions[game.gameId].teamB.totalScenarios} scenarios ({teamWinContributions[game.gameId].teamB.winPct.toFixed(1)}%)
                                    </div>
                                  </div>
                                </div>
                                
                                <div class="{teamWinContributions[game.gameId].favoredTeam === 'B' ? 'text-green-400' : teamWinContributions[game.gameId].teamB.wins === 0 ? 'text-red-400' : 'text-amber-400'} font-medium text-sm">
                                  {teamWinContributions[game.gameId].teamB.wins}
                                </div>
                              </div>
                              
                              <!-- Root for summary -->
                              <div class="mt-2 text-center text-xs">
                                {#if teamWinContributions[game.gameId].teamA.wins === 0 && teamWinContributions[game.gameId].teamB.wins !== 0}
                                  <span class="text-red-400 font-semibold">Must root for <strong>{game.teamB}</strong> - only viable option</span>
                                {:else if teamWinContributions[game.gameId].teamB.wins === 0 && teamWinContributions[game.gameId].teamA.wins !== 0}
                                  <span class="text-red-400 font-semibold">Must root for <strong>{game.teamA}</strong> - only viable option</span>
                                {:else if teamWinContributions[game.gameId].favoredTeam === 'A'}
                                  <span class="text-amber-500">Root for <strong>{game.teamA}</strong> for best chances</span>
                                {:else if teamWinContributions[game.gameId].favoredTeam === 'B'}
                                  <span class="text-amber-500">Root for <strong>{game.teamB}</strong> for best chances</span>
                                {:else}
                                  <span class="text-zinc-400">This game has no significant impact</span>
                                {/if}
                              </div>
                            </div>
                          </div>
                        {/if}
                      {/each}
                    {/each}
                    
                    {#if Object.keys(teamWinContributions).filter(gameId => {
                      const game = matchSimulationDetails
                        .flatMap(round => round.games)
                        .find(g => g.gameId.toString() === gameId && g.teamA && g.teamB);
                      return game && !selectedWinners[gameId];
                    }).length === 0}
                      <div class="col-span-full bg-zinc-800 p-4 text-center text-zinc-400 rounded-lg border border-zinc-700">
                        No unassigned games found. All remaining games have already been selected or don't have both teams determined yet.
                      </div>
                    {/if}
                  </div>
                </div>
              {:else if selectedUser}
                <div class="text-center py-8 text-zinc-500">
                  No games found where both teams are determined.
                </div>
              {:else}
                <div class="text-center py-8 text-zinc-500">
                  {#if currentUser}
                    No bracket found for your account. Please select another user's bracket to see rooting interests.
                  {:else}
                    Please select a user to see rooting interests. <span class="text-amber-500">Sign in to automatically see your bracket!</span>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        {:else}
          <div class="text-center py-12 text-zinc-500">
            <div class="animate-pulse flex flex-col items-center">
              <div class="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p>Calculating tournament scenarios automatically...</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>