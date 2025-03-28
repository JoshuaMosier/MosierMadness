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
  
  // Results tracking
  let userWinCounts = [];
  
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
    
    // Initialize user win counters
    userWinCounts = entries.map(entry => ({
      entryId: entry.entryId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      winCount: 0,
      winProbability: 0
    }));
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
      const sortedScores = [...scenarioScores].sort((a, b) => b.total - a.total);
      
      // Check for ties at first place
      const highestScore = sortedScores[0].total;
      const tiedWinners = sortedScores.filter(score => score.total === highestScore);
      
      // Award a full win to each tied winner
      for (const winner of tiedWinners) {
        const userWinCount = userWinCounts.find(u => u.entryId === winner.entryId);
        if (userWinCount) {
          userWinCount.winCount += 1;
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
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold mb-4">
      <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md inline-block">
        Tournament Scenarios
      </span>
    </h1>
    <p class="text-zinc-400 mt-4 max-w-2xl mx-auto">
      Calculate the probability of each participant winning based on all possible outcomes 
      for the {remainingGames.length} remaining games.
    </p>
  </div>

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
            <h2 class="text-xl font-bold text-amber-500">Win Probabilities</h2>
            <p class="text-zinc-400 text-sm mt-1">
              Based on {scenariosCalculated ? totalScenarios.toLocaleString() : 'all possible'} tournament outcomes
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
          <div class="bg-zinc-800/30 rounded-lg p-3 mb-4 text-sm text-zinc-400">
            <p><span class="text-amber-500 font-medium">Note on ties:</span> When multiple users tie for first place in a scenario, each receives a full win. Therefore, percentages represent the probability of winning OR tying for first place.</p>
          </div>
          
          <div class="overflow-hidden rounded-lg border border-zinc-700">
            <table class="min-w-full divide-y divide-zinc-700">
              <thead class="bg-zinc-800">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider">
                    Win/Tie %
                  </th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">
                    Win/Tie Scenarios
                  </th>
                </tr>
              </thead>
              <tbody class="bg-zinc-800/50 divide-y divide-zinc-700">
                {#each userWinCounts as user, i}
                  <tr class={i % 2 === 0 ? 'bg-zinc-800/30' : ''}>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-300">
                      {i + 1}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {user.firstName} {user.lastName}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 text-center">
                      <div class="inline-flex items-center">
                        <div class="relative w-full bg-zinc-700 rounded-full h-2.5 w-24 mx-auto">
                          <div class="bg-amber-600 h-2.5 rounded-full" style="width: {Math.min(100, user.winProbability)}%"></div>
                        </div>
                        <span class="ml-3 text-amber-500 font-medium">{user.winProbability.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 text-right">
                      {user.winCount.toLocaleString(undefined, {maximumFractionDigits: 1})} / {totalScenarios.toLocaleString()}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-center py-12 text-zinc-500">
            Click "Calculate All Scenarios" to see each participant's probability of winning the tournament.
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