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
</script>

<!-- Bracket -->
<div class="bg-neutral-900 text-center w-[1000px] mx-auto mt-[50px] pl-0 rounded-lg shadow-2xl">
  <div class="flex justify-center w-full">
    <!-- Table Dates -->
    <table class="text-xs border-collapse mx-auto w-[950px] rounded-lg overflow-hidden shadow-lg">
      <tbody>
        <tr>
          {#each [...rounds, ...rounds.slice().reverse().slice(1)] as round, i}
            <th class="text-white bg-gradient-to-r from-amber-600 to-amber-700 p-3 whitespace-nowrap text-center w-[86px] font-semibold">
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
    <!-- Round 1 -->
    <div class="absolute top-0 w-[950px]">
      <h3 class="pt-[15px] hidden">Round One (NCAA Men's Basketball Tournament)</h3>
      
      {#each regions as region}
        <div class="region{region.id}">
          <h4 class={`uppercase text-amber-300 pt-[15px] font-bold ${region.id === 1 || region.id === 2 ? 
                      'absolute left-[170px] block w-[150px]' : 
                      'absolute right-[170px] block text-right w-[150px]'} 
                      ${region.id === 2 || region.id === 4 ? 'top-[715px]' : 'top-[165px]'}`}>
            {region.name}
          </h4>
          
          {#each Array(getMatchesPerRound(1)) as _, matchIndex}
            <div id="match{getMatchId(1, region.id, matchIndex)}" 
                 class={`absolute text-white border border-yellow-700 p-0 w-[115px] text-xs cursor-pointer h-[40px] flex flex-col rounded-sm transition-all duration-200 hover:shadow-md
                        ${region.id === 1 || region.id === 2 ? 'border-l-0 left-0' : 'border-r-0 right-0'}`}
                 style="top: {getMatchTopPosition(1, region.id, matchIndex)}px">
              <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200 rounded-tr-sm">
                1 UConn
              </p>
              <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200">
                1 UConn
              </p>
            </div>
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
            <div id="match{getMatchId(2, region.id, matchIndex)}" 
                 class={`absolute text-white border border-yellow-700 p-0 w-[115px] text-xs cursor-pointer h-[40px] mt-[24px] flex flex-col rounded-sm transition-all duration-200 hover:shadow-md
                        ${region.id === 1 || region.id === 2 ? 'border-l-0 left-0' : 'border-r-0 right-0'}`}
                 style="top: {getMatchTopPosition(2, region.id, matchIndex)}px">
              <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200 rounded-tr-sm">
                1 UConn
              </p>
              <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200">
                1 UConn
              </p>
            </div>
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
            <div id="match{getMatchId(3, region.id, matchIndex)}" 
                 class={`absolute text-white border border-yellow-700 p-0 w-[115px] text-xs cursor-pointer h-[90px] mt-[50px] flex flex-col justify-between rounded-sm transition-all duration-200 hover:shadow-md
                        ${region.id === 1 || region.id === 2 ? 'border-l-0 left-0' : 'border-r-0 right-0'}`}
                 style="top: {getMatchTopPosition(3, region.id, matchIndex)}px">
              <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200 rounded-tr-sm">
                1 UConn
              </p>
              <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200">
                1 UConn
              </p>
            </div>
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
          
          <div id="match{getMatchId(4, region.id, 0)}" 
               class={`absolute text-white border border-yellow-700 p-0 w-[115px] text-xs cursor-pointer h-[190px] mt-[100px] flex flex-col justify-between rounded-sm transition-all duration-200 hover:shadow-md
                      ${region.id === 1 || region.id === 2 ? 'border-l-0 left-0' : 'border-r-0 right-0'}`}
               style="top: {getMatchTopPosition(4, region.id, 0)}px">
            <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200 rounded-tr-sm">
              1 UConn
            </p>
            <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200">
              1 UConn
            </p>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Round 5 (Final Four) -->
    <div class="absolute top-0 left-[280px] w-[380px]">
      <h3 class="pt-[15px] hidden">Round Five (NCAA Men's Basketball Tournament)</h3>
      <div>
        {#each Array(2) as _, matchIndex}
          <div id="match{getMatchId(5, 1, matchIndex)}" 
               class={`absolute text-white border border-yellow-700 p-0 w-[115px] text-xs cursor-pointer h-[90px] top-[425px] flex flex-col justify-between rounded-sm transition-all duration-200 hover:shadow-md
                      ${matchIndex === 0 ? 'left-0 border-l-0' : 'right-0 border-r-0'}`}>
            <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200 rounded-tr-sm">
              1 UConn
            </p>
            <p class="h-[20px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 flex items-center transition-colors duration-200">
              1 UConn
            </p>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Round 6 (Championship) -->
    <div class="absolute top-0 left-[395px] w-[150px]">
      <h3 class="pt-[15px] hidden">Round Six (NCAA Men's Basketball Tournament)</h3>
      <div>
        <div id="match63" class="absolute text-white p-0 w-[150px] text-xs cursor-pointer h-[90px] top-[425px] flex flex-col">
          <p class="h-[25px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 text-[13px] leading-[25px] px-[6px] pr-[10px] border-b border-yellow-700 mt-[22px] transition-colors duration-200 rounded-t-sm">
            1 UConn
          </p>
          <p class="h-[25px] m-0 bg-zinc-800 pl-[5px] whitespace-nowrap hover:bg-amber-800 text-[13px] leading-[25px] px-[6px] pr-[10px] transition-colors duration-200 rounded-b-sm">
            1 UConn
          </p>
          <p class="relative whitespace-nowrap top-[-10px] border-2 border-yellow-700 text-white text-center mt-[10px] bg-amber-700 py-1 rounded-md font-semibold shadow-md">
            Champion: 1 UConn
          </p>
        </div>
      </div>
    </div>
  </div>
</div>