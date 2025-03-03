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
          
          <!-- South Region (First Quadrant) -->
          <div class="mt-8 mb-12">
            <h3 class="text-xl font-bold mb-4 text-mm-blue">South Region</h3>
            <div class="flex">
              <!-- First round -->
              <div class="bracket-column px-2">
                {#each Array(8) as _, i}
                  <div class="mb-2 game-pair">
                    <button 
                      type="button"
                      class={`w-full text-left p-2 border cursor-pointer hover:bg-blue-50 ${selections[i*2] === teams[i*2] ? 'bg-blue-100 font-bold' : ''}`}
                      on:click={() => selectTeam(i*2, teams[i*2])}
                      on:keydown={(e) => e.key === 'Enter' && selectTeam(i*2, teams[i*2])}
                    >
                      {teams[i*2]}
                    </button>
                    <button 
                      type="button"
                      class={`w-full text-left p-2 border border-t-0 cursor-pointer hover:bg-blue-50 ${selections[i*2+1] === teams[i*2+1] ? 'bg-blue-100 font-bold' : ''}`}
                      on:click={() => selectTeam(i*2+1, teams[i*2+1])}
                      on:keydown={(e) => e.key === 'Enter' && selectTeam(i*2+1, teams[i*2+1])}
                    >
                      {teams[i*2+1]}
                    </button>
                  </div>
                {/each}
              </div>
              
              <!-- Second round -->
              <div class="bracket-column px-2">
                {#each Array(4) as _, i}
                  <div class="mb-8 game-pair">
                    <div 
                      class={`p-2 border cursor-pointer hover:bg-blue-50 ${selections[32+i] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                    >
                      {selections[32+i] || 'Winner'}
                    </div>
                  </div>
                {/each}
              </div>
              
              <!-- Sweet 16 -->
              <div class="bracket-column px-2">
                {#each Array(2) as _, i}
                  <div class="mb-20 game-pair">
                    <div 
                      class={`p-2 border cursor-pointer hover:bg-blue-50 ${selections[48+i] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                    >
                      {selections[48+i] || 'Winner'}
                    </div>
                  </div>
                {/each}
              </div>
              
              <!-- Elite 8 -->
              <div class="bracket-column px-2">
                <div class="mb-48 game-pair">
                  <div 
                    class={`p-2 border cursor-pointer hover:bg-blue-50 ${selections[56] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                  >
                    {selections[56] || 'South Champion'}
                  </div>
                </div>
              </div>
              
              <!-- Final Four and Championship will be in the center -->
              <div class="bracket-column px-2">
                <div class="mb-48 game-pair">
                  <div 
                    class={`p-2 border cursor-pointer hover:bg-blue-50 ${selections[60] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                  >
                    {selections[60] || 'Final Four Winner'}
                  </div>
                </div>
              </div>
              
              <!-- Championship -->
              <div class="bracket-column px-2">
                <div class="mb-48 game-pair">
                  <div 
                    class={`p-2 border cursor-pointer hover:bg-blue-50 ${selections[62] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                  >
                    {selections[62] || 'National Champion'}
                  </div>
                </div>
              </div>
              
              <!-- Final Four (right side) -->
              <div class="bracket-column px-2">
                <div class="mb-48 game-pair">
                  <div 
                    class={`p-2 border cursor-pointer hover:bg-blue-50 ${selections[61] ? 'bg-blue-100 font-bold' : 'bg-gray-50'}`}
                  >
                    {selections[61] || 'Final Four Winner'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Add other regions similarly -->
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
</style> 