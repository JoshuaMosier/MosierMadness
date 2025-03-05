<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  let gameData = null;
  let loading = true;
  let error = null;
  
  onMount(async () => {
    try {
      const gameId = $page.params.id;
      const response = await fetch('/api/scores');
      
      if (!response.ok) {
        throw new Error(`Error fetching scores: ${response.statusText}`);
      }
      
      const matches = await response.json();
      
      if (matches && matches.length > gameId) {
        gameData = matches[gameId];
        loading = false;
      } else {
        throw new Error('Game not found');
      }
    } catch (err) {
      console.error('Failed to fetch game data:', err);
      error = err.message;
      loading = false;
    }
  });
  
  // Helper function to determine if a team is a winner
  function isWinner(team) {
    return team[3] === true;
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-4">
    <a href="/" class="text-blue-400 hover:text-blue-300 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
      </svg>
      Back to Scores
    </a>
  </div>

  {#if loading}
    <div class="w-full py-12 text-center">
      <div class="inline-block animate-pulse text-white">
        Loading game details...
      </div>
    </div>
  {:else if error}
    <div class="w-full py-12 text-center text-red-500">
      {error}
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
            src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{gameData[0][6]}.svg" 
            alt="{gameData[0][0]} logo"
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
            src="https://i.turner.ncaa.com/sites/default/files/images/logos/schools/bgl/{gameData[1][6]}.svg" 
            alt="{gameData[1][0]} logo"
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