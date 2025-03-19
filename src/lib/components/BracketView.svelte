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
    { id: 1, name: "1st ROUND", dates: "March 20-21" },
    { id: 2, name: "2nd ROUND", dates: "March 22-23" },
    { id: 3, name: "SWEET 16", dates: "March 27-28" },
    { id: 4, name: "ELITE EIGHT", dates: "March 29-30" },
    { id: 5, name: "FINAL FOUR", dates: "April 5" },
    { id: 6, name: "CHAMPION", dates: "April 7" }
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
      return 415;
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
    
    if (isSelected) {
      classes.push('bg-amber-800/90 font-medium cursor-pointer');
    } else if (highlightWinners && isWinningTeam) {
      if (team?.color) {
        classes.push(`font-medium`);
        // We'll apply the color directly in the style attribute
      } else {
        classes.push('bg-amber-800/90 font-medium');
      }
    } else if (!team?.name || team?.name === '') {
      // Make unfilled games more distinct with a dashed border and lighter background
      classes.push('bg-stone-900 border border-dashed border-amber-300/50');
    } else {
      if (team?.color) {
        classes.push('');
        // We'll apply the color directly in the style attribute
      } else {
        classes.push('bg-zinc-800/80');
      }
    }
    
    // if (!isSelected && mode === 'live') {
    //   classes.push('line-through');
    // }
    
    return classes.join(' ');
  }

  // Helper function to get team background style
  function getTeamStyle(team) {
    if (team?.color) {
      const opacity = 0.8;
      // Convert hex to RGB for primary color
      const hex = team.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      return `background: linear-gradient(to right, 
        rgba(${r}, ${g}, ${b}, ${opacity}) 0%,
        rgba(${r}, ${g}, ${b}, ${0.6}) 100%
      )`;

    }
    return '';
  }
</script>

<!-- Bracket -->
<div class="bg-gradient-to-b from-neutral-950/30 to-neutral-950/95 text-center w-full max-w-[1140px] mx-auto pl-0 rounded-lg shadow-2xl p-4 overflow-x-auto">
  <div class="flex justify-center w-full min-w-[950px]">
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
  
  <div class="mt-[15px] h-[1000px] relative mx-auto min-w-[950px] w-[950px]" id="bracket">
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
    
    <!-- Champion Trophy (only show in live mode or when there's a winner) -->
    <div class="absolute left-[402.5px] top-[330px] w-[145px]">
      <div class="text-white text-center">
        <div class="text-[11px] uppercase tracking-wider mb-2 text-amber-300/90 font-bold">Champion</div>
        <div class="rounded-sm overflow-hidden">
          {#if bracketData?.champion}
            <div class="h-[25px] px-[6px] whitespace-nowrap flex items-center justify-center rounded-lg" style={getTeamStyle(bracketData.champion)}>
              <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                {bracketData.champion.seed}
              </span>
              <span class="truncate font-medium">{bracketData.champion.name}</span>
            </div>
          {:else}
            <div class="h-[25px] px-[6px] whitespace-nowrap flex items-center justify-center bg-stone-900 border border-dashed border-amber-300/50">
              <span class="inline-block w-[16px] text-center mr-1 text-[10px] font-bold">-</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Render each round -->
    {#each rounds as round}
      <div class="absolute top-0" style={`
        ${round.id === 1 ? 'width: 950px' : ''}
        ${round.id === 2 ? 'left: 115px; width: 720px' : ''}
        ${round.id === 3 ? 'left: 230px; width: 490px' : ''}
        ${round.id === 4 ? 'left: 345px; width: 260px' : ''}
        ${round.id === 5 ? 'left: 285px; width: 380px' : ''}
        ${round.id === 6 ? 'left: 400px; width: 150px' : ''}
      `}>
        {#if round.id < 5}
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
                      <div class="border border-zinc-700/40 rounded-sm overflow-hidden">
                        <div class={`h-[25px] px-[6px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-sm
                                  ${getTeamClass(match.teamA, isWinner(match.teamA, match.teamB), match.winner === 'A')}`}
                             style={getTeamStyle(match.teamA)}
                             on:click={() => handleTeamClick(matchId, 'A', match.teamA)}
                             on:keydown={(e) => e.key === 'Enter' && handleTeamClick(matchId, 'A', match.teamA)}
                             role="button"
                             tabindex="0">
                          <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                            {match.teamA?.seed || '-'}
                          </span>
                          <span class="truncate">{match.teamA?.name || ''}</span>
                          {#if showScores && match.teamA?.score !== undefined}
                            <span class="ml-auto text-gray-200">{match.teamA.score}</span>
                          {/if}
                        </div>
                        <div class={`h-[25px] px-[6px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-sm
                                  ${getTeamClass(match.teamB, isWinner(match.teamB, match.teamA), match.winner === 'B')}`}
                             style={getTeamStyle(match.teamB)}
                             on:click={() => handleTeamClick(matchId, 'B', match.teamB)}
                             on:keydown={(e) => e.key === 'Enter' && handleTeamClick(matchId, 'B', match.teamB)}
                             role="button"
                             tabindex="0">
                          <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                            {match.teamB?.seed || '-'}
                          </span>
                          <span class="truncate">{match.teamB?.name || ''}</span>
                          {#if showScores && match.teamB?.score !== undefined}
                            <span class="ml-auto text-gray-200">{match.teamB.score}</span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {:else}
                    <div class={`absolute text-white border border-zinc-700/40 p-0 w-[115px] text-xs 
                                ${mode === 'select' && !isLocked ? 'cursor-pointer' : ''} 
                                ${round.id === 3 ? 'h-[90px]' : 
                                  round.id === 4 ? 'h-[220px]' : 
                                  round.id === 5 ? 'h-[115px]' : 
                                  'h-[40px]'} justify-between
                                flex flex-col rounded-sm transition-all duration-200
                                ${round.id === 2 ? 'mt-[24px]' : ''}
                                ${round.id === 3 ? 'mt-[50px]' : ''}
                                ${round.id === 4 ? 'mt-[85px]' : ''}
                                ${round.id < 5 ? (region.id === 1 || region.id === 2 ? 'border-l-0' : 'border-r-0') : 
                                 (matchIndex === 0 ? 'border-l-0' : 'border-r-0')}`}
                         style={`top: ${getMatchTopPosition(round.id, region.id, matchIndex)}px; 
                                ${round.id < 5 ? (region.id === 1 || region.id === 2 ? 'left: 0;' : 'right: 0;') : 
                                (matchIndex === 0 ? 'left: 0;' : 'right: 0;')}`}>
                      
                      <!-- Team A -->
                      <div class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-sm
                                  ${getTeamClass(match.teamA, isWinner(match.teamA, match.teamB), match.winner === 'A')}`}
                               style={getTeamStyle(match.teamA)}
                               on:click={() => handleTeamClick(matchId, 'A', match.teamA)}
                               on:keydown={(e) => e.key === 'Enter' && handleTeamClick(matchId, 'A', match.teamA)}
                               role="button"
                               tabindex="0">
                        <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                          {match.teamA?.seed || '-'}
                        </span>
                        <span class="truncate">{match.teamA?.name || ''}</span>
                        {#if showScores && match.teamA?.score !== undefined}
                          <span class="ml-auto mr-1 text-gray-200">{match.teamA.score}</span>
                        {/if}
                      </div>
                      
                      <!-- Team B -->
                      <div class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-sm
                                  ${getTeamClass(match.teamB, isWinner(match.teamB, match.teamA), match.winner === 'B')}`}
                               style={getTeamStyle(match.teamB)}
                               on:click={() => handleTeamClick(matchId, 'B', match.teamB)}
                               on:keydown={(e) => e.key === 'Enter' && handleTeamClick(matchId, 'B', match.teamB)}
                               role="button"
                               tabindex="0">
                        <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                          {match.teamB?.seed || '-'}
                        </span>
                        <span class="truncate">{match.teamB?.name || ''}</span>
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
        {:else}
          <!-- Render rounds 5-6 only once, outside the regions loop -->
          {#each Array(getMatchesPerRound(round.id)) as _, matchIndex}
            {#if bracketData?.matches?.[getMatchId(round.id, 1, matchIndex)]}
              {@const match = bracketData.matches[getMatchId(round.id, 1, matchIndex)]}
              {@const matchId = getMatchId(round.id, 1, matchIndex)}
              
              <!-- Special styling for championship game -->
              {#if round.id === 6}
                <div class="absolute text-white p-0 w-[150px] text-xs left-0 right-0 mx-auto top-[445px]">
                  <div class="border border-zinc-700/40 rounded-sm overflow-hidden">
                    <div class={`h-[25px] px-[6px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-sm
                              ${getTeamClass(match.teamA, isWinner(match.teamA, match.teamB), match.winner === 'A')}`}
                         style={getTeamStyle(match.teamA)}
                         on:click={() => handleTeamClick(matchId, 'A', match.teamA)}
                         on:keydown={(e) => e.key === 'Enter' && handleTeamClick(matchId, 'A', match.teamA)}
                         role="button"
                         tabindex="0">
                      <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                        {match.teamA?.seed || '-'}
                      </span>
                      <span class="truncate">{match.teamA?.name || ''}</span>
                      {#if showScores && match.teamA?.score !== undefined}
                        <span class="ml-auto text-gray-200">{match.teamA.score}</span>
                      {/if}
                    </div>
                    <div class={`h-[25px] px-[6px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-sm
                              ${getTeamClass(match.teamB, isWinner(match.teamB, match.teamA), match.winner === 'B')}`}
                         style={getTeamStyle(match.teamB)}
                         on:click={() => handleTeamClick(matchId, 'B', match.teamB)}
                         on:keydown={(e) => e.key === 'Enter' && handleTeamClick(matchId, 'B', match.teamB)}
                         role="button"
                         tabindex="0">
                      <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                        {match.teamB?.seed || '-'}
                      </span>
                      <span class="truncate">{match.teamB?.name || ''}</span>
                      {#if showScores && match.teamB?.score !== undefined}
                        <span class="ml-auto text-gray-200">{match.teamB.score}</span>
                      {/if}
                    </div>
                  </div>
                </div>
              {:else}
                <div class={`absolute text-white border border-zinc-700/40 p-0 w-[115px] text-xs 
                            ${mode === 'select' && !isLocked ? 'cursor-pointer' : ''} 
                            ${round.id === 3 ? 'h-[90px]' : 
                              round.id === 4 ? 'h-[220px]' : 
                              round.id === 5 ? 'h-[115px]' : 
                              'h-[40px]'} justify-between
                            flex flex-col rounded-sm transition-all duration-200
                            ${round.id === 2 ? 'mt-[24px]' : ''}
                            ${round.id === 3 ? 'mt-[50px]' : ''}
                            ${round.id === 4 ? 'mt-[85px]' : ''}
                            ${round.id < 5 ? (region.id === 1 || region.id === 2 ? 'border-l-0' : 'border-r-0') : 
                             (matchIndex === 0 ? 'border-l-0' : 'border-r-0')}`}
                     style={`top: ${getMatchTopPosition(round.id, 1, matchIndex)}px; 
                            ${round.id < 5 ? (region.id === 1 || region.id === 2 ? 'left: 0;' : 'right: 0;') : 
                            (matchIndex === 0 ? 'left: 0;' : 'right: 0;')}`}>
                  
                  <!-- Team A -->
                  <div class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-sm
                              ${getTeamClass(match.teamA, isWinner(match.teamA, match.teamB), match.winner === 'A')}`}
                                   style={getTeamStyle(match.teamA)}
                                   on:click={() => handleTeamClick(matchId, 'A', match.teamA)}
                                   on:keydown={(e) => e.key === 'Enter' && handleTeamClick(matchId, 'A', match.teamA)}
                                   role="button"
                                   tabindex="0">
                    <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                      {match.teamA?.seed || '-'}
                    </span>
                    <span class="truncate">{match.teamA?.name || ''}</span>
                    {#if showScores && match.teamA?.score !== undefined}
                      <span class="ml-auto mr-1 text-gray-200">{match.teamA.score}</span>
                    {/if}
                  </div>
                  
                  <!-- Team B -->
                  <div class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-sm
                              ${getTeamClass(match.teamB, isWinner(match.teamB, match.teamA), match.winner === 'B')}`}
                                   style={getTeamStyle(match.teamB)}
                                   on:click={() => handleTeamClick(matchId, 'B', match.teamB)}
                                   on:keydown={(e) => e.key === 'Enter' && handleTeamClick(matchId, 'B', match.teamB)}
                                   role="button"
                                   tabindex="0">
                    <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                      {match.teamB?.seed || '-'}
                    </span>
                    <span class="truncate">{match.teamB?.name || ''}</span>
                    {#if showScores && match.teamB?.score !== undefined}
                      <span class="ml-auto mr-1 text-gray-200">{match.teamB.score}</span>
                    {/if}
                  </div>
                </div>
              {/if}
            {/if}
          {/each}
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }

  /* Slightly condensed but legible font for team names */
  :global(.truncate) {
    font-family: Inter, "Segoe UI", Roboto, -apple-system, sans-serif;
    font-feature-settings: "tnum" on, "lnum" on;
    letter-spacing: -0.01em;
    font-weight: 450;
  }
</style> 