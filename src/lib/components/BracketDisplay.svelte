<script>
  import { getTeamSeed, getTeamName } from '$lib/utils/bracketUtils';
  
  export let selections = Array(63).fill('');
  export let masterBracket = Array(63).fill('');
  export let eliminatedTeams = [];
  export let readOnly = true;
  
  // Function to determine the CSS class for a team based on its status
  function getTeamClass(team, index) {
    if (!team) return '';
    
    let classes = '';
    
    // If the team is eliminated
    if (eliminatedTeams.includes(team)) {
      classes += 'text-red-500 line-through ';
    }
    
    // If the team is correct (matches the master bracket)
    if (masterBracket[index] && team === masterBracket[index]) {
      classes += 'text-green-600 font-bold ';
    }
    
    return classes;
  }
  
  // Function to format team display
  function formatTeam(team) {
    if (!team) return '';
    
    const seed = getTeamSeed(team);
    const name = getTeamName(team);
    
    return `(${seed}) ${name}`;
  }
</script>

<div class="bracket-display">
  <div class="overflow-x-auto">
    <div class="min-w-[1200px] p-4">
      <div class="flex justify-between">
        <!-- Round headers -->
        <div class="bracket-column px-2">
          <h3 class="text-center font-bold mb-2">Round of 64</h3>
        </div>
        <div class="bracket-column px-2">
          <h3 class="text-center font-bold mb-2">Round of 32</h3>
        </div>
        <div class="bracket-column px-2">
          <h3 class="text-center font-bold mb-2">Sweet 16</h3>
        </div>
        <div class="bracket-column px-2">
          <h3 class="text-center font-bold mb-2">Elite Eight</h3>
        </div>
        <div class="bracket-column px-2">
          <h3 class="text-center font-bold mb-2">Final Four</h3>
        </div>
        <div class="bracket-column px-2">
          <h3 class="text-center font-bold mb-2">Championship</h3>
        </div>
        <div class="bracket-column px-2">
          <h3 class="text-center font-bold mb-2">Final Four</h3>
        </div>
      </div>
      
      <div class="flex">
        <!-- First round (left side) -->
        <div class="bracket-column px-2">
          {#each Array(16) as _, i}
            <div class="mb-2 game-pair">
              <div class={`p-2 border ${getTeamClass(selections[i*2], i*2)}`}>
                {formatTeam(selections[i*2])}
              </div>
              <div class={`p-2 border border-t-0 ${getTeamClass(selections[i*2+1], i*2+1)}`}>
                {formatTeam(selections[i*2+1])}
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Second round (left side) -->
        <div class="bracket-column px-2">
          {#each Array(8) as _, i}
            <div class="mb-8 game-pair">
              <div class={`p-2 border ${getTeamClass(selections[32+i], 32+i)}`}>
                {formatTeam(selections[32+i])}
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Sweet 16 (left side) -->
        <div class="bracket-column px-2">
          {#each Array(4) as _, i}
            <div class="mb-20 game-pair">
              <div class={`p-2 border ${getTeamClass(selections[48+i], 48+i)}`}>
                {formatTeam(selections[48+i])}
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Elite 8 (left side) -->
        <div class="bracket-column px-2">
          {#each Array(2) as _, i}
            <div class="mb-48 game-pair">
              <div class={`p-2 border ${getTeamClass(selections[56+i], 56+i)}`}>
                {formatTeam(selections[56+i])}
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Final Four (left side) -->
        <div class="bracket-column px-2">
          <div class="mb-48 game-pair">
            <div class={`p-2 border ${getTeamClass(selections[60], 60)}`}>
              {formatTeam(selections[60])}
            </div>
          </div>
        </div>
        
        <!-- Championship -->
        <div class="bracket-column px-2">
          <div class="mb-48 game-pair">
            <div class={`p-2 border ${getTeamClass(selections[62], 62)}`}>
              {formatTeam(selections[62])}
            </div>
          </div>
        </div>
        
        <!-- Final Four (right side) -->
        <div class="bracket-column px-2">
          <div class="mb-48 game-pair">
            <div class={`p-2 border ${getTeamClass(selections[61], 61)}`}>
              {formatTeam(selections[61])}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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