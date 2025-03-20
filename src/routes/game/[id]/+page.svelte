<script>
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';
  
  export let data;
  
  let gameData = null;
  let loading = false;
  let error = null;
  let entries = [];
  let entriesLoading = true;
  let teamSelections = { home: [], away: [] };
  
  $: {
    const matches = data.matches;
    const gameId = data.gameId;
    
    if (matches && matches.length > 0) {
      // Find the game by matching teams and time
      const targetGame = matches[gameId];
      if (targetGame) {
        gameData = targetGame;
        // Once we have game data, load entries
        loadEntries();
      } else {
        gameData = matches[0];
        console.warn(`Game ID ${gameId} not found, showing first game instead`);
      }
    } else {
      error = 'No games available at this time';
    }
  }
  
  // Function to load entries from Supabase
  async function loadEntries() {
    if (!gameData) return;
    
    entriesLoading = true;
    try {
      // Format the team strings as they would appear in the selections array
      // Each selection is formatted as "<seed> <teamName>"
      const homeTeamFormatted = `${gameData[1][2]} ${gameData[1][4]}`;
      const awayTeamFormatted = `${gameData[0][2]} ${gameData[0][4]}`;
      
      console.log("Looking for teams:", homeTeamFormatted, awayTeamFormatted);
      
      // Query brackets that contain either team
      const { data: bracketsData, error: bracketsError } = await supabase
        .from('brackets')
        .select(`
          id,
          user_id,
          selections,
          is_submitted,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .eq('is_submitted', true);
      
      if (bracketsError) throw bracketsError;
      
      console.log(`Found ${bracketsData?.length || 0} total brackets`);
      
      const homeTeamPicks = [];
      const awayTeamPicks = [];
      
      // Process brackets to find which contain our target teams
      bracketsData?.forEach(bracket => {
        if (!bracket.selections || !bracket.profiles) return;
        
        // Check if bracket contains the home team
        if (bracket.selections.some(pick => pick === homeTeamFormatted)) {
          homeTeamPicks.push({
            name: `${bracket.profiles.first_name} ${bracket.profiles.last_name}`,
            id: bracket.id
          });
        }
        
        // Check if bracket contains the away team
        if (bracket.selections.some(pick => pick === awayTeamFormatted)) {
          awayTeamPicks.push({
            name: `${bracket.profiles.first_name} ${bracket.profiles.last_name}`,
            id: bracket.id
          });
        }
      });
      
      console.log(`Found ${homeTeamPicks.length} home team picks and ${awayTeamPicks.length} away team picks`);
      
      teamSelections = {
        home: homeTeamPicks,
        away: awayTeamPicks
      };
      
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      entriesLoading = false;
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

<div class="max-w-6xl mx-auto px-4 py-8">
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
    <div class="game-container">
      <!-- Game Info Section -->
      <div class="bg-black bg-opacity-30 rounded-lg p-6 shadow-lg border border-white/10 mx-auto mb-6">
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

      <!-- Entries Comparison Section -->
      <div class="bg-black bg-opacity-30 rounded-lg p-6 shadow-lg border border-white/10">
        <h3 class="text-center text-2xl text-white font-semibold mb-6">Who Picked Each Team</h3>
        
        {#if entriesLoading}
          <div class="flex justify-center py-8">
            <div class="animate-pulse text-white">Loading entries...</div>
          </div>
        {:else}
          <div class="flex flex-col md:flex-row justify-between gap-8">
            <!-- Away Team Picks Column -->
            <div class="flex-1 team-column">
              <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-3">
                <img 
                  class="w-8 h-8" 
                  src="/images/team-logos/{gameData[0][6]}.svg" 
                  alt="{gameData[0][0]} logo"
                  on:error={handleImageError}
                >
                <h4 class="text-lg font-semibold text-white">{gameData[0][4]} ({teamSelections.away.length})</h4>
              </div>
              
              <div class="bg-zinc-800/30 p-4 rounded-b-lg">
                {#if teamSelections.away.length === 0}
                  <div class="text-center text-gray-400 py-6">No entries picked this team.</div>
                {:else}
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {#each teamSelections.away as entry}
                      <div class="px-3 py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="text-zinc-300 hover:text-white transition-colors block truncate"
                          title={entry.name}
                        >
                          {entry.name}
                        </a>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Home Team Picks Column -->
            <div class="flex-1 team-column">
              <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-3">
                <img 
                  class="w-8 h-8" 
                  src="/images/team-logos/{gameData[1][6]}.svg" 
                  alt="{gameData[1][0]} logo"
                  on:error={handleImageError}
                >
                <h4 class="text-lg font-semibold text-white">{gameData[1][4]} ({teamSelections.home.length})</h4>
              </div>
              
              <div class="bg-zinc-800/30 p-4 rounded-b-lg">
                {#if teamSelections.home.length === 0}
                  <div class="text-center text-gray-400 py-6">No entries picked this team.</div>
                {:else}
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {#each teamSelections.home as entry}
                      <div class="px-3 py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="text-zinc-300 hover:text-white transition-colors block truncate"
                          title={entry.name}
                        >
                          {entry.name}
                        </a>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
</div>