<script>
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
  
  // Sample teams data - replace with actual data in your implementation
  const teams = [
    { id: 1, name: "UConn", seed: 1, score: 85 },
    { id: 2, name: "Purdue", seed: 2, score: 75 },
    { id: 3, name: "Houston", seed: 1, score: 82 },
    { id: 4, name: "Tennessee", seed: 2, score: 68 }
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
  
  // Helper function to get a random team for demo purposes
  function getTeam(seed = 1) {
    const team = teams[Math.floor(Math.random() * teams.length)];
    return { ...team, seed };
  }
  
  // Helper to determine if a team won (for styling)
  function isWinner(teamA, teamB) {
    return teamA.score > teamB.score;
  }
  
  // Championship teams
  const champion = getTeam(1);
  const runnerUp = getTeam(1);
  const championWon = true;
</script>

<!-- Bracket -->
<div class="bg-gradient-to-b from-neutral-900 to-neutral-800 text-center w-full max-w-[1200px] mx-auto mt-[30px] pl-0 rounded-lg shadow-2xl p-4 overflow-x-auto">
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
    <!-- Connecting Lines (Add these before the rounds) -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Round 1 to 2 connectors -->
      {#each regions as region}
        {#each Array(getMatchesPerRound(2)) as _, matchIndex}
          <div class={`absolute border-r-2 border-t-2 border-b-2 border-amber-700/20 rounded-r-md
                      ${region.id === 1 || region.id === 2 ? 'left-[115px]' : 'right-[115px] transform rotate-180'}`}
               style="top: {getMatchTopPosition(2, region.id, matchIndex) + 10}px; 
                      height: 80px; width: 15px;"></div>
        {/each}
      {/each}
      
      <!-- Round 2 to 3 connectors -->
      {#each regions as region}
        {#each Array(getMatchesPerRound(3)) as _, matchIndex}
          <div class={`absolute border-r-2 border-t-2 border-b-2 border-amber-700/20 rounded-r-md
                      ${region.id === 1 || region.id === 2 ? 'left-[230px]' : 'right-[230px] transform rotate-180'}`}
               style="top: {getMatchTopPosition(3, region.id, matchIndex) + 20}px; 
                      height: 160px; width: 15px;"></div>
        {/each}
      {/each}
      
      <!-- Round 3 to 4 connectors -->
      {#each regions as region}
        <div class={`absolute border-r-2 border-t-2 border-b-2 border-amber-700/20 rounded-r-md
                    ${region.id === 1 || region.id === 2 ? 'left-[345px]' : 'right-[345px] transform rotate-180'}`}
             style="top: {getMatchTopPosition(4, region.id, 0) + 40}px; 
                    height: 320px; width: 15px;"></div>
      {/each}
      
      <!-- Final Four connectors -->
      <div class="absolute left-[395px] top-[425px] border-t-2 border-amber-700/20" style="width: 150px; height: 1px;"></div>
    </div>
    
    <!-- Round 1 -->
    <div class="absolute top-0 w-[950px]">
      <h3 class="pt-[15px] hidden">Round One (NCAA Men's Basketball Tournament)</h3>
      
      {#each regions as region}
        <div class="region{region.id}">
          <h4 class={`uppercase text-amber-300/90 pt-[15px] font-bold ${region.id === 1 || region.id === 2 ? 
                      'absolute left-[170px] block w-[150px]' : 
                      'absolute right-[170px] block text-right w-[150px]'} 
                      ${region.id === 2 || region.id === 4 ? 'top-[715px]' : 'top-[165px]'}`}>
            {region.name}
          </h4>
          
          {#each Array(getMatchesPerRound(1)) as _, matchIndex}
            {#if true}
              {@const teamA = getTeam(matchIndex + 1)}
              {@const teamB = getTeam(16 - matchIndex)}
              {@const teamAWon = isWinner(teamA, teamB)}
              {@const teamBWon = isWinner(teamB, teamA)}
              
              <div id="match{getMatchId(1, region.id, matchIndex)}" 
                   class={`absolute text-white border border-zinc-700 p-0 w-[115px] text-xs cursor-pointer h-[40px] flex flex-col rounded-sm transition-all duration-200 hover:shadow-md hover:border-amber-500/80
                          ${region.id === 1 || region.id === 2 ? 'border-l-0 left-0' : 'border-r-0 right-0'}`}
                   style="top: {getMatchTopPosition(1, region.id, matchIndex)}px">
                <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-tr-sm
                          ${teamAWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                  <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamA.seed}</span>
                  <span class={`truncate ${!teamAWon ? 'line-through' : ''}`}>{teamA.name}</span>
                  <span class="ml-auto mr-1 ${teamAWon ? 'text-red-700/90' : 'text-gray-400'}">{teamA.score}</span>
                </p>
                <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200
                          ${teamBWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                  <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamB.seed}</span>
                  <span class={`truncate ${!teamBWon ? 'line-through' : ''}`}>{teamB.name}</span>
                  <span class="ml-auto mr-1 ${teamBWon ? 'text-red-700/90' : 'text-gray-400'}">{teamB.score}</span>
                </p>
              </div>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
    
    <!-- Round 2 -->
    <div class="absolute top-0 left-[115px] w-[720px]">
      <h3 class="pt-[15px] hidden">Round Two (NCAA Men's Basketball Tournament)</h3>
      
      {#each regions as region}
        <div class="region{region.id}">
          <h4 class="uppercase text-white pt-[15px] hidden">{region.name}</h4>
          
          {#each Array(getMatchesPerRound(2)) as _, matchIndex}
            {#if true}
              {@const teamA = getTeam(matchIndex + 1)}
              {@const teamB = getTeam(8 - matchIndex)}
              {@const teamAWon = isWinner(teamA, teamB)}
              {@const teamBWon = isWinner(teamB, teamA)}
              
              <div id="match{getMatchId(2, region.id, matchIndex)}" 
                   class={`absolute text-white border border-zinc-700 p-0 w-[115px] text-xs cursor-pointer h-[40px] mt-[24px] flex flex-col rounded-sm transition-all duration-200 hover:shadow-md hover:border-amber-500/80
                          ${region.id === 1 || region.id === 2 ? 'border-l-0 left-0' : 'border-r-0 right-0'}`}
                   style="top: {getMatchTopPosition(2, region.id, matchIndex)}px">
                <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-tr-sm
                          ${teamAWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                  <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamA.seed}</span>
                  <span class={`truncate ${!teamAWon ? 'line-through' : ''}`}>{teamA.name}</span>
                  <span class="ml-auto mr-1 ${teamAWon ? 'text-red-700/90' : 'text-gray-400'}">{teamA.score}</span>
                </p>
                <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200
                          ${teamBWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                  <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamB.seed}</span>
                  <span class={`truncate ${!teamBWon ? 'line-through' : ''}`}>{teamB.name}</span>
                  <span class="ml-auto mr-1 ${teamBWon ? 'text-red-700/90' : 'text-gray-400'}">{teamB.score}</span>
                </p>
              </div>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
    
    <!-- Round 3 (Sweet 16) -->
    <div class="absolute top-0 left-[230px] w-[490px]">
      <h3 class="pt-[15px] hidden">Round Three (NCAA Men's Basketball Tournament)</h3>
      
      {#each regions as region}
        <div class="region{region.id}">
          <h4 class="uppercase text-white pt-[15px] hidden">{region.name}</h4>
          
          {#each Array(getMatchesPerRound(3)) as _, matchIndex}
            {#if true}
              {@const teamA = getTeam(matchIndex + 1)}
              {@const teamB = getTeam(4 - matchIndex)}
              {@const teamAWon = isWinner(teamA, teamB)}
              {@const teamBWon = isWinner(teamB, teamA)}
              
              <div id="match{getMatchId(3, region.id, matchIndex)}" 
                   class={`absolute text-white border border-zinc-700 p-0 w-[115px] text-xs cursor-pointer h-[90px] mt-[50px] flex flex-col justify-between rounded-sm transition-all duration-200 hover:shadow-md hover:border-amber-500/80
                          ${region.id === 1 || region.id === 2 ? 'border-l-0 left-0' : 'border-r-0 right-0'}`}
                   style="top: {getMatchTopPosition(3, region.id, matchIndex)}px">
                <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-tr-sm
                          ${teamAWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                  <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamA.seed}</span>
                  <span class={`truncate ${!teamAWon ? 'line-through' : ''}`}>{teamA.name}</span>
                  <span class="ml-auto mr-1 ${teamAWon ? 'text-red-700/90' : 'text-gray-400'}">{teamA.score}</span>
                </p>
                <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200
                          ${teamBWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                  <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamB.seed}</span>
                  <span class={`truncate ${!teamBWon ? 'line-through' : ''}`}>{teamB.name}</span>
                  <span class="ml-auto mr-1 ${teamBWon ? 'text-red-700/90' : 'text-gray-400'}">{teamB.score}</span>
                </p>
              </div>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
    
    <!-- Round 4 (Elite Eight) -->
    <div class="absolute top-0 left-[345px] w-[260px]">
      <h3 class="pt-[15px] hidden">Round Four (NCAA Men's Basketball Tournament)</h3>
      
      {#each regions as region}
        <div class="region{region.id}">
          <h4 class="uppercase text-white pt-[15px] hidden">{region.name}</h4>
          
          {#if true}
            {@const teamA = getTeam(1)}
            {@const teamB = getTeam(2)}
            {@const teamAWon = isWinner(teamA, teamB)}
            {@const teamBWon = isWinner(teamB, teamA)}
            
            <div id="match{getMatchId(4, region.id, 0)}" 
                 class={`absolute text-white border border-zinc-700 p-0 w-[115px] text-xs cursor-pointer h-[190px] mt-[100px] flex flex-col justify-between rounded-sm transition-all duration-200 hover:shadow-md hover:border-amber-500/80
                        ${region.id === 1 || region.id === 2 ? 'border-l-0 left-0' : 'border-r-0 right-0'}`}
                 style="top: {getMatchTopPosition(4, region.id, 0)}px">
              <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-tr-sm
                        ${teamAWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamA.seed}</span>
                <span class={`truncate ${!teamAWon ? 'line-through' : ''}`}>{teamA.name}</span>
                <span class="ml-auto mr-1 ${teamAWon ? 'text-red-700/90' : 'text-gray-400'}">{teamA.score}</span>
              </p>
              <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200
                        ${teamBWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamB.seed}</span>
                <span class={`truncate ${!teamBWon ? 'line-through' : ''}`}>{teamB.name}</span>
                <span class="ml-auto mr-1 ${teamBWon ? 'text-red-700/90' : 'text-gray-400'}">{teamB.score}</span>
              </p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    
    <!-- Round 5 (Final Four) -->
    <div class="absolute top-0 left-[280px] w-[380px]">
      <h3 class="pt-[15px] hidden">Round Five (NCAA Men's Basketball Tournament)</h3>
      <div>
        {#each Array(2) as _, matchIndex}
          {#if true}
            {@const teamA = getTeam(1)}
            {@const teamB = getTeam(1)}
            {@const teamAWon = isWinner(teamA, teamB)}
            {@const teamBWon = isWinner(teamB, teamA)}
            
            <div id="match{getMatchId(5, 1, matchIndex)}" 
                 class={`absolute text-white border border-zinc-700 p-0 w-[115px] text-xs cursor-pointer h-[90px] top-[425px] flex flex-col justify-between rounded-sm transition-all duration-200 hover:shadow-md hover:border-amber-500/80
                        ${matchIndex === 0 ? 'left-0 border-l-0' : 'right-0 border-r-0'}`}>
              <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200 rounded-tr-sm
                        ${teamAWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamA.seed}</span>
                <span class={`truncate ${!teamAWon ? 'line-through' : ''}`}>{teamA.name}</span>
                <span class="ml-auto mr-1 ${teamAWon ? 'text-red-700/90' : 'text-gray-400'}">{teamA.score}</span>
              </p>
              <p class={`h-[20px] m-0 pl-[5px] whitespace-nowrap flex items-center transition-colors duration-200
                        ${teamBWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
                <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{teamB.seed}</span>
                <span class={`truncate ${!teamBWon ? 'line-through' : ''}`}>{teamB.name}</span>
                <span class="ml-auto mr-1 ${teamBWon ? 'text-red-700/90' : 'text-gray-400'}">{teamB.score}</span>
              </p>
            </div>
          {/if}
        {/each}
      </div>
    </div>
    
    <!-- Round 6 (Championship) -->
    <div class="absolute top-0 left-[395px] w-[150px]">
      <h3 class="pt-[15px] hidden">Round Six (NCAA Men's Basketball Tournament)</h3>
      <div>
        <div id="match63" class="absolute text-white p-0 w-[150px] text-xs cursor-pointer h-[90px] top-[425px] flex flex-col">
          <p class={`h-[25px] m-0 pl-[5px] whitespace-nowrap text-[13px] leading-[25px] px-[6px] pr-[10px] border-b border-zinc-700 mt-[22px] rounded-t-sm flex items-center
                    ${championWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
            <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{champion.seed}</span>
            <span class={`truncate ${!championWon ? 'line-through' : ''}`}>{champion.name}</span>
            <span class="ml-auto ${championWon ? 'text-red-700/90' : 'text-gray-400'}">{champion.score}</span>
          </p>
          <p class={`h-[25px] m-0 pl-[5px] whitespace-nowrap text-[13px] leading-[25px] px-[6px] pr-[10px]rounded-b-sm flex items-center
                    ${!championWon ? 'bg-amber-800/90 font-medium' : 'bg-zinc-800/90'}`}>
            <span class="inline-block w-[16px] text-center bg-zinc-700/90 mr-1 text-[10px] font-bold">{runnerUp.seed}</span>
            <span class={`truncate ${championWon ? 'line-through' : ''}`}>{runnerUp.name}</span>
            <span class="ml-auto ${!championWon ? 'text-red-700/90' : 'text-gray-400'}">{runnerUp.score}</span>
          </p>
          <div class="relative whitespace-nowrap top-[-160px] mt-[10px] w-[150px]">
            <div class="text-white text-center bg-amber-700/90 py-3 px-4 rounded-md font-semibold shadow-md">
              <div class="text-xs uppercase tracking-wider mb-1">Champion</div>
              <div class="flex items-center justify-center">
                <span class="inline-block w-[20px] h-[20px] text-center bg-amber-800/90 mr-1 text-[11px] font-bold rounded-full flex items-center justify-center">{champion.seed}</span>
                <span>{champion.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>