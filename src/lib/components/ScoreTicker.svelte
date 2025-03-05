<script>
  import { onMount, onDestroy } from 'svelte';
  
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
  <div class="w-full overflow-hidden bg-black bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg border border-white/10">
    <!-- Featured mode for 1-4 games - show in a static layout -->
    {#if displayMode === 'featured'}
      <div class="p-2">
        <div class="flex flex-wrap gap-2 justify-center">
          {#each matches as game, index}
            <a href="/game/{index}" class="flex-shrink-0 w-64">
              <div class="game-box bg-black bg-opacity-30 rounded-lg p-2 border border-white/10 hover:border-white/30 hover:bg-black/50 transition-all transform hover:-translate-y-1">
                <div class="game-date flex justify-between items-center mb-1 text-sm">
                  <span>{game[3] || ''}</span>
                  <span class="game-prog {getStatusColor(game[2])} font-semibold">{game[2].toUpperCase()}</span>
                </div>
                
                <div class="game-teams">
                  <!-- Away Team -->
                  <div class="game-team flex justify-between items-center py-1 {isWinner(game[0]) ? 'font-bold' : ''}">
                    <div class="flex items-center">
                      <img width="24" height="24" class="mr-2" alt="{game[0][0]} logo" 
                           src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[0][6]}.svg"
                           on:error={handleImageError}>
                      <span class="rank text-xs bg-gray-800 text-white px-1 rounded mr-1">{game[0][2]}</span>
                      <span class="{isWinner(game[0]) ? '' : isWinner(game[1]) ? 'line-through opacity-75' : ''}">{game[0][0]}</span>
                    </div>
                    <span class="score-value text-lg font-semibold">{game[0][1]}</span>
                  </div>
                  
                  <!-- Home Team -->
                  <div class="game-team flex justify-between items-center py-1 {isWinner(game[1]) ? 'font-bold' : ''}">
                    <div class="flex items-center">
                      <img width="24" height="24" class="mr-2" alt="{game[1][0]} logo" 
                           src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[1][6]}.svg"
                           on:error={handleImageError}>
                      <span class="rank text-xs bg-gray-800 text-white px-1 rounded mr-1">{game[1][2]}</span>
                      <span class="{isWinner(game[1]) ? '' : isWinner(game[0]) ? 'line-through opacity-75' : ''}">{game[1][0]}</span>
                    </div>
                    <span class="score-value text-lg font-semibold">{game[1][1]}</span>
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
          <a href="/scores" class="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 border border-white/10">
            <span>View All Games</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>

        <div class="score-ticker relative py-2">
          <!-- Mobile view: scrollable container -->
          <div class="md:hidden flex overflow-x-auto py-2 px-1 scrollbar-hide">
            {#each matches as game, index}
              <a href="/game/{index}" class="flex-shrink-0 mx-1 w-64">
                <div class="game-box bg-black bg-opacity-30 rounded-lg p-2 border border-white/10 hover:border-white/30 transition-all">
                  <div class="game-date flex justify-between items-center mb-1 text-sm">
                    <span>{game[3] || ''}</span>
                    <span class="game-prog {getStatusColor(game[2])} font-semibold">{game[2].toUpperCase()}</span>
                  </div>
                  
                  <div class="game-teams">
                    <!-- Away Team -->
                    <div class="game-team flex justify-between items-center py-1 {isWinner(game[0]) ? 'font-bold' : ''}">
                      <div class="flex items-center">
                        <img width="24" height="24" class="mr-2" alt="{game[0][0]} logo" 
                             src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[0][6]}.svg"
                             on:error={handleImageError}>
                        <span class="rank text-xs bg-gray-800 text-white px-1 rounded mr-1">{game[0][2]}</span>
                        <span class="{isWinner(game[0]) ? '' : isWinner(game[1]) ? 'line-through opacity-75' : ''}">{game[0][0]}</span>
                      </div>
                      <span class="score-value text-lg font-semibold">{game[0][1]}</span>
                    </div>
                    
                    <!-- Home Team -->
                    <div class="game-team flex justify-between items-center py-1 {isWinner(game[1]) ? 'font-bold' : ''}">
                      <div class="flex items-center">
                        <img width="24" height="24" class="mr-2" alt="{game[1][0]} logo" 
                             src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[1][6]}.svg"
                             on:error={handleImageError}>
                        <span class="rank text-xs bg-gray-800 text-white px-1 rounded mr-1">{game[1][2]}</span>
                        <span class="{isWinner(game[1]) ? '' : isWinner(game[0]) ? 'line-through opacity-75' : ''}">{game[1][0]}</span>
                      </div>
                      <span class="score-value text-lg font-semibold">{game[1][1]}</span>
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          </div>
          
          <!-- Desktop view: auto-scrolling marquee -->
          <div class="hidden md:block overflow-hidden">
            <div class="flex animate-marquee whitespace-nowrap">
              {#each duplicatedMatches as game, index}
                <a href="/game/{index % matches.length}" class="flex-shrink-0 mx-2 w-64">
                  <div class="game-box bg-black bg-opacity-30 rounded-lg p-2 border border-white/10 hover:border-white/30 hover:bg-black/50 transition-all transform hover:-translate-y-1">
                    <div class="game-date flex justify-between items-center mb-1 text-sm">
                      <span>{game[3] || ''}</span>
                      <span class="game-prog {getStatusColor(game[2])} font-semibold">{game[2].toUpperCase()}</span>
                    </div>
                    
                    <div class="game-teams">
                      <!-- Away Team -->
                      <div class="game-team flex justify-between items-center py-1 {isWinner(game[0]) ? 'font-bold' : ''}">
                        <div class="flex items-center">
                          <img width="24" height="24" class="mr-2" alt="{game[0][0]} logo" 
                               src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[0][6]}.svg"
                               on:error={handleImageError}>
                          <span class="rank text-xs bg-gray-800 text-white px-1 rounded mr-1">{game[0][2]}</span>
                          <span class="{isWinner(game[0]) ? '' : isWinner(game[1]) ? 'line-through opacity-75' : ''}">{game[0][0]}</span>
                        </div>
                        <span class="score-value text-lg font-semibold">{game[0][1]}</span>
                      </div>
                      
                      <!-- Home Team -->
                      <div class="game-team flex justify-between items-center py-1 {isWinner(game[1]) ? 'font-bold' : ''}">
                        <div class="flex items-center">
                          <img width="24" height="24" class="mr-2" alt="{game[1][0]} logo" 
                               src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{game[1][6]}.svg"
                               on:error={handleImageError}>
                          <span class="rank text-xs bg-gray-800 text-white px-1 rounded mr-1">{game[1][2]}</span>
                          <span class="{isWinner(game[1]) ? '' : isWinner(game[0]) ? 'line-through opacity-75' : ''}">{game[1][0]}</span>
                        </div>
                        <span class="score-value text-lg font-semibold">{game[1][1]}</span>
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
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  
  .animate-marquee {
    white-space: nowrap;
    will-change: transform;
    animation: marquee 60s linear infinite;
  }
</style> 