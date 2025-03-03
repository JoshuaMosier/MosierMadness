<script>
  import { onMount } from 'svelte';
  import { getGameScores } from '$lib/services/ncaa-api';
  
  let games = [];
  let isLoading = true;
  let error = null;
  
  onMount(async () => {
    try {
      games = await getGameScores();
      isLoading = false;
      
      // Set up polling for live score updates
      const interval = setInterval(async () => {
        try {
          games = await getGameScores();
        } catch (err) {
          console.error('Error updating scores:', err);
        }
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    } catch (err) {
      error = err.message;
      isLoading = false;
    }
  });
</script>

<div class="bg-gray-100 py-2 overflow-hidden border-b border-gray-200">
  {#if isLoading}
    <div class="container mx-auto px-4">
      <div class="flex justify-center">
        <p class="text-mm-gray">Loading scores...</p>
      </div>
    </div>
  {:else if error}
    <div class="container mx-auto px-4">
      <div class="flex justify-center">
        <p class="text-red-500">Error loading scores: {error}</p>
      </div>
    </div>
  {:else if games.length === 0}
    <div class="container mx-auto px-4">
      <div class="flex justify-center">
        <p class="text-mm-gray">No games scheduled for today</p>
      </div>
    </div>
  {:else}
    <div class="container mx-auto px-4">
      <div class="flex overflow-x-auto pb-2 scrollbar-hide">
        {#each games as game}
          <div class="game-card">
            <div class="team away">
              <span class="seed">{game[0][2]}</span>
              <span class="name">{game[0][4]}</span>
              <span class="score">{game[0][1]}</span>
            </div>
            <div class="team home">
              <span class="seed">{game[1][2]}</span>
              <span class="name">{game[1][4]}</span>
              <span class="score">{game[1][1]}</span>
            </div>
            <div class="game-status">
              {#if game[2] === 'live'}
                <span class="live">{game[3]}</span>
              {:else if game[2] === 'final'}
                <span class="final">Final</span>
              {:else}
                <span class="upcoming">{game[3]}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
</style> 