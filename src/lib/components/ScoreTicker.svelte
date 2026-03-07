<script>
  import { onMount, onDestroy } from 'svelte';
  import { getStatusColor, sortScoreboardGames } from '$lib/utils/scoreboardUtils';
  import { getGradientStyleFromColor } from '$lib/utils/teamColorUtils';

  export let tournamentSettings = {};
  export let tickerScores = [];

  let matches = tickerScores;
  let loading = false;
  let error = null;
  let interval;
  let duplicatedMatches = [];
  $: tournamentStage = tournamentSettings?.stage || 'archive';
  $: viewAllLabel = tournamentStage === 'tournament-live' ? 'Tournament Scores' : 'Today\'s Scores';
  $: emptyStateMessage =
    tournamentStage === 'tournament-live'
      ? 'No tournament games scheduled right now.'
      : 'No games scheduled at this time.';

  async function fetchScores() {
    try {
      const response = await fetch('/api/scores?scope=ticker');
      if (!response.ok) {
        throw new Error(`Error fetching scores: ${response.statusText}`);
      }
      const newMatches = await response.json();
      if (JSON.stringify(newMatches) !== JSON.stringify(matches)) {
        matches = newMatches;
      }
      loading = false;
    } catch (err) {
      console.error('Failed to fetch scores:', err);
      error = err.message;
      loading = false;
    }
  }

  onMount(() => {
    interval = setInterval(fetchScores, 30000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
  
  // Helper function to determine if a team is a winner
  function isWinner(team) {
    return team?.winner === true;
  }
  
  // Determine display mode based on number of games
  $: displayMode = matches.length <= 4 ? 'featured' : 'scroll';
  
  // Sort games by status and time
  $: sortedGames = sortScoreboardGames(matches);
  
  // Handle image loading errors
  function handleImageError(event) {
    event.target.src = '/images/placeholder-team.svg';
  }
  
  // Helper function to get team background style
  function getTeamStyle(team) {
    return getGradientStyleFromColor(team?.color);
  }

  // Helper function to get appropriate team name based on length
  function getDisplayName(team) {
    return team?.displayName || team?.name || '';
  }

  function getGameHref(game) {
    return game?.isTournamentGame ? `/game/${game.gameId}` : '/scores';
  }

  // Build duplicatedMatches for marquee: triple for seamless scroll when 5+ games
  $: {
    if (matches.length > 4) {
      duplicatedMatches = [...sortedGames, ...sortedGames, ...sortedGames];
    } else {
      duplicatedMatches = sortedGames;
    }
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
    {emptyStateMessage}
  </div>
{:else}
  <div class="w-full bg-black bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg">
    <!-- Featured mode for 1-4 games - show in a static layout -->
    {#if displayMode === 'featured'}
      <div class="p-2">
        <!-- Desktop: flex wrap layout -->
        <div class="hidden md:flex md:flex-wrap md:gap-2 md:justify-center">
          {#each sortedGames as game, index}
            <a href={getGameHref(game)} class="flex-shrink-0 w-72">
              <div class="game-box bg-black bg-opacity-40 rounded-xl p-4 border border-white/10">
                <div class="game-date flex justify-between items-center mb-3">
                  <span class="text-sm text-gray-400 font-medium">{game.statusLabel !== 'FINAL' ? (game.displayClock || '') : ''}</span>
                  <span class="game-prog {getStatusColor(game.statusLabel)} font-semibold px-3 py-1 rounded-full text-sm {game.statusLabel === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game.statusLabel === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game.statusLabel}</span>
                </div>
                
                <div class="game-teams space-y-3">
                  <!-- Away Team -->
                  <div class="game-team flex justify-between items-center {isWinner(game.awayTeam) ? 'font-bold' : ''} group">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                      <div class="relative w-6 h-6 flex-shrink-0">
                        <img class="w-full h-full object-contain transition-transform" 
                             alt="{game.awayTeam.name} logo" 
                             src="/images/team-logos/{game.awayTeam.seoName}.svg"
                             on:error={handleImageError}>
                      </div>
                      {#if game.awayTeam.seed}
                        <span class="rank text-xs bg-gray-700 text-white px-1 py-0.5 rounded-full font-semibold min-w-[2rem] text-center flex-shrink-0">#{game.awayTeam.seed}</span>
                      {/if}
                      <span class="text-sm font-semibold px-3 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis {isWinner(game.awayTeam) ? 'text-white' : isWinner(game.homeTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm flex-shrink"
                            style={getTeamStyle(game.awayTeam)}>
                        {getDisplayName(game.awayTeam)}
                      </span>
                    </div>
                    <div class="flex-shrink-0 w-[3rem] text-right">
                      <span class="score-value text-2xl font-bold font-condensed tabular-nums {isWinner(game.awayTeam) ? 'text-white' : 'text-gray-400'}">{game.awayTeam.scoreText}</span>
                    </div>
                  </div>
                  
                  <!-- Home Team -->
                  <div class="game-team flex justify-between items-center {isWinner(game.homeTeam) ? 'font-bold' : ''} group">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                      <div class="relative w-6 h-6 flex-shrink-0">
                        <img class="w-full h-full object-contain transition-transform" 
                             alt="{game.homeTeam.name} logo" 
                             src="/images/team-logos/{game.homeTeam.seoName}.svg"
                             on:error={handleImageError}>
                      </div>
                      {#if game.homeTeam.seed}
                        <span class="rank text-xs bg-gray-700 text-white px-1 py-0.5 rounded-full font-semibold min-w-[2rem] text-center flex-shrink-0">#{game.homeTeam.seed}</span>
                      {/if}
                      <span class="text-sm font-semibold px-3 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis {isWinner(game.homeTeam) ? 'text-white' : isWinner(game.awayTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm flex-shrink"
                            style={getTeamStyle(game.homeTeam)}>
                        {getDisplayName(game.homeTeam)}
                      </span>
                    </div>
                    <div class="flex-shrink-0 w-[3rem] text-right">
                      <span class="score-value text-2xl font-bold font-condensed tabular-nums {isWinner(game.homeTeam) ? 'text-white' : 'text-gray-400'}">{game.homeTeam.scoreText}</span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          {/each}
        </div>
        
        <!-- Mobile: horizontal scroll layout -->
        <div class="flex md:hidden overflow-x-auto py-2 px-1 scrollbar-hide">
          {#each sortedGames as game, index}
            <a href={getGameHref(game)} class="flex-shrink-0 mx-1 w-72">
              <div class="game-box bg-black bg-opacity-40 rounded-xl p-4 border border-white/10">
                <div class="game-date flex justify-between items-center mb-3">
                  <span class="text-sm text-gray-400 font-medium">{game.statusLabel !== 'FINAL' ? (game.displayClock || '') : ''}</span>
                  <span class="game-prog {getStatusColor(game.statusLabel)} font-semibold px-3 py-1 rounded-full text-sm {game.statusLabel === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game.statusLabel === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game.statusLabel}</span>
                </div>
                
                <div class="game-teams space-y-3">
                  <!-- Away Team -->
                  <div class="game-team flex justify-between items-center {isWinner(game.awayTeam) ? 'font-bold' : ''} group">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                      <div class="relative w-6 h-6 flex-shrink-0">
                        <img class="w-full h-full object-contain transition-transform" 
                             alt="{game.awayTeam.name} logo" 
                             src="/images/team-logos/{game.awayTeam.seoName}.svg"
                             on:error={handleImageError}>
                      </div>
                      {#if game.awayTeam.seed}
                        <span class="rank text-xs bg-gray-700 text-white px-1 py-0.5 rounded-full font-semibold min-w-[2rem] text-center flex-shrink-0">#{game.awayTeam.seed}</span>
                      {/if}
                      <span class="text-sm font-semibold px-3 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis {isWinner(game.awayTeam) ? 'text-white' : isWinner(game.homeTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm flex-shrink"
                            style={getTeamStyle(game.awayTeam)}>
                        {getDisplayName(game.awayTeam)}
                      </span>
                    </div>
                    <div class="flex-shrink-0 w-[3rem] text-right">
                      <span class="score-value text-2xl font-bold font-condensed tabular-nums {isWinner(game.awayTeam) ? 'text-white' : 'text-gray-400'}">{game.awayTeam.scoreText}</span>
                    </div>
                  </div>
                  
                  <!-- Home Team -->
                  <div class="game-team flex justify-between items-center {isWinner(game.homeTeam) ? 'font-bold' : ''} group">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                      <div class="relative w-6 h-6 flex-shrink-0">
                        <img class="w-full h-full object-contain transition-transform" 
                             alt="{game.homeTeam.name} logo" 
                             src="/images/team-logos/{game.homeTeam.seoName}.svg"
                             on:error={handleImageError}>
                      </div>
                      {#if game.homeTeam.seed}
                        <span class="rank text-xs bg-gray-700 text-white px-1 py-0.5 rounded-full font-semibold min-w-[2rem] text-center flex-shrink-0">#{game.homeTeam.seed}</span>
                      {/if}
                      <span class="text-sm font-semibold px-3 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis {isWinner(game.homeTeam) ? 'text-white' : isWinner(game.awayTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm flex-shrink"
                            style={getTeamStyle(game.homeTeam)}>
                        {getDisplayName(game.homeTeam)}
                      </span>
                    </div>
                    <div class="flex-shrink-0 w-[3rem] text-right">
                      <span class="score-value text-2xl font-bold font-condensed tabular-nums {isWinner(game.homeTeam) ? 'text-white' : 'text-gray-400'}">{game.homeTeam.scoreText}</span>
                    </div>
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
        <!-- Desktop View All Scores Button -->
        <div class="absolute -top-10 right-0 hidden md:block">
          <a href="/scores" class="bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl hover:transform hover:scale-[1.02]">
            <span>{viewAllLabel}</span>
          </a>
        </div>

        <!-- Mobile View All Scores button - always visible above the scores -->
        <div class="mb-3 flex justify-center md:hidden">
          <a href="/scores" 
             on:click|preventDefault={(e) => { window.location.href = '/scores'; }}
             class="bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 shadow-lg active:bg-black/70 touch-manipulation">
            <span>{viewAllLabel}</span>
          </a>
        </div>

        <div class="score-ticker relative py-2">
          <!-- Mobile view: scrollable container -->
          <div class="md:hidden flex overflow-x-auto py-2 px-1 scrollbar-hide">
            {#each sortedGames as game, index}
              <a href={getGameHref(game)} class="flex-shrink-0 mx-1 w-72">
                <div class="game-box bg-black bg-opacity-40 rounded-xl p-4 border border-white/10">
                  <div class="game-date flex justify-between items-center mb-3">
                    <span class="text-sm text-gray-400 font-medium">{game.statusLabel !== 'FINAL' ? (game.displayClock || '') : ''}</span>
                    <span class="game-prog {getStatusColor(game.statusLabel)} font-semibold px-3 py-1 rounded-full text-sm {game.statusLabel === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game.statusLabel === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game.statusLabel}</span>
                  </div>
                  
                  <div class="game-teams space-y-3">
                    <!-- Away Team -->
                    <div class="game-team flex justify-between items-center {isWinner(game.awayTeam) ? 'font-bold' : ''} group">
                      <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <div class="relative w-6 h-6 flex-shrink-0">
                          <img class="w-full h-full object-contain transition-transform" 
                               alt="{game.awayTeam.name} logo" 
                               src="/images/team-logos/{game.awayTeam.seoName}.svg"
                               on:error={handleImageError}>
                        </div>
                        {#if game.awayTeam.seed}
                          <span class="rank text-xs bg-gray-700 text-white px-1 py-0.5 rounded-full font-semibold min-w-[2rem] text-center flex-shrink-0">#{game.awayTeam.seed}</span>
                        {/if}
                        <span class="text-sm font-semibold px-3 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis {isWinner(game.awayTeam) ? 'text-white' : isWinner(game.homeTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm flex-shrink"
                              style={getTeamStyle(game.awayTeam)}>
                          {getDisplayName(game.awayTeam)}
                        </span>
                      </div>
                      <div class="flex-shrink-0 w-[3rem] text-right">
                        <span class="score-value text-2xl font-bold font-condensed tabular-nums {isWinner(game.awayTeam) ? 'text-white' : 'text-gray-400'}">{game.awayTeam.scoreText}</span>
                      </div>
                    </div>
                    
                    <!-- Home Team -->
                    <div class="game-team flex justify-between items-center {isWinner(game.homeTeam) ? 'font-bold' : ''} group">
                      <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <div class="relative w-6 h-6 flex-shrink-0">
                          <img class="w-full h-full object-contain transition-transform" 
                               alt="{game.homeTeam.name} logo" 
                               src="/images/team-logos/{game.homeTeam.seoName}.svg"
                               on:error={handleImageError}>
                        </div>
                        {#if game.homeTeam.seed}
                          <span class="rank text-xs bg-gray-700 text-white px-1 py-0.5 rounded-full font-semibold min-w-[2rem] text-center flex-shrink-0">#{game.homeTeam.seed}</span>
                        {/if}
                        <span class="text-sm font-semibold px-3 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis {isWinner(game.homeTeam) ? 'text-white' : isWinner(game.awayTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm flex-shrink"
                              style={getTeamStyle(game.homeTeam)}>
                          {getDisplayName(game.homeTeam)}
                        </span>
                      </div>
                      <div class="flex-shrink-0 w-[3rem] text-right">
                        <span class="score-value text-2xl font-bold font-condensed tabular-nums {isWinner(game.homeTeam) ? 'text-white' : 'text-gray-400'}">{game.homeTeam.scoreText}</span>
                      </div>
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
            
            <div class="marquee-container">
              <div class="marquee-content animate-marquee">
                {#each duplicatedMatches as game, index}
                  <a href={getGameHref(game)} class="flex-shrink-0 mx-2 w-72 transition-transform duration-300">
                    <div class="game-box bg-black bg-opacity-40 rounded-xl p-4 border border-white/10">
                      <div class="game-date flex justify-between items-center mb-3">
                        <span class="text-sm text-gray-400 font-medium">{game.statusLabel !== 'FINAL' ? (game.displayClock || '') : ''}</span>
                        <span class="game-prog {getStatusColor(game.statusLabel)} font-semibold px-3 rounded-full text-sm {game.statusLabel === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game.statusLabel === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game.statusLabel}</span>
                      </div>
                      
                      <div class="game-teams space-y-3">
                        <!-- Away Team -->
                        <div class="game-team flex justify-between items-center {isWinner(game.awayTeam) ? 'font-bold' : ''} group">
                          <div class="flex items-center space-x-3 flex-1 min-w-0">
                            <div class="relative w-6 h-6 flex-shrink-0">
                              <img class="w-full h-full object-contain transition-transform" 
                                   alt="{game.awayTeam.name} logo" 
                                   src="/images/team-logos/{game.awayTeam.seoName}.svg"
                                   on:error={handleImageError}>
                            </div>
                            {#if game.awayTeam.seed}
                              <span class="rank text-xs bg-gray-700 text-white px-1 py-0.5 rounded-full font-semibold min-w-[2rem] text-center flex-shrink-0">#{game.awayTeam.seed}</span>
                            {/if}
                            <span class="text-sm font-semibold px-3 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis {isWinner(game.awayTeam) ? 'text-white' : isWinner(game.homeTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm flex-shrink"
                                  style={getTeamStyle(game.awayTeam)}>
                              {getDisplayName(game.awayTeam)}
                            </span>
                          </div>
                          <div class="flex-shrink-0 w-[3rem] text-right">
                            <span class="score-value text-2xl font-bold font-condensed tabular-nums {isWinner(game.awayTeam) ? 'text-white' : 'text-gray-400'}">{game.awayTeam.scoreText}</span>
                          </div>
                        </div>
                        
                        <!-- Home Team -->
                        <div class="game-team flex justify-between items-center {isWinner(game.homeTeam) ? 'font-bold' : ''} group">
                          <div class="flex items-center space-x-3 flex-1 min-w-0">
                            <div class="relative w-6 h-6 flex-shrink-0">
                              <img class="w-full h-full object-contain transition-transform" 
                                   alt="{game.homeTeam.name} logo" 
                                   src="/images/team-logos/{game.homeTeam.seoName}.svg"
                                   on:error={handleImageError}>
                            </div>
                            {#if game.homeTeam.seed}
                              <span class="rank text-xs bg-gray-700 text-white px-1 py-0.5 rounded-full font-semibold min-w-[2rem] text-center flex-shrink-0">#{game.homeTeam.seed}</span>
                            {/if}
                            <span class="text-sm font-semibold px-3 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis {isWinner(game.homeTeam) ? 'text-white' : isWinner(game.awayTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm flex-shrink"
                                  style={getTeamStyle(game.homeTeam)}>
                              {getDisplayName(game.homeTeam)}
                            </span>
                          </div>
                          <div class="flex-shrink-0 w-[3rem] text-right">
                            <span class="score-value text-2xl font-bold font-condensed tabular-nums {isWinner(game.homeTeam) ? 'text-white' : 'text-gray-400'}">{game.homeTeam.scoreText}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                {/each}
              </div>
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
  
  :root {
    --marquee-duration: 320s; /* 4x slower marquee speed */
  }
  
  @keyframes marquee {
    0% { 
      transform: translateX(0); 
    }
    100% { 
      transform: translateX(-50%);
    }
  }
  
  .animate-marquee {
    white-space: nowrap;
    will-change: transform;
    animation: marquee var(--marquee-duration) linear infinite;
  }
  
  .marquee-container {
    width: 100%;
    overflow: hidden;
  }
  
  .marquee-content {
    display: flex;
    width: fit-content;
  }
</style> 