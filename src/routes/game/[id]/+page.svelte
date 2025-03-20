<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  export let data;
  
  let gameData = null;
  let loading = false;
  let error = null;
  let allGames = [];
  
  $: {
    const matches = data.matches;
    const gameId = data.gameId;
    
    if (matches && matches.length > 0) {
      // Find the game by matching teams and time
      const targetGame = matches[gameId];
      if (targetGame) {
        gameData = targetGame;
      } else {
        gameData = matches[0];
        console.warn(`Game ID ${gameId} not found, showing first game instead`);
      }
    } else {
      error = 'No games available at this time';
    }
  }
  
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
  
  // Handle image loading errors
  function handleImageError(event) {
    event.target.src = '/images/placeholder-team.svg';
  }
</script>

<div class="max-w-3xl mx-auto px-4 py-8">
  <div class="p-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
  {#if loading}
    <div class="w-full py-12 text-center">
      <div class="inline-block animate-pulse text-white">
        Loading game details...
      </div>
    </div>
  {:else if error}
    <div class="bg-black bg-opacity-30 rounded-lg p-6 shadow-lg border border-white/10 max-w-2xl mx-auto">
      <div class="text-center py-8">
        <div class="text-red-500 mb-4">{error}</div>
        <p class="text-white">There are no games scheduled at this time. Check back during tournament play.</p>
        
        <div class="mt-8">
          <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  {:else if gameData}
    <div class="bg-black bg-opacity-30 rounded-lg p-6 shadow-lg border border-white/10 max-w-2xl mx-auto">
      <div class="game-status mb-4 text-center">
        {#if gameData[2].toUpperCase() === 'LIVE'}
          <div class="text-yellow-300 font-bold text-xl">{gameData[2].toUpperCase()} - {gameData[3]}</div>
        {:else if gameData[2].toUpperCase() === 'FINAL'}
          <div class="text-white font-bold text-xl">FINAL</div>
        {:else}
          <div class="text-gray-300 text-xl">
            {gameData[2].toUpperCase()} - {gameData[3]}
          </div>
        {/if}
      </div>
      
      <div class="game-content flex flex-col md:flex-row justify-between items-center gap-8 py-4">
        <!-- Away Team -->
        <div class="team-block text-center flex-1">
          <img 
            class="w-24 h-24 mx-auto mb-2" 
            src="/images/team-logos/{gameData[0][6]}.svg" 
            alt="{gameData[0][0]} logo"
            on:error={handleImageError}
          >
          <div class="team-seed bg-gray-800 text-white inline-block px-2 py-1 rounded mb-1">
            #{gameData[0][2]}
          </div>
          <div class="team-name text-xl font-semibold mb-1 {isWinner(gameData[0]) ? 'text-white' : isWinner(gameData[1]) ? 'text-gray-400 line-through' : 'text-white'}">
            {gameData[0][4]}
          </div>
          <div class="team-score text-4xl font-bold {isWinner(gameData[0]) ? 'text-yellow-300' : 'text-white'}">
            {gameData[0][1]}
          </div>
          {#if isWinner(gameData[0])}
            <div class="winner-badge mt-2 text-green-400 font-semibold">WINNER</div>
          {/if}
        </div>
        
        <div class="text-xl font-bold text-white">VS</div>
        
        <!-- Home Team -->
        <div class="team-block text-center flex-1">
          <img 
            class="w-24 h-24 mx-auto mb-2" 
            src="/images/team-logos/{gameData[1][6]}.svg" 
            alt="{gameData[1][0]} logo"
            on:error={handleImageError}
          >
          <div class="team-seed bg-gray-800 text-white inline-block px-2 py-1 rounded mb-1">
            #{gameData[1][2]}
          </div>
          <div class="team-name text-xl font-semibold mb-1 {isWinner(gameData[1]) ? 'text-white' : isWinner(gameData[0]) ? 'text-gray-400 line-through' : 'text-white'}">
            {gameData[1][4]}
          </div>
          <div class="team-score text-4xl font-bold {isWinner(gameData[1]) ? 'text-yellow-300' : 'text-white'}">
            {gameData[1][1]}
          </div>
          {#if isWinner(gameData[1])}
            <div class="winner-badge mt-2 text-green-400 font-semibold">WINNER</div>
          {/if}
        </div>
      </div>
      
      <div class="game-details mt-6 pt-4 border-t border-white/10">
        <div class="text-center text-gray-300">
          <p>{gameData[0][5]} vs {gameData[1][5]}</p>
        </div>
      </div>
    </div>
  {/if}
</div> 
</div>