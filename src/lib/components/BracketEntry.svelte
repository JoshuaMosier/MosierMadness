<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  import { saveBracket } from '$lib/services/bracket';
  import { getBracketTeams } from '$lib/services/ncaa-api';
  import { propagateSelection, getNextGameIndex, getNextGamePosition } from '$lib/utils/bracketUtils';
  
  export let initialSelections = Array(63).fill('');
  
  let teams = [];
  let selections = [...initialSelections];
  let isSubmitting = false;
  let message = '';
  let messageType = 'info'; // 'info', 'success', 'error'
  let isLoading = true;
  
  // Define regions
  const regions = [
    { name: "South", startIndex: 0 },
    { name: "East", startIndex: 16 },
    { name: "Midwest", startIndex: 32 },
    { name: "West", startIndex: 48 }
  ];
  
  onMount(async () => {
    try {
      teams = await getBracketTeams();
      isLoading = false;
    } catch (error) {
      console.error('Error loading bracket teams:', error);
      message = 'Error loading bracket teams. Please try again later.';
      messageType = 'error';
      isLoading = false;
    }
  });
  
  function selectTeam(gameIndex, team) {
    // Update the selections array with the propagated selection
    selections = propagateSelection(selections, gameIndex, team);
  }
  
  async function submitBracket() {
    if (!$user) {
      message = 'Please log in to submit your bracket';
      messageType = 'error';
      return;
    }
    
    // Check if all games have a selection
    const hasEmptySelections = selections.some(selection => !selection);
    if (hasEmptySelections) {
      message = 'Please complete your bracket before submitting';
      messageType = 'error';
      return;
    }
    
    isSubmitting = true;
    message = 'Submitting bracket...';
    messageType = 'info';
    
    try {
      const { error } = await saveBracket($user.id, selections);
      
      if (error) {
        message = `Error: ${error.message}`;
        messageType = 'error';
      } else {
        message = 'Bracket submitted successfully!';
        messageType = 'success';
      }
    } catch (error) {
      message = `Error: ${error.message}`;
      messageType = 'error';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="bracket-entry">
  {#if isLoading}
    <div class="flex justify-center py-8">
      <div class="animate-pulse flex space-x-4">
        <div class="flex-1 space-y-4 py-1">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-4">Fill Out Your Bracket</h2>
      
      {#if message}
        <div class={`p-4 mb-4 rounded ${
          messageType === 'success' ? 'bg-green-100 text-green-700 border border-green-400' :
          messageType === 'error' ? 'bg-red-100 text-red-700 border border-red-400' :
          'bg-blue-100 text-blue-700 border border-blue-400'
        }`}>
          {message}
        </div>
      {/if}
      
      <button 
        class="btn-primary mb-6"
        on:click={submitBracket} 
        disabled={isSubmitting || !$user}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Bracket'}
      </button>
      
      <div class="overflow-x-auto">
        <div class="min-w-[1200px] p-4">
          <div class="flex justify-between">
            <!-- Round headers -->
            <div class="bracket-column px-2">
              <h3 class="text-center font-bold mb-2">Round of 64</h3>
              <p class="text-center text-sm text-gray-500">March 21-22</p>
            </div>
            <div class="bracket-column px-2">
              <h3 class="text-center font-bold mb-2">Round of 32</h3>
              <p class="text-center text-sm text-gray-500">March 23-24</p>
            </div>
            <div class="bracket-column px-2">
              <h3 class="text-center font-bold mb-2">Sweet 16</h3>
              <p class="text-center text-sm text-gray-500">March 28-29</p>
            </div>
            <div class="bracket-column px-2">
              <h3 class="text-center font-bold mb-2">Elite Eight</h3>
              <p class="text-center text-sm text-gray-500">March 30-31</p>
            </div>
            <div class="bracket-column px-2">
              <h3 class="text-center font-bold mb-2">Final Four</h3>
              <p class="text-center text-sm text-gray-500">April 6</p>
            </div>
            <div class="bracket-column px-2">
              <h3 class="text-center font-bold mb-2">Championship</h3>
              <p class="text-center text-sm text-gray-500">April 8</p>
            </div>
            <div class="bracket-column px-2">
              <h3 class="text-center font-bold mb-2">Final Four</h3>
              <p class="text-center text-sm text-gray-500">April 6</p>
            </div>
          </div>
          
          <!-- Render each region -->
          {#each regions as region, regionIndex}
            <div class="mt-8 mb-12">
              <h3 class="text-xl font-bold mb-4 text-mm-blue">{region.name} Region</h3>
              <div class="flex">
                <!-- First round (Round of 64) -->
                <div class="bracket-column px-2">
                  {#each Array(8) as _, i}
                    {@const teamIndex1 = region.startIndex + i * 2}
                    {@const teamIndex2 = region.startIndex + i * 2 + 1}
                    <div class="mb-2 game-pair">
                      <button 
                        type="button"
                        class={`w-full text-left p-2 border cursor-pointer hover:bg-blue-50 ${selections[teamIndex1] === teams[teamIndex1] ? 'bg-blue-100 font-bold' : ''}`}
                        on:click={() => selectTeam(teamIndex1, teams[teamIndex1])}
                        on:keydown={(e) => e.key === 'Enter' && selectTeam(teamIndex1, teams[teamIndex1])}
                      >
                        {teams[teamIndex1] || `Team ${teamIndex1 + 1}`}
                      </button>
                      <button 
                        type="button"
                        class={`w-full text-left p-2 border border-t-0 cursor-pointer hover:bg-blue-50 ${selections[teamIndex2] === teams[teamIndex2] ? 'bg-blue-100 font-bold' : ''}`}
                        on:click={() => selectTeam(teamIndex2, teams[teamIndex2])}
                        on:keydown={(e) => e.key === 'Enter' && selectTeam(teamIndex2, teams[teamIndex2])}
                      >
                        {teams[teamIndex2] || `Team ${teamIndex2 + 1}`}
                      </button>
                    </div>
                  {/each}
                </div>
                
                <!-- Second round (Round of 32) -->
                <div class="bracket-column px-2">
                  {#each Array(4) as _, i}
                    {@const gameIndex = 32 + regionIndex * 4 + i}
                    <div class="mb-8 game-pair">
                      <button 
                        type="button"
                        class={`w-full text-left p-2 border cursor-pointer hover:bg-blue-50 ${selections[gameIndex] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                        on:click={() => selections[gameIndex] && selectTeam(gameIndex, selections[gameIndex])}
                        on:keydown={(e) => e.key === 'Enter' && selections[gameIndex] && selectTeam(gameIndex, selections[gameIndex])}
                      >
                        {selections[gameIndex] || 'Winner'}
                      </button>
                    </div>
                  {/each}
                </div>
                
                <!-- Sweet 16 -->
                <div class="bracket-column px-2">
                  {#each Array(2) as _, i}
                    {@const gameIndex = 48 + regionIndex * 2 + i}
                    <div class="mb-20 game-pair">
                      <button 
                        type="button"
                        class={`w-full text-left p-2 border cursor-pointer hover:bg-blue-50 ${selections[gameIndex] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                        on:click={() => selections[gameIndex] && selectTeam(gameIndex, selections[gameIndex])}
                        on:keydown={(e) => e.key === 'Enter' && selections[gameIndex] && selectTeam(gameIndex, selections[gameIndex])}
                      >
                        {selections[gameIndex] || 'Winner'}
                      </button>
                    </div>
                  {/each}
                </div>
                
                <!-- Elite 8 -->
                <div class="bracket-column px-2">
                  <div class="mb-48 game-pair">
                    {#if true}
                      {@const gameIndex = 56 + regionIndex}
                      <button 
                        type="button"
                        class={`w-full text-left p-2 border cursor-pointer hover:bg-blue-50 ${selections[gameIndex] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                        on:click={() => selections[gameIndex] && selectTeam(gameIndex, selections[gameIndex])}
                        on:keydown={(e) => e.key === 'Enter' && selections[gameIndex] && selectTeam(gameIndex, selections[gameIndex])}
                      >
                        {selections[gameIndex] || `${region.name} Champion`}
                      </button>
                    {/if}
                  </div>
                </div>
                
                <!-- Only show Final Four and Championship in the first region -->
                {#if regionIndex === 0}
                  <!-- Final Four (left side) -->
                  <div class="bracket-column px-2">
                    <div class="mb-48 game-pair">
                      <button 
                        type="button"
                        class={`w-full text-left p-2 border cursor-pointer hover:bg-blue-50 ${selections[60] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                        on:click={() => selections[60] && selectTeam(60, selections[60])}
                        on:keydown={(e) => e.key === 'Enter' && selections[60] && selectTeam(60, selections[60])}
                      >
                        {selections[60] || 'Final Four Winner'}
                      </button>
                    </div>
                  </div>
                  
                  <!-- Championship -->
                  <div class="bracket-column px-2">
                    <div class="mb-48 game-pair">
                      <button 
                        type="button"
                        class={`w-full text-left p-2 border cursor-pointer hover:bg-blue-50 ${selections[62] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                        on:click={() => selections[62] && selectTeam(62, selections[62])}
                        on:keydown={(e) => e.key === 'Enter' && selections[62] && selectTeam(62, selections[62])}
                      >
                        {selections[62] || 'National Champion'}
                      </button>
                    </div>
                  </div>
                  
                  <!-- Final Four (right side) -->
                  <div class="bracket-column px-2">
                    <div class="mb-48 game-pair">
                      <button 
                        type="button"
                        class={`w-full text-left p-2 border cursor-pointer hover:bg-blue-50 ${selections[61] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                        on:click={() => selections[61] && selectTeam(61, selections[61])}
                        on:keydown={(e) => e.key === 'Enter' && selections[61] && selectTeam(61, selections[61])}
                      >
                        {selections[61] || 'Final Four Winner'}
                      </button>
                    </div>
                  </div>
                {:else}
                  <!-- Empty columns for other regions to maintain layout -->
                  <div class="bracket-column px-2"></div>
                  <div class="bracket-column px-2"></div>
                  <div class="bracket-column px-2"></div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .bracket-column {
    width: 14.285%;
  }
  
  .game-pair {
    position: relative;
  }
  
  .game-pair::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    width: 10px;
    height: 1px;
    background-color: #ccc;
  }
  
  /* Add connecting lines between rounds */
  .bracket-column:not(:last-child) .game-pair::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -10px;
    width: 20px;
    height: 1px;
    background-color: #ccc;
  }
  
  /* Style for buttons */
  button {
    transition: all 0.2s ease;
  }
  
  button:hover {
    transform: translateX(2px);
  }
  
  button:active {
    transform: translateX(0);
  }
</style> 