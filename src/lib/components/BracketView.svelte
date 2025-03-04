<!-- BracketView.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  // Props for different modes and data
  export let mode = 'view'; // 'view' | 'select' | 'live'
  export let bracketData = null; // The bracket data to display/edit
  export let isLocked = false; // Whether the bracket is locked for editing
  export let highlightWinners = true; // Whether to highlight winning teams
  export let showScores = true; // Whether to show scores
  
  // Define regions
  const regions = [
    { id: 1, name: "SOUTH" },
    { id: 2, name: "EAST" },
    { id: 3, name: "MIDWEST" },
    { id: 4, name: "WEST" }
  ];
  
  // Define rounds
  const rounds = [
    { id: 1, name: "1st ROUND", dates: "March 16-17" },
    { id: 2, name: "2nd ROUND", dates: "March 18-19" },
    { id: 3, name: "SWEET 16", dates: "March 23-24" },
    { id: 4, name: "ELITE EIGHT", dates: "March 25-26" },
    { id: 5, name: "FINAL FOUR", dates: "April 1" },
    { id: 6, name: "CHAMPION", dates: "April 3" }
  ];

  // Helper function to generate match IDs
  function getMatchId(round, region, matchNum) {
    if (round === 1) {
      const baseIndex = (region - 1) * 8;
      return baseIndex + matchNum + 1;
    } else if (round === 2) {
      const baseIndex = 32 + (region - 1) * 4;
      return baseIndex + matchNum + 1;
    } else if (round === 3) {
      const baseIndex = 48 + (region - 1) * 2;
      return baseIndex + matchNum + 1;
    } else if (round === 4) {
      return 56 + region;
    } else if (round === 5) {
      return 60 + matchNum + 1;
    } else {
      return 63;
    }
  }
  
  // Generate matches per round and region
  function getMatchesPerRound(round) {
    if (round === 1) return 8;
    if (round === 2) return 4;
    if (round === 3) return 2;
    if (round === 4) return 1;
    if (round === 5) return 2;
    return 1;
  }
  
  // Get top position for match based on round and match index
  function getMatchTopPosition(round, region, matchIndex) {
    // Round 1 positions
    if (round === 1) {
      const baseTop = matchIndex * 50;
      if (region === 2 || region === 4) {
        return baseTop + 550;
      }
      return baseTop;
    }
    
    // Round 2 positions
    if (round === 2) {
      const baseTop = matchIndex * 100;
      if (region === 2 || region === 4) {
        return baseTop + 550;
      }
      return baseTop;
    }
    
    // Round 3 positions
    if (round === 3) {
      const baseTop = matchIndex * 200;
      if (region === 2 || region === 4) {
        return baseTop + 550;
      }
      return baseTop;
    }
    
    // Round 4 positions
    if (round === 4) {
      if (region === 2 || region === 4) {
        return 550;
      }
      return 0;
    }
    
    // Round 5 positions
    if (round === 5) {
      return 425;
    }
    
    // Round 6 positions
    return 425;
  }

  // Helper to determine if a team won
  function isWinner(teamA, teamB) {
    if (!showScores) return false;
    return teamA?.score > teamB?.score;
  }

  // Handle team selection in selection mode
  function handleTeamClick(matchId, teamIndex, team) {
    if (mode !== 'select' || isLocked) return;
    
    dispatch('teamSelect', {
      matchId,
      teamIndex,
      team
    });
  }

  // Get team display class based on mode and state
  function getTeamClass(team, isWinningTeam, isSelected) {
    const classes = [];
    
    if (mode === 'select' && !isLocked) {
      classes.push('cursor-pointer hover:border-amber-500/80');
    }
    
    if (isSelected) {
      classes.push('bg-amber-800/90 font-medium');
    } else if (highlightWinners && isWinningTeam) {
      classes.push('bg-amber-800/90 font-medium');
    } else {
      classes.push('bg-zinc-800/80');
    }
    
    if (!isSelected && mode === 'live') {
      classes.push('line-through');
    }
    
    return classes.join(' ');
  }
</script>

<!-- Bracket -->
<div class="bg-gradient-to-b from-neutral-900/95 to-neutral-950/95 text-center w-full max-w-[1140px] mx-auto mt-[30px] pl-0 rounded-lg shadow-2xl p-4 overflow-x-auto">
  <div class="flex justify-center w-full">
    <!-- Table Dates -->
    <table class="text-xs border-collapse mx-auto w-[950px] rounded-lg overflow-hidden shadow-lg">
      <tbody>
        <tr>
          {#each [...rounds, ...rounds.slice().reverse().slice(1)] as round, i}
            <th class="text-white bg-gradient-to-r from-amber-600/90 to-amber-700/90 p-3 whitespace-nowrap text-center w-[86px] font-semibold">
              {round.name}
            </th>
          {/each}
        </tr>
        <tr>
          {#each [...rounds, ...rounds.slice().reverse().slice(1)] as round}
            <td class="text-xs p-[9px] bg-zinc-100 text-zinc-800 text-center whitespace-nowrap font-medium">
              {round.dates}
            </td>
          {/each}
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="mt-[15px] h-[1000px] relative mx-auto max-w-[950px] left-0 right-0" id="bracket">
    <!-- Connecting Lines -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Round 1 to 2 connectors -->
      {#each regions as region}
        {#each Array(getMatchesPerRound(2)) as _, matchIndex}
          <div class={`absolute border-r-2 border-t-2 border-b-2 border-amber-700/30 rounded-r-md
                      ${region.id === 1 || region.id === 2 ? 'left-[115px]' : 'right-[115px] transform rotate-180'}`}
               style="top: {getMatchTopPosition(2, region.id, matchIndex) + 5}px; 
                      height: 80px; width: 15px;"></div>
        {/each}
      {/each}
      
      <!-- Round 2 to 3 connectors -->
      {#each regions as region}
        {#each Array(getMatchesPerRound(3)) as _, matchIndex}
          <div class={`absolute border-r-2 border-t-2 border-b-2 border-amber-700/30 rounded-r-md
                      ${region.id === 1 || region.id === 2 ? 'left-[230px]' : 'right-[230px] transform rotate-180'}`}
               style="top: {getMatchTopPosition(3, region.id, matchIndex)+30}px; 
                      height: 130px; width: 15px;"></div>
        {/each}
      {/each}
      
      <!-- Round 3 to 4 connectors -->
      {#each regions as region}
        <div class={`absolute border-r-2 border-t-2 border-b-2 border-amber-700/30 rounded-r-md
                    ${region.id === 1 || region.id === 2 ? 'left-[345px]' : 'right-[345px] transform rotate-180'}`}
             style="top: {getMatchTopPosition(4, region.id, 0) + 55}px; 
                    height: 280px; width: 15px;"></div>
      {/each}
    </div>
    
    <!-- Render each round -->
    {#each rounds as round}
      <div class="absolute top-0" style={`
        ${round.id === 1 ? 'width: 950px' : ''}
        ${round.id === 2 ? 'left: 115px; width: 720px' : ''}
        ${round.id === 3 ? 'left: 230px; width: 490px' : ''}
        ${round.id === 4 ? 'left: 345px; width: 260px' : ''}
        ${round.id === 5 ? 'left: 280px; width: 380px' : ''}
        ${round.id === 6 ? 'left: 395px; width: 150px' : ''}
      `}>
        {#each regions as region}
          <div class="region{region.id}">
            <!-- Region headers for first round -->
            {#if round.id === 1}
              <h4 class={`uppercase text-amber-300/90 pt-[15px] font-bold ${region.id === 1 || region.id === 2 ? 
                          'absolute left-[170px] block w-[150px]' : 
                          'absolute right-[170px] block text-right w-[150px]'} 
                          ${region.id === 2 || region.id === 4 ? 'top-[715px]' : 'top-[165px]'}`}>
                {region.name}
              </h4>
            {/if}

            <!-- Render matches for this round/region -->
            {#each Array(getMatchesPerRound(round.id)) as _, matchIndex}
              {#if bracketData?.matches?.[getMatchId(round.id, region.id, matchIndex)]}
                {@const match = bracketData.matches[getMatchId(round.id, region.id, matchIndex)]}
                {@const matchId = getMatchId(round.id, region.id, matchIndex)}
                
                <!-- Special styling for championship game -->
                {#if round.id === 6}
                  <div class="absolute text-white p-0 w-[150px] text-xs left-0 right-0 mx-auto top-[445px]">
                    <div class="border border-zinc-700 rounded-sm overflow-hidden">
                      <div class={`h-[25px] px-[6px] whitespace-nowrap flex items-center transition-colors duration-200 border-b border-zinc-700
                                ${getTeamClass(match.teamA, isWinner(match.teamA, match.teamB), match.winner === 'A')}`}
                           on:click={() => handleTeamClick(matchId, 'A', match.teamA)}>
                        <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">
                          {match.teamA?.seed || '-'}
                        </span>
                        <span class="truncate">{match.teamA?.name || 'TBD'}</span>
                        {#if showScores && match.teamA?.score !== undefined}
                          <span class="ml-auto text-gray-200">{match.teamA.score}</span>
                        {/if}
                      </div>
                      <div class={`h-[25px] px-[6px] whitespace-nowrap flex items-center transition-colors duration-200
                                ${getTeamClass(match.teamB, isWinner(match.teamB, match.teamA), match.winner === 'B')}`}
                           on:click={() => handleTeamClick(matchId, 'B', match.teamB)}>
                        <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">
                          {match.teamB?.seed || '-'}
                        </span>
                        <span class="truncate">{match.teamB?.name || 'TBD'}</span>
                        {#if showScores && match.teamB?.score !== undefined}
                          <span class="ml-auto text-gray-200">{match.teamB.score}</span>
                        {/if}
                      </div>
                    </div>
                  </div>
                {:else}
                  <div class={`absolute text-white border border-zinc-700 p-0 w-[115px] text-xs 
                              ${mode === 'select' && !isLocked ? 'cursor-pointer' : ''} 
                              ${round.id >= 3 ? 'h-[90px] justify-between' : 'h-[40px]'}
                              flex flex-col rounded-sm transition-all duration-200
                              ${round.id >= 5 ? 'top-[425px]' : ''}
                              ${round.id === 2 ? 'mt-[24px]' : ''}
                              ${round.id === 3 ? 'mt-[50px]' : ''}
                              ${round.id === 4 ? 'mt-[100px]' : ''}
                              ${round.id < 5 ? (region.id === 1 || region.id === 2 ? 'border-l-0' : 'border-r-0') : 
                               (matchIndex === 0 ? 'border-l-0' : 'border-r-0')}`}
                       style={`top: ${getMatchTopPosition(round.id, region.id, matchIndex)}px; 
                              ${round.id < 5 ? (region.id === 1 || region.id === 2 ? 'left: 0;' : 'right: 0;') : 
                              (matchIndex === 0 ? 'left: 0;' : 'right: 0;')}`}>
                    
                    <!-- Team A -->
                    <div class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-tr-sm
                                ${getTeamClass(match.teamA, isWinner(match.teamA, match.teamB), match.winner === 'A')}`}
                         on:click={() => handleTeamClick(matchId, 'A', match.teamA)}>
                      <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">
                        {match.teamA?.seed || '-'}
                      </span>
                      <span class="truncate">{match.teamA?.name || 'TBD'}</span>
                      {#if showScores && match.teamA?.score !== undefined}
                        <span class="ml-auto mr-1 text-gray-200">{match.teamA.score}</span>
                      {/if}
                    </div>
                    
                    <!-- Team B -->
                    <div class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200
                                ${getTeamClass(match.teamB, isWinner(match.teamB, match.teamA), match.winner === 'B')}`}
                         on:click={() => handleTeamClick(matchId, 'B', match.teamB)}>
                      <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">
                        {match.teamB?.seed || '-'}
                      </span>
                      <span class="truncate">{match.teamB?.name || 'TBD'}</span>
                      {#if showScores && match.teamB?.score !== undefined}
                        <span class="ml-auto mr-1 text-gray-200">{match.teamB.score}</span>
                      {/if}
                    </div>
                  </div>
                {/if}
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    {/each}

    <!-- Champion Trophy (only show in live mode or when there's a winner) -->
    {#if mode === 'live' || bracketData?.champion}
      <div class="absolute left-0 right-0 mx-auto top-[310px] w-[150px]">
        <div class="text-white text-center bg-amber-700/90 py-3 px-4 rounded-md font-semibold shadow-md">
          <div class="text-xs uppercase tracking-wider mb-1">Champion</div>
          <div class="flex items-center justify-center">
            {#if bracketData?.champion}
              <span class="inline-block w-[20px] h-[20px] text-center bg-amber-800/90 mr-1 text-[11px] font-bold rounded-full flex items-center justify-center">
                {bracketData.champion.seed}
              </span>
              <span>{bracketData.champion.name}</span>
            {:else}
              <span>TBD</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
</style> 