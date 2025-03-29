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
  let selectedTab = 'win'; // 'win' or 'full'
  
  // Results tracking
  let userWinCounts = [];
  let positionProbabilities = []; // Track probabilities for each position
  
  onMount(async () => {
    try {
      await fetchData();
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
    
    // Fetch all brackets with user profiles
    const { data, error: bracketsError } = await supabase
      .from('brackets')
      .select('*, profiles(*)');
    
    if (bracketsError) throw new Error('Failed to fetch brackets: ' + bracketsError.message);
    
    entries = data.map(bracket => ({
      entryId: bracket.id,
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
    
    // Calculate total number of scenarios
    // Each game has 2 possible outcomes, so total is 2^(number of remaining games)
    totalScenarios = Math.pow(2, remainingGames.length);
    
    // Create a recursive function to explore all possible scenario branches
    await exploreScenarios(scenarioBracket, 0);
    
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
    
    simulationInProgress = false;
    scenariosCalculated = true;
  }
  
  // Recursive function to explore all possible scenario branches
  async function exploreScenarios(bracket, gameIndex) {
    // Base case: if we've assigned winners to all remaining games
    if (gameIndex >= remainingGames.length) {
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
            // Award each person in the tie group a full win for each position they're tied for
            const positions = tieGroup.map((_, index) => currentPosition + index);
            
            for (const tiedScore of tieGroup) {
              // Update win count if tied for first
              if (positions.includes(1)) {
                const winCounter = userWinCounts.find(u => u.entryId === tiedScore.entryId);
                if (winCounter) {
                  winCounter.winCount += 1;
                }
              }
              
              // Update position counts
              const positionCounter = positionProbabilities.find(p => p.entryId === tiedScore.entryId);
              if (positionCounter) {
                // For each position in the tie range
                for (const position of positions) {
                  // Add a fractional count for the position (1/number of tied players)
                  positionCounter.positions[position] += 1;
                }
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
        const positions = tieGroup.map((_, index) => currentPosition + index);
        
        for (const tiedScore of tieGroup) {
          // Update win count if tied for first
          if (positions.includes(1)) {
            const winCounter = userWinCounts.find(u => u.entryId === tiedScore.entryId);
            if (winCounter) {
              winCounter.winCount += 1;
            }
          }
          
          // Update position counts
          const positionCounter = positionProbabilities.find(p => p.entryId === tiedScore.entryId);
          if (positionCounter) {
            // For each position in the tie range
            for (const position of positions) {
              // Add a fractional count for the position
              positionCounter.positions[position] += 1;
            }
          }
        }
      }
      
      return;
    }
    
    // For each remaining game, try both possible outcomes
    const currentGame = remainingGames[gameIndex];
    
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
    await exploreScenarios(bracketWithA, gameIndex + 1);
    
    // Try outcome 2: Team B wins
    const bracketWithB = [...bracket];
    bracketWithB[currentGame] = teamB;
    await exploreScenarios(bracketWithB, gameIndex + 1);
    
    // For large tournaments, we need to allow UI updates
    if (gameIndex === 0 && remainingGames.length > 10) {
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
    
    // Green for high probabilities, yellow for medium, red for low
    const hue = Math.min(120, Math.round(relativeStrength * 120));
    const saturation = 75;
    const lightness = 50;
    
    // Alpha increases with relative strength
    const alpha = Math.min(0.9, 0.2 + relativeStrength * 0.7);
    
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
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
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
              Based on {scenariosCalculated ? totalScenarios.toLocaleString() : 'all possible'} tournament outcomes
            </p>
            <p class="text-zinc-400 text-sm">
              Calculating with {entries.length} complete {entries.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          
          <button 
            class="mt-4 md:mt-0 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center"
            on:click={calculateAllScenarios}
            disabled={simulationInProgress}
          >
            {#if simulationInProgress}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Calculating...
            {:else}
              Calculate All Scenarios
            {/if}
          </button>
        </div>
        
        {#if remainingGames.length > 12}
          <div class="bg-amber-900/20 border border-amber-800/30 text-amber-400 p-3 rounded mb-4 text-sm">
            Warning: There are {remainingGames.length} games remaining, which means {Math.pow(2, remainingGames.length).toLocaleString()} possible scenarios. 
            Calculation may take a long time or crash your browser.
          </div>
        {/if}
        
        {#if scenariosCalculated}
          <!-- Mobile view (Win probability only) -->
          <div class="md:hidden">
            <!-- Win probability table -->
            <div class="overflow-x-auto rounded-lg border border-zinc-700">
              <table class="w-full divide-y divide-zinc-700">
                <thead class="bg-zinc-800">
                  <tr>
                    <th scope="col" class="px-2 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" class="px-2 py-3 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Win %
                    </th>
                    <th scope="col" class="px-2 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Wins
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-zinc-800/50 divide-y divide-zinc-700">
                  {#each userWinCounts as user, i}
                    <tr class={i % 2 === 0 ? 'bg-zinc-800' : ''}>
                      <td class="px-2 py-3 whitespace-nowrap text-sm text-zinc-300">
                        {user.firstName} {user.lastName}
                      </td>
                      <td class="px-2 py-3 whitespace-nowrap text-sm text-zinc-300 text-center">
                        <div class="inline-flex items-center">
                          <span class="text-amber-500 font-medium text-sm">{user.winProbability.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td class="px-2 py-3 whitespace-nowrap text-xs text-zinc-400 text-right">
                        {user.winCount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Desktop view (Full position probabilities only) -->
          <div class="hidden md:block">
            <!-- Full position probability table -->
            <div class="mb-2 text-xs text-zinc-400">
              <p>Table sorted by best possible finish, then by probability of that finish. A dash (-) indicates a 0% chance.</p>
            </div>
            <div class="overflow-x-auto pb-4">
              <table class="min-w-full divide-y divide-zinc-700 whitespace-nowrap">
                <thead class="bg-zinc-800">
                  <tr>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider sticky left-0 bg-zinc-800 z-10">
                      Name
                    </th>
                    {#each Array(entries.length) as _, i}
                      <th scope="col" class="px-2 py-3 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider">
                        {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}
                      </th>
                    {/each}
                  </tr>
                </thead>
                <tbody class="bg-zinc-800/50 divide-y divide-zinc-700">
                  {#each getSortedPositionData() as user, i}
                    {@const userProbabilities = Object.values(user.positionProbabilities)}
                    {@const maxProbability = Math.max(...userProbabilities, 0.1)}
                    <tr class={i % 2 === 0 ? 'bg-zinc-800' : ''}>
                      <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-300 sticky left-0 {i % 2 === 0 ? 'bg-zinc-700' : 'bg-zinc-800'} z-10">
                        {user.firstName} {user.lastName}
                      </td>
                      {#each Array(entries.length) as _, j}
                        {@const position = j + 1}
                        {@const probability = user.positionProbabilities[position] || 0}
                        <td class="px-2 py-3 whitespace-nowrap text-center" 
                            style="background-color: {getRowHeatmapColor(probability, maxProbability)}">
                          <span class="{probability === 0 ? 'text-zinc-500 font-normal' : 'text-white font-medium'} text-sm">
                            {probability === 0 ? '-' : probability.toFixed(1) + '%'}
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
                  <div class="w-4 h-4 rounded" style="background-color: hsla(120, 75%, 50%, 0.8)"></div>
                  <span>Most likely position</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-4 h-4 rounded" style="background-color: hsla(60, 75%, 50%, 0.6)"></div>
                  <span>Medium likelihood</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-4 h-4 rounded" style="background-color: hsla(0, 75%, 50%, 0.4)"></div>
                  <span>Less likely position</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-4 h-4 rounded" style="background-color: rgba(50, 50, 50, 0.2)"></div>
                  <span>0.0% (impossible)</span>
                </div>
              </div>
              <p class="text-center">Colors show relative likelihood for each player (row-based) rather than absolute percentages.</p>
            </div>
          </div>
        {:else}
          <div class="text-center py-12 text-zinc-500">
            Click "Calculate All Scenarios" to see each participant's probability of finishing in each position.
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }

  /* Ensure text is readable in light mode too */
  @media (prefers-color-scheme: light) {
    .bg-gradient-to-r.from-amber-700.to-amber-600 {
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
  }
</style> 