<script>
  import { onMount, onDestroy } from 'svelte';
  
  let matches = [];
  let loading = true;
  let error = null;
  let interval;
  
  // Function to fetch NCAA score data
  async function fetchScores() {
    try {
      loading = true;
      const response = await fetch('/api/scores');
      if (!response.ok) {
        throw new Error(`Error fetching scores: ${response.statusText}`);
      }
      matches = await response.json();
      loading = false;
    } catch (err) {
      console.error('Failed to fetch scores:', err);
      error = err.message;
      loading = false;
    }
  }
  
  // Set up auto-refresh
  onMount(() => {
    fetchScores();
    // Refresh scores every 30 seconds
    interval = setInterval(fetchScores, 30000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
  
  // Helper function to determine if a team is a winner
  function isWinner(team) {
    return team[3] === true;
  }
  
  // Helper function to get game status color
  function getStatusColor(status) {
    switch(status.toUpperCase()) {
      case 'LIVE': return 'text-yellow-300';
      case 'FINAL': return 'text-white';
      case 'PRE': return 'text-gray-400';
      default: return 'text-white';
    }
  }
  
  // Helper function to get game status priority for sorting
  function getStatusPriority(status) {
    switch(status.toUpperCase()) {
      case 'LIVE': return 0;
      case 'FINAL': return 1;
      case 'PRE': return 2;
      default: return 3;
    }
  }
  
  // Computed property for sorted matches
  $: sortedMatches = matches.slice().sort((a, b) => {
    const statusA = getStatusPriority(a[2]);
    const statusB = getStatusPriority(b[2]);
    return statusA - statusB;
  });
  
  // Handle image loading errors
  function handleImageError(event) {
    event.target.src = '/images/placeholder-team.svg';
  }
</script>

<div class="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-[1600px] mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-white">Live Scoreboard</h1>
      <div class="text-sm text-gray-400">Auto-updates every 30 seconds</div>
    </div>

    {#if loading && matches.length === 0}
      <div class="w-full py-4 text-center text-white">
        <div class="inline-block animate-pulse">
          Loading scores...
        </div>
      </div>
    {:else if error}
      <div class="w-full py-4 text-center text-red-500">
        {error}
      </div>
    {:else if matches.length === 0}
      <div class="w-full py-4 text-center text-white">
        No games scheduled at this time.
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each sortedMatches as game, index (game[0][6] + game[1][6])}
          <div class="game-box bg-black bg-opacity-30 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all">
            <div class="game-date flex justify-between items-center mb-2">
              <span class="text-sm text-gray-400">{game[3] || ''}</span>
              <span class="game-prog {getStatusColor(game[2])} font-semibold">{game[2].toUpperCase()}</span>
            </div>
            
            <div class="game-teams space-y-3">
              <!-- Away Team -->
              <div class="game-team flex justify-between items-center {isWinner(game[0]) ? 'font-bold' : ''}">
                <div class="flex items-center flex-1 min-w-0">
                  <img width="32" height="32" class="mr-3" alt="{game[0][0]} logo" 
                       src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[0][6]}.svg"
                       on:error={handleImageError}>
                  <div class="truncate">
                    <span class="rank text-xs bg-gray-800 text-white px-1 rounded mr-1">{game[0][2]}</span>
                    <span class="text-lg {isWinner(game[0]) ? '' : isWinner(game[1]) ? 'line-through opacity-75' : ''}">{game[0][0]}</span>
                  </div>
                </div>
                <span class="score-value text-2xl font-semibold ml-3">{game[0][1]}</span>
              </div>
              
              <!-- Home Team -->
              <div class="game-team flex justify-between items-center {isWinner(game[1]) ? 'font-bold' : ''}">
                <div class="flex items-center flex-1 min-w-0">
                  <img width="32" height="32" class="mr-3" alt="{game[1][0]} logo" 
                       src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[1][6]}.svg"
                       on:error={handleImageError}>
                  <div class="truncate">
                    <span class="rank text-xs bg-gray-800 text-white px-1 rounded mr-1">{game[1][2]}</span>
                    <span class="text-lg {isWinner(game[1]) ? '' : isWinner(game[0]) ? 'line-through opacity-75' : ''}">{game[1][0]}</span>
                  </div>
                </div>
                <span class="score-value text-2xl font-semibold ml-3">{game[1][1]}</span>
              </div>
            </div>
            
            <div class="mt-3 text-sm text-gray-400 text-center">
              {game[0][5]} vs {game[1][5]}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Add any component-specific styles here */
</style> 