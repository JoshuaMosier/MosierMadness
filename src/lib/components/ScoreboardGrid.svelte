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
  
  // Add the same helper function after other helper functions
  function parseGameTime(timeStr) {
    if (!timeStr) return null;
    
    // Convert 12-hour format to 24-hour for proper comparison
    const match = timeStr.match(/(\d{1,2}):(\d{2})(PM|AM)\s*ET/i);
    if (!match) return null;
    
    let [_, hours, minutes, period] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    
    // Convert to 24-hour format
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return { hours, minutes };
  }
  
  // Update the sortedMatches computed property
  $: sortedMatches = matches.slice().sort((a, b) => {
    const statusA = a[2].toUpperCase();
    const statusB = b[2].toUpperCase();
    
    // First sort by status priority
    if (statusA !== statusB) {
      return getStatusPriority(statusA) - getStatusPriority(statusB);
    }
    
    // If both are PRE, sort by game time
    if (statusA === 'PRE') {
      const timeA = parseGameTime(a[3]);
      const timeB = parseGameTime(b[3]);
      
      if (timeA && timeB) {
        if (timeA.hours !== timeB.hours) {
          return timeA.hours - timeB.hours;
        }
        return timeA.minutes - timeB.minutes;
      }
    }
    
    return 0;
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
      return `background: linear-gradient(to right, 
        rgba(${r}, ${g}, ${b}, ${opacity}) 0%,
        rgba(${r}, ${g}, ${b}, ${0.6}) 100%
      )`;
    }
    return 'background-color: rgba(39, 39, 42, 0.8)'; // Default background for teams without colors
  }

  // Helper function to get appropriate team name based on length
  function getDisplayName(team) {
    const shortName = team[4];
    const char6Name = team[0];
    return shortName.length > 14 ? char6Name : shortName;
  }
</script>

<div class="min-h-screen py-4 sm:py-8 px-2 sm:px-4 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold text-white">Live Scoreboard</h1>
      <div class="text-xs sm:text-sm text-gray-400">Auto-updates every 10 seconds</div>
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
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
        {#each sortedMatches as game, index (game[0][6] + game[1][6])}
          <a href="/game/{matches.findIndex(m => 
            m[0][4] === game[0][4] && 
            m[1][4] === game[1][4] && 
            m[2] === game[2]
          )}" class="game-box bg-gradient-to-br from-stone-950/90 to-black/90 rounded-lg sm:rounded-xl p-2 sm:p-5 border border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:transform hover:scale-[1.02] hover:from-zinc-700/90 hover:to-zinc-800/90">
            <div class="game-date flex justify-between items-center mb-2 sm:mb-3">
              <span class="text-xs sm:text-sm text-gray-400 font-semibold">{game[2].toUpperCase() !== 'FINAL' ? (game[3] || '') : ''}</span>
              <span class="game-prog {getStatusColor(game[2])} font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm {game[2].toUpperCase() === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game[2].toUpperCase() === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game[2].toUpperCase()}</span>
            </div>
            
            <div class="game-teams space-y-2 sm:space-y-4">
              <!-- Away Team -->
              <div class="game-team flex items-center space-x-1 sm:space-x-2 py-1 sm:py-2 {isWinner(game[0]) ? 'font-bold' : ''} group">
                <div class="relative w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                  <img class="w-full h-full object-contain" 
                       alt="{game[0][4]} logo" 
                       src="/images/team-logos/{game[0][6]}.svg"
                       on:error={handleImageError}>
                </div>
                {#if game[0][2]}
                  <span class="rank text-xxs sm:text-xs bg-gray-700 text-white px-1 sm:px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 min-w-[1.5rem] sm:min-w-[2rem] inline-block text-center">#{game[0][2]}</span>
                {/if}
                <span class="text-sm sm:text-lg px-1 sm:px-2 py-0.5 sm:py-1 rounded-md flex-grow {isWinner(game[0]) ? 'text-white font-semibold' : isWinner(game[1]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm truncate"
                      style={getTeamStyle(game[0][4])}>
                  {getDisplayName(game[0])}
                </span>
                <span class="score-value text-lg sm:text-2xl font-bold tabular-nums flex-shrink-0 {isWinner(game[0]) ? 'text-white' : 'text-gray-400'}">{game[0][1]}</span>
              </div>
              
              <!-- Home Team -->
              <div class="game-team flex items-center space-x-1 sm:space-x-2 py-1 sm:py-2 {isWinner(game[1]) ? 'font-bold' : ''} group">
                <div class="relative w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                  <img class="w-full h-full object-contain" 
                       alt="{game[1][4]} logo" 
                       src="/images/team-logos/{game[1][6]}.svg"
                       on:error={handleImageError}>
                </div>
                {#if game[1][2]}
                  <span class="rank text-xxs sm:text-xs bg-gray-700 text-white px-1 sm:px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 min-w-[1.5rem] sm:min-w-[2rem] inline-block text-center">#{game[1][2]}</span>
                {/if}
                <span class="text-sm sm:text-lg px-1 sm:px-2 py-0.5 sm:py-1 rounded-md flex-grow {isWinner(game[1]) ? 'text-white font-semibold' : isWinner(game[0]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm truncate"
                      style={getTeamStyle(game[1][4])}>
                  {getDisplayName(game[1])}
                </span>
                <span class="score-value text-lg sm:text-2xl font-bold tabular-nums flex-shrink-0 {isWinner(game[1]) ? 'text-white' : 'text-gray-400'}">{game[1][1]}</span>
              </div>
            </div>
            
            <div class="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-400 text-center font-semibold border-t border-white/5 pt-2 sm:pt-3">
              {game[0][5]} vs {game[1][5]}
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Add text-xxs size for very small text on mobile */
  .text-xxs {
    font-size: 0.65rem;
    line-height: 0.85rem;
  }
</style>