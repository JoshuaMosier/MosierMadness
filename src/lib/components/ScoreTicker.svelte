<script>
  import { onMount, onDestroy } from 'svelte';
  import teamColors from '$lib/ncaa_team_colors.json';
  
  let matches = [];
  let loading = true;
  let error = null;
  let interval;
  let duplicatedMatches = [];
  
  // Function to fetch NCAA score data
  async function fetchScores() {
    try {
      loading = true;
      const response = await fetch('/api/scores');
      if (!response.ok) {
        throw new Error(`Error fetching scores: ${response.statusText}`);
      }
      matches = await response.json();
      
      // Duplicate matches for continuous scrolling effect
      // Only duplicate if we have enough games to warrant scrolling
      if (matches.length > 4) {
        duplicatedMatches = [...matches, ...matches];
      } else {
        duplicatedMatches = matches;
      }
      
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
  
  // Determine display mode based on number of games
  $: displayMode = matches.length <= 4 ? 'featured' : 'scroll';
  
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
  <div class="w-full bg-black bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg">
    <!-- Featured mode for 1-4 games - show in a static layout -->
    {#if displayMode === 'featured'}
      <div class="p-2">
        <div class="flex flex-wrap gap-2 justify-center">
          {#each matches as game, index}
            <a href="/game/{index}" class="flex-shrink-0 w-64">
              <div class="game-box bg-black bg-opacity-40 rounded-xl p-4 border border-white/10">
                <div class="game-date flex justify-between items-center mb-3">
                  <span class="text-sm text-gray-400 font-medium">{game[2].toUpperCase() !== 'FINAL' ? (game[3] || '') : ''}</span>
                  <span class="game-prog {getStatusColor(game[2])} font-semibold px-3 py-1 rounded-full text-sm {game[2].toUpperCase() === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game[2].toUpperCase() === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game[2].toUpperCase()}</span>
                </div>
                
                <div class="game-teams space-y-3">
                  <!-- Away Team -->
                  <div class="game-team flex justify-between items-center {isWinner(game[0]) ? 'font-bold' : ''} group">
                    <div class="flex items-center flex-1 min-w-0">
                      <div class="relative w-8 h-8 mr-3">
                        <img class="w-full h-full object-contain transition-transform" 
                             alt="{game[0][4]} logo" 
                             src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[0][6]}.svg"
                             on:error={handleImageError}>
                      </div>
                      <div>
                        {#if game[0][2]}
                          <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-semibold">#{game[0][2]}</span>
                        {/if}
                        <span class="text-sm inline-block font-semibold px-3 py-1 rounded-md min-w-[80px] whitespace-nowrap {isWinner(game[0]) ? 'text-white' : isWinner(game[1]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm"
                              style={getTeamStyle(game[0][4])}>
                          {getDisplayName(game[0])}
                        </span>
                      </div>
                    </div>
                    <span class="score-value text-2xl font-bold ml-3 tabular-nums {isWinner(game[0]) ? 'text-white' : 'text-gray-400'}">{game[0][1]}</span>
                  </div>
                  
                  <!-- Home Team -->
                  <div class="game-team flex justify-between items-center {isWinner(game[1]) ? 'font-bold' : ''} group">
                    <div class="flex items-center flex-1 min-w-0">
                      <div class="relative w-8 h-8 mr-3">
                        <img class="w-full h-full object-contain transition-transform" 
                             alt="{game[1][4]} logo" 
                             src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[1][6]}.svg"
                             on:error={handleImageError}>
                      </div>
                      <div>
                        {#if game[1][2]}
                          <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-semibold">#{game[1][2]}</span>
                        {/if}
                        <span class="text-sm inline-block font-semibold px-3 py-1 rounded-md min-w-[80px] whitespace-nowrap {isWinner(game[1]) ? 'text-white' : isWinner(game[0]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm"
                              style={getTeamStyle(game[1][4])}>
                          {getDisplayName(game[1])}
                        </span>
                      </div>
                    </div>
                    <span class="score-value text-2xl font-bold ml-3 tabular-nums {isWinner(game[1]) ? 'text-white' : 'text-gray-400'}">{game[1][1]}</span>
                  </div>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    
    <!-- Scroll mode for 5+ games - show scrolling ticker -->
    {:else}
      <div class="relative">
        <!-- View All Scores Button -->
        <div class="absolute -top-10 right-0">
          <a href="/scores" class="bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl hover:transform hover:scale-[1.02]">
            <span>View All Scores</span>
          </a>
        </div>

        <div class="score-ticker relative py-2">
          <!-- Mobile view: scrollable container -->
          <div class="md:hidden flex overflow-x-auto py-2 px-1 scrollbar-hide">
            {#each matches as game, index}
              <a href="/game/{index}" class="flex-shrink-0 mx-1 w-64">
                <div class="game-box bg-black bg-opacity-40 rounded-xl p-4 border border-white/10">
                  <div class="game-date flex justify-between items-center mb-3">
                    <span class="text-sm text-gray-400 font-medium">{game[2].toUpperCase() !== 'FINAL' ? (game[3] || '') : ''}</span>
                    <span class="game-prog {getStatusColor(game[2])} font-semibold px-3 py-1 rounded-full text-sm {game[2].toUpperCase() === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game[2].toUpperCase() === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game[2].toUpperCase()}</span>
                  </div>
                  
                  <div class="game-teams space-y-3">
                    <!-- Away Team -->
                    <div class="game-team flex justify-between items-center {isWinner(game[0]) ? 'font-bold' : ''} group">
                      <div class="flex items-center flex-1 min-w-0">
                        <div class="relative w-8 h-8 mr-3">
                          <img class="w-full h-full object-contain transition-transform" 
                               alt="{game[0][4]} logo" 
                               src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[0][6]}.svg"
                               on:error={handleImageError}>
                        </div>
                        <div>
                          {#if game[0][2]}
                            <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-semibold">#{game[0][2]}</span>
                          {/if}
                          <span class="text-sm inline-block font-semibold px-3 py-1 rounded-md min-w-[80px] whitespace-nowrap {isWinner(game[0]) ? 'text-white' : isWinner(game[1]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm"
                                style={getTeamStyle(game[0][4])}>
                            {getDisplayName(game[0])}
                          </span>
                        </div>
                      </div>
                      <span class="score-value text-2xl font-bold ml-3 tabular-nums {isWinner(game[0]) ? 'text-white' : 'text-gray-400'}">{game[0][1]}</span>
                    </div>
                    
                    <!-- Home Team -->
                    <div class="game-team flex justify-between items-center {isWinner(game[1]) ? 'font-bold' : ''} group">
                      <div class="flex items-center flex-1 min-w-0">
                        <div class="relative w-8 h-8 mr-3">
                          <img class="w-full h-full object-contain transition-transform" 
                               alt="{game[1][4]} logo" 
                               src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[1][6]}.svg"
                               on:error={handleImageError}>
                        </div>
                        <div>
                          {#if game[1][2]}
                            <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-semibold">#{game[1][2]}</span>
                          {/if}
                          <span class="text-sm inline-block font-semibold px-3 py-1 rounded-md min-w-[80px] whitespace-nowrap {isWinner(game[1]) ? 'text-white' : isWinner(game[0]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm"
                                style={getTeamStyle(game[1][4])}>
                            {getDisplayName(game[1])}
                          </span>
                        </div>
                      </div>
                      <span class="score-value text-2xl font-bold ml-3 tabular-nums {isWinner(game[1]) ? 'text-white' : 'text-gray-400'}">{game[1][1]}</span>
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          </div>
          
          <!-- Desktop view: auto-scrolling marquee -->
          <div class="hidden md:block overflow-hidden relative">
            <!-- Gradient masks for smooth fade effect -->
            <div class="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div class="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10"></div>
            
            <div class="flex animate-marquee whitespace-nowrap hover:pause-animation">
              {#each duplicatedMatches as game, index}
                <a href="/game/{index % matches.length}" class="flex-shrink-0 mx-2 w-64 transition-transform duration-300">
                  <div class="game-box bg-black bg-opacity-40 rounded-xl p-4 border border-white/10">
                    <div class="game-date flex justify-between items-center mb-3">
                      <span class="text-sm text-gray-400 font-medium">{game[2].toUpperCase() !== 'FINAL' ? (game[3] || '') : ''}</span>
                      <span class="game-prog {getStatusColor(game[2])} font-semibold px-3 rounded-full text-sm {game[2].toUpperCase() === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game[2].toUpperCase() === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game[2].toUpperCase()}</span>
                    </div>
                    
                    <div class="game-teams space-y-3">
                      <!-- Away Team -->
                      <div class="game-team flex justify-between items-center {isWinner(game[0]) ? 'font-bold' : ''} group">
                        <div class="flex items-center flex-1 min-w-0">
                          <div class="relative w-8 h-8 mr-3">
                            <img class="w-full h-full object-contain transition-transform" 
                                 alt="{game[0][4]} logo" 
                                 src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[0][6]}.svg"
                                 on:error={handleImageError}>
                          </div>
                          <div>
                            {#if game[0][2]}
                              <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-semibold">#{game[0][2]}</span>
                            {/if}
                            <span class="text-sm inline-block font-semibold px-3 py-1 rounded-md min-w-[80px] whitespace-nowrap {isWinner(game[0]) ? 'text-white' : isWinner(game[1]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm"
                                  style={getTeamStyle(game[0][4])}>
                              {getDisplayName(game[0])}
                            </span>
                          </div>
                        </div>
                        <span class="score-value text-2xl font-bold ml-3 tabular-nums {isWinner(game[0]) ? 'text-white' : 'text-gray-400'}">{game[0][1]}</span>
                      </div>
                      
                      <!-- Home Team -->
                      <div class="game-team flex justify-between items-center {isWinner(game[1]) ? 'font-bold' : ''} group">
                        <div class="flex items-center flex-1 min-w-0">
                          <div class="relative w-8 h-8 mr-3">
                            <img class="w-full h-full object-contain transition-transform" 
                                 alt="{game[1][4]} logo" 
                                 src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[1][6]}.svg"
                                 on:error={handleImageError}>
                          </div>
                          <div>
                            {#if game[1][2]}
                              <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-semibold">#{game[1][2]}</span>
                            {/if}
                            <span class="text-sm inline-block font-semibold px-3 py-1 rounded-md min-w-[80px] whitespace-nowrap {isWinner(game[1]) ? 'text-white' : isWinner(game[0]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm"
                                  style={getTeamStyle(game[1][4])}>
                              {getDisplayName(game[1])}
                            </span>
                          </div>
                        </div>
                        <span class="score-value text-2xl font-bold ml-3 tabular-nums {isWinner(game[1]) ? 'text-white' : 'text-gray-400'}">{game[1][1]}</span>
                      </div>
                    </div>
                  </div>
                </a>
              {/each}
              
              <!-- Duplicate the first few items again to create seamless loop -->
              {#each matches.slice(0, 3) as game, index}
                <a href="/game/{index}" class="flex-shrink-0 mx-2 w-64 transition-transform duration-300">
                  <div class="game-box bg-black bg-opacity-40 rounded-xl p-4 border border-white/10">
                    <div class="game-date flex justify-between items-center mb-3">
                      <span class="text-sm text-gray-400 font-medium">{game[2].toUpperCase() !== 'FINAL' ? (game[3] || '') : ''}</span>
                      <span class="game-prog {getStatusColor(game[2])} font-semibold px-3 rounded-full text-sm {game[2].toUpperCase() === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game[2].toUpperCase() === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game[2].toUpperCase()}</span>
                    </div>
                    
                    <div class="game-teams space-y-3">
                      <!-- Away Team -->
                      <div class="game-team flex justify-between items-center {isWinner(game[0]) ? 'font-bold' : ''} group">
                        <div class="flex items-center flex-1 min-w-0">
                          <div class="relative w-8 h-8 mr-3">
                            <img class="w-full h-full object-contain transition-transform" 
                                 alt="{game[0][4]} logo" 
                                 src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[0][6]}.svg"
                                 on:error={handleImageError}>
                          </div>
                          <div>
                            {#if game[0][2]}
                              <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-semibold">#{game[0][2]}</span>
                            {/if}
                            <span class="text-sm inline-block font-semibold px-3 py-1 rounded-md min-w-[80px] whitespace-nowrap {isWinner(game[0]) ? 'text-white' : isWinner(game[1]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm"
                                  style={getTeamStyle(game[0][4])}>
                              {getDisplayName(game[0])}
                            </span>
                          </div>
                        </div>
                        <span class="score-value text-2xl font-bold ml-3 tabular-nums {isWinner(game[0]) ? 'text-white' : 'text-gray-400'}">{game[0][1]}</span>
                      </div>
                      
                      <!-- Home Team -->
                      <div class="game-team flex justify-between items-center {isWinner(game[1]) ? 'font-bold' : ''} group">
                        <div class="flex items-center flex-1 min-w-0">
                          <div class="relative w-8 h-8 mr-3">
                            <img class="w-full h-full object-contain transition-transform" 
                                 alt="{game[1][4]} logo" 
                                 src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[1][6]}.svg"
                                 on:error={handleImageError}>
                          </div>
                          <div>
                            {#if game[1][2]}
                              <span class="rank text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full mr-2 font-semibold">#{game[1][2]}</span>
                            {/if}
                            <span class="text-sm inline-block font-semibold px-3 py-1 rounded-md min-w-[80px] whitespace-nowrap {isWinner(game[1]) ? 'text-white' : isWinner(game[0]) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm"
                                  style={getTeamStyle(game[1][4])}>
                              {getDisplayName(game[1])}
                            </span>
                          </div>
                        </div>
                        <span class="score-value text-2xl font-bold ml-3 tabular-nums {isWinner(game[1]) ? 'text-white' : 'text-gray-400'}">{game[1][1]}</span>
                      </div>
                    </div>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
  
  @keyframes marquee {
    0% { 
      transform: translateX(0); 
    }
    100% { 
      transform: translateX(calc(-100% - 1rem)); /* Adjusted to account for full width */
    }
  }
  
  .animate-marquee {
    white-space: nowrap;
    will-change: transform;
    animation: marquee 40s linear infinite;
  }
  
</style> 