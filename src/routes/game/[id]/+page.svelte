<script>
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  
  export let data;
  
  let gameData = data.gameDetail?.game || null;
  let pageError = !gameData ? 'No games available at this time' : null;
  let entriesLoading = false;
  let teamSelections = data.gameDetail?.teamSelections || { home: [], away: [], other: [] };
  let currentUserId = null; // Store the current user's ID
  
  // Get the current user's ID on mount
  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId = user.id;
    }
  });
  
  // Helper function to check if an entry belongs to the current user
  function isCurrentUser(entry) {
    return entry.user_id === currentUserId;
  }
  
  // Helper function to determine if a team is a winner
  function isWinner(team) {
    return team?.winner === true;
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
  
  // Handle image loading errors
  function handleImageError(event) {
    event.target.src = '/images/placeholder-team.svg';
  }
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
  <div class="p-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
  {#if entriesLoading}
    <div class="w-full py-12 text-center">
      <div class="inline-block animate-pulse text-white">
        Loading game details...
      </div>
    </div>
  {:else if pageError}
    <div class="bg-black bg-opacity-30 rounded-lg p-6 shadow-lg border border-white/10 max-w-2xl mx-auto">
      <div class="text-center py-8">
        <div class="text-red-500 mb-4">{pageError}</div>
        <p class="text-white">There are no games scheduled at this time. Check back during tournament play.</p>
        
        <div class="mt-8">
          <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  {:else if gameData}
    <div class="game-container">
      <!-- Game Info Section -->
      <div class="bg-black bg-opacity-30 rounded-lg p-6 shadow-lg border border-white/10 mx-auto mb-6">
        <div class="game-status mb-4 text-center">
          {#if gameData.statusLabel === 'LIVE'}
            <div class="text-yellow-300 font-bold text-xl">{gameData.statusLabel} - {gameData.displayClock}</div>
          {:else if gameData.statusLabel === 'FINAL'}
            <div class="text-white font-bold text-xl">FINAL</div>
          {:else}
            <div class="text-gray-300 text-xl">
              {gameData.statusLabel} - {gameData.displayClock}
            </div>
          {/if}
        </div>
        
        <div class="game-content flex flex-row justify-between items-center gap-4 py-4">
          <!-- Away Team -->
          <div class="team-block text-center flex-1">
            <img 
              class="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2" 
              src="/images/team-logos/{gameData.awayTeam.seoName}.svg" 
              alt="{gameData.awayTeam.name} logo"
              on:error={handleImageError}
            >
            <div class="team-seed bg-gray-800 text-white inline-block px-2 py-1 rounded mb-1">
              #{gameData.awayTeam.seed}
            </div>
            <div class="team-name text-lg sm:text-xl font-semibold mb-1 {isWinner(gameData.awayTeam) ? 'text-white' : isWinner(gameData.homeTeam) ? 'text-gray-400 line-through' : 'text-white'}">
              {gameData.awayTeam.name}
            </div>
            <div class="team-score text-3xl sm:text-4xl font-bold {isWinner(gameData.awayTeam) ? 'text-yellow-300' : 'text-white'}">
              {gameData.awayTeam.scoreText}
            </div>
            {#if isWinner(gameData.awayTeam)}
              <div class="winner-badge mt-2 text-green-400 font-semibold">WINNER</div>
            {/if}
          </div>
          
          <div class="text-xl font-bold text-white">VS</div>
          
          <!-- Home Team -->
          <div class="team-block text-center flex-1">
            <img 
              class="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2" 
              src="/images/team-logos/{gameData.homeTeam.seoName}.svg" 
              alt="{gameData.homeTeam.name} logo"
              on:error={handleImageError}
            >
            <div class="team-seed bg-gray-800 text-white inline-block px-2 py-1 rounded mb-1">
              #{gameData.homeTeam.seed}
            </div>
            <div class="team-name text-lg sm:text-xl font-semibold mb-1 {isWinner(gameData.homeTeam) ? 'text-white' : isWinner(gameData.awayTeam) ? 'text-gray-400 line-through' : 'text-white'}">
              {gameData.homeTeam.name}
            </div>
            <div class="team-score text-3xl sm:text-4xl font-bold {isWinner(gameData.homeTeam) ? 'text-yellow-300' : 'text-white'}">
              {gameData.homeTeam.scoreText}
            </div>
            {#if isWinner(gameData.homeTeam)}
              <div class="winner-badge mt-2 text-green-400 font-semibold">WINNER</div>
            {/if}
          </div>
        </div>
        
        <div class="game-details mt-6 pt-4 border-t border-white/10">
          <div class="text-center text-gray-300">
            <p>{gameData.matchup}</p>
          </div>
        </div>
      </div>

      <!-- Entries Comparison Section -->
      <div class="bg-black bg-opacity-30 rounded-lg p-6 shadow-lg border border-white/10">
        <h3 class="text-center text-2xl text-white font-semibold mb-6">Who Picked Each Team</h3>
        
        {#if entriesLoading}
          <div class="flex justify-center py-8">
            <div class="animate-pulse text-white">Loading entries...</div>
          </div>
        {:else}
          <!-- Mobile Layout (Below md breakpoint) -->
          <div class="md:hidden space-y-6">
            <!-- Away Team Section -->
            <div class="team-section">
              <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-2">
                <img 
                  class="w-6 h-6 sm:w-8 sm:h-8" 
                  src="/images/team-logos/{gameData.awayTeam.seoName}.svg" 
                  alt="{gameData.awayTeam.name} logo"
                  on:error={handleImageError}
                >
                <h4 class="text-base sm:text-lg font-semibold text-white">{gameData.awayTeam.name} ({teamSelections.away.length})</h4>
              </div>
              
              <div class="bg-zinc-800/30 p-2 sm:p-4 rounded-b-lg">
                {#if teamSelections.away.length === 0}
                  <div class="text-center text-gray-400 py-4">No entries picked this team.</div>
                {:else}
                  <div class="grid grid-cols-2 gap-2 sm:gap-3">
                    {#each teamSelections.away as entry}
                      <div class="px-2 py-1 sm:px-3 sm:py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate text-sm sm:text-base"
                          title={entry.name}
                        >
                          {entry.name}
                        </a>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Home Team Section -->
            <div class="team-section">
              <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-2">
                <img 
                  class="w-6 h-6 sm:w-8 sm:h-8" 
                  src="/images/team-logos/{gameData.homeTeam.seoName}.svg" 
                  alt="{gameData.homeTeam.name} logo"
                  on:error={handleImageError}
                >
                <h4 class="text-base sm:text-lg font-semibold text-white">{gameData.homeTeam.name} ({teamSelections.home.length})</h4>
              </div>
              
              <div class="bg-zinc-800/30 p-2 sm:p-4 rounded-b-lg">
                {#if teamSelections.home.length === 0}
                  <div class="text-center text-gray-400 py-4">No entries picked this team.</div>
                {:else}
                  <div class="grid grid-cols-2 gap-2 sm:gap-3">
                    {#each teamSelections.home as entry}
                      <div class="px-2 py-1 sm:px-3 sm:py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate text-sm sm:text-base"
                          title={entry.name}
                        >
                          {entry.name}
                        </a>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Desktop Layout (md breakpoint and above) -->
          <div class="hidden md:flex md:flex-row justify-between gap-8">
            <!-- Away Team Picks Column -->
            <div class="flex-1 team-column">
              <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-3">
                <img 
                  class="w-8 h-8" 
                  src="/images/team-logos/{gameData.awayTeam.seoName}.svg" 
                  alt="{gameData.awayTeam.name} logo"
                  on:error={handleImageError}
                >
                <h4 class="text-lg font-semibold text-white">{gameData.awayTeam.name} ({teamSelections.away.length})</h4>
              </div>
              
              <div class="bg-zinc-800/30 p-4 rounded-b-lg">
                {#if teamSelections.away.length === 0}
                  <div class="text-center text-gray-400 py-6">No entries picked this team.</div>
                {:else}
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {#each teamSelections.away as entry}
                      <div class="px-3 py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate"
                          title={entry.name}
                        >
                          {entry.name}
                        </a>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Home Team Picks Column -->
            <div class="flex-1 team-column">
              <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-3">
                <img 
                  class="w-8 h-8" 
                  src="/images/team-logos/{gameData.homeTeam.seoName}.svg" 
                  alt="{gameData.homeTeam.name} logo"
                  on:error={handleImageError}
                >
                <h4 class="text-lg font-semibold text-white">{gameData.homeTeam.name} ({teamSelections.home.length})</h4>
              </div>
              
              <div class="bg-zinc-800/30 p-4 rounded-b-lg">
                {#if teamSelections.home.length === 0}
                  <div class="text-center text-gray-400 py-6">No entries picked this team.</div>
                {:else}
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {#each teamSelections.home as entry}
                      <div class="px-3 py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate"
                          title={entry.name}
                        >
                          {entry.name}
                        </a>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Unexpected Team Picks Section with logos -->
      {#if teamSelections.other && teamSelections.other.length > 0}
        <div class="bg-black bg-opacity-30 rounded-lg p-4 shadow-lg border border-white/10 mt-6">
          <h3 class="text-center text-xl text-white font-semibold mb-4">Alternate Predictions</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            {#each teamSelections.other as teamGroup}
              <div class="bg-zinc-800/30 rounded-lg overflow-hidden">
                <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-2">
                  <img 
                    class="w-6 h-6 sm:w-8 sm:h-8" 
                    src="/images/team-logos/{teamGroup.seoName}.svg" 
                    alt="{teamGroup.name} logo"
                    on:error={handleImageError}
                  >
                  <div class="team-seed bg-gray-700 text-white inline-block px-1.5 py-0.5 rounded text-sm">
                    #{teamGroup.seed}
                  </div>
                  <h4 class="text-base sm:text-lg font-semibold text-white">{teamGroup.name} ({teamGroup.count})</h4>
                </div>
                
                <div class="bg-zinc-800/30 p-2 sm:p-4 rounded-b-lg">
                  <div class="grid grid-cols-2 gap-1.5 text-sm">
                    {#each teamGroup.users as entry}
                      <div class="px-2 py-1 sm:px-3 sm:py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate text-sm sm:text-base"
                          title={entry.name}
                        >
                          {entry.name}
                        </a>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
</div>