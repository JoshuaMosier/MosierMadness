<script>
  import { onMount, onDestroy } from 'svelte';
  import teamColors from '$lib/ncaa_team_colors.json';
  
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
    // Refresh scores every 10 seconds
    interval = setInterval(fetchScores, 10000);
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
  
  // Helper function to get team background style
  function getTeamStyle(teamName) {
    if (teamName && teamColors[teamName]) {
      const color = teamColors[teamName].primary_color;
      const opacity = 0.8;
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `background-color: rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return 'background-color: rgba(39, 39, 42, 0.8)'; // Default background for teams without colors
  }
</script>

<div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-white">Live Scoreboard</h1>
      <div class="text-sm text-gray-400">Auto-updates every 10 seconds</div>
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each sortedMatches as game, index (game[0][6] + game[1][6])}
          <div class="game-box bg-gradient-to-br from-stone-950/90 to-black/90 rounded-xl p-5 border border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:transform hover:scale-[1.02] hover:from-zinc-700/90 hover:to-zinc-800/90">
            <div class="game-date flex justify-between items-center mb-3">
              <span class="text-sm text-gray-400 font-medium">{game[2].toUpperCase() !== 'FINAL' ? (game[3] || '') : ''}</span>
              <span class="game-prog {getStatusColor(game[2])} font-semibold px-3 py-1 rounded-full text-sm {game[2].toUpperCase() === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game[2].toUpperCase() === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game[2].toUpperCase()}</span>
            </div>
            
            <div class="game-teams space-y-4">
              <!-- Away Team -->
              <div class="game-team flex justify-between items-center {isWinner(game[0]) ? 'font-bold' : ''} group">
                <div class="flex items-center flex-1 min-w-0">
                  <div class="relative w-10 h-10 mr-4">
                    <img class="w-full h-full object-contain" 
                         alt="{game[0][4]} logo" 
                         src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[0][6]}.svg"
                         on:error={handleImageError}>
                  </div>
                  <div class="truncate">
                    {#if game[0][2]}
                      <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-medium">#{game[0][2]}</span>
                    {/if}
                    <span class="text-lg inline-flex items-center px-3 py-1.5 rounded-md min-w-[120px] {isWinner(game[0]) ? 'text-white font-medium' : isWinner(game[1]) ? 'line-through opacity-75' : ''} transition-all duration-200 shadow-sm"
                          style={getTeamStyle(game[0][4])}>
                      {game[0][4]}
                    </span>
                  </div>
                </div>
                <span class="score-value text-3xl font-bold ml-4 tabular-nums {isWinner(game[0]) ? 'text-white' : 'text-gray-400'}">{game[0][1]}</span>
              </div>
              
              <!-- Home Team -->
              <div class="game-team flex justify-between items-center {isWinner(game[1]) ? 'font-bold' : ''} group">
                <div class="flex items-center flex-1 min-w-0">
                  <div class="relative w-10 h-10 mr-4">
                    <img class="w-full h-full object-contain" 
                         alt="{game[1][4]} logo" 
                         src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[1][6]}.svg"
                         on:error={handleImageError}>
                  </div>
                  <div class="truncate">
                    {#if game[1][2]}
                      <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-medium">#{game[1][2]}</span>
                    {/if}
                    <span class="text-lg inline-flex items-center px-3 py-1.5 rounded-md min-w-[120px] {isWinner(game[1]) ? 'text-white font-medium' : isWinner(game[0]) ? 'line-through opacity-75' : ''} transition-all duration-200 shadow-sm"
                          style={getTeamStyle(game[1][4])}>
                      {game[1][4]}
                    </span>
                  </div>
                </div>
                <span class="score-value text-3xl font-bold ml-4 tabular-nums {isWinner(game[1]) ? 'text-white' : 'text-gray-400'}">{game[1][1]}</span>
              </div>
            </div>
            
            <div class="mt-4 text-sm text-gray-400 text-center font-medium border-t border-white/5 pt-3">
              {game[0][5]} vs {game[1][5]}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>