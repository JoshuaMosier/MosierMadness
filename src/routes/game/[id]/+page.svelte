<script>
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  
  export let data;
  
  let gameData = null;
  let loading = false;
  let error = null;
  let entries = [];
  let entriesLoading = true;
  let teamSelections = { home: [], away: [], other: [] };
  let currentUserId = null; // Store the current user's ID
  let previousGameId = null; // Track the previous game ID to detect changes
  
  // Get the current user's ID on mount
  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUserId = user.id;
      console.log('Current user ID:', currentUserId);
    }
  });
  
  // Helper function to check if an entry belongs to the current user
  function isCurrentUser(entry) {
    return entry.user_id === currentUserId;
  }

  // React to changes in the data prop, particularly the gameId
  $: if (data.gameId !== previousGameId) {
    // Reset state when changing games
    teamSelections = { home: [], away: [], other: [] };
    entriesLoading = true;
    previousGameId = data.gameId;
    
    const matches = data.matches;
    const gameId = data.gameId;
    
    if (matches && matches.length > 0) {
      // Find the game by matching teams and time
      const targetGame = matches[gameId];
      if (targetGame) {
        gameData = targetGame;
        // Load entries for the new game
        if (typeof window !== 'undefined') { // Only run in browser
          loadEntries();
        } else {
          // In SSR, defer loading until mounted
          onMount(() => loadEntries());
        }
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
      const homeTeamFormatted = `${gameData[1][2]} ${gameData[1][4]}`;
      const awayTeamFormatted = `${gameData[0][2]} ${gameData[0][4]}`;
      
      console.log("Looking for teams:", homeTeamFormatted, awayTeamFormatted);
      
      // Fetch master bracket from API endpoint
      const masterResponse = await fetch('/api/master-bracket');
      if (!masterResponse.ok) {
        throw new Error('Failed to fetch master bracket');
      }
      const masterData = await masterResponse.json();
      const masterBracket = masterData.masterBracket;
      
      // Find the game index in the master bracket by matching the teams
      let gameIndex = -1;
      
      // Try to find the match by looking for both teams in the live bracket
      const liveBracketResponse = await fetch('/api/live-bracket');
      if (!liveBracketResponse.ok) {
        throw new Error('Failed to fetch live bracket');
      }
      const liveBracketData = await liveBracketResponse.json();
      
      // Loop through all matches to find our specific game
      for (let i = 1; i <= 63; i++) {
        const match = liveBracketData.matches[i];
        if (!match) continue;
        
        // Check if either team A or team B matches our teams
        const matchTeamA = match.teamA ? `${match.teamA.seed} ${match.teamA.name}` : null;
        const matchTeamB = match.teamB ? `${match.teamB.seed} ${match.teamB.name}` : null;
        
        if ((matchTeamA === homeTeamFormatted && matchTeamB === awayTeamFormatted) || 
            (matchTeamA === awayTeamFormatted && matchTeamB === homeTeamFormatted)) {
          gameIndex = i - 1; // Convert to 0-based index for selections array
          console.log(`Found game at bracket index: ${gameIndex}`);
          break;
        }
      }
      
      if (gameIndex === -1) {
        console.warn('Could not find exact match in bracket, using game ID as fallback');
        // As fallback, use the game ID from the route (but this may not be accurate)
        gameIndex = parseInt(data.gameId) - 1;
      }
      
      // Query brackets from all users
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
      
      console.log(`Found ${bracketsData?.length || 0} total brackets, checking selections at index ${gameIndex}`);
      
      const homeTeamPicks = [];
      const awayTeamPicks = [];
      const otherTeamPicks = []; // New array for "other team" picks
      
      // Now we need to check each bracket's selection at this specific index
      bracketsData?.forEach(bracket => {
        if (!bracket.selections || !bracket.profiles || !bracket.is_submitted) return;
        
        // Get the user's pick for this specific game
        const userPick = bracket.selections[gameIndex];
        
        if (!userPick) return; // Skip if no pick for this game
        
        // Check if user picked home team or away team
        if (userPick === homeTeamFormatted) {
          homeTeamPicks.push({
            name: `${bracket.profiles.first_name} ${bracket.profiles.last_name}`,
            id: bracket.id,
            user_id: bracket.user_id  // Add user_id to identify the current user
          });
        } else if (userPick === awayTeamFormatted) {
          awayTeamPicks.push({
            name: `${bracket.profiles.first_name} ${bracket.profiles.last_name}`,
            id: bracket.id,
            user_id: bracket.user_id  // Add user_id to identify the current user
          });
        } else {
          // User picked a different team that isn't in this game
          otherTeamPicks.push({
            name: `${bracket.profiles.first_name} ${bracket.profiles.last_name}`,
            id: bracket.id,
            user_id: bracket.user_id,  // Add user_id to identify the current user
            team: userPick // Store which team they picked
          });
        }
      });
      
      console.log(`Found ${homeTeamPicks.length} home team picks, ${awayTeamPicks.length} away team picks, and ${otherTeamPicks.length} other team picks`);
      
      // Group other team picks by team name for easier display
      const otherTeamsMap = new Map();
      otherTeamPicks.forEach(pick => {
        if (!otherTeamsMap.has(pick.team)) {
          otherTeamsMap.set(pick.team, []);
        }
        otherTeamsMap.get(pick.team).push(pick);
      });
      
      // Create a map of team names to SEO names for logo lookup
      const teamSeoMap = {};
      for (let i = 1; i <= 63; i++) {
        const match = liveBracketData.matches[i];
        if (match?.teamA) {
          teamSeoMap[match.teamA.name] = match.teamA.seoName || getSeoNameFallback(match.teamA.name);
        }
        if (match?.teamB) {
          teamSeoMap[match.teamB.name] = match.teamB.seoName || getSeoNameFallback(match.teamB.name);
        }
      }
      
      // Convert the map to array of objects for easier use in the template
      const otherTeams = Array.from(otherTeamsMap.entries()).map(([team, users]) => {
        // Extract team name from the selection string (format: "1 TeamName")
        const teamName = team.split(' ').slice(1).join(' ');
        // Get the SEO name for this team from our map, or generate a fallback
        const seoName = teamSeoMap[teamName] || getSeoNameFallback(teamName);
        
        return {
          team,
          users,
          count: users.length,
          // Parse the team name to get the seed and name separately
          seed: parseInt(team.split(' ')[0]),
          name: teamName,
          seoName: seoName
        };
      }).sort((a, b) => b.count - a.count); // Sort by number of picks (descending)
      
      teamSelections = {
        home: homeTeamPicks,
        away: awayTeamPicks,
        other: otherTeams
      };
      
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      entriesLoading = false;
    }
  }
  
  // Helper function to get SEO name from team name as fallback
  function getSeoNameFallback(teamName) {
    return teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
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
        
        <div class="game-content flex flex-row justify-between items-center gap-4 py-4">
          <!-- Away Team -->
          <div class="team-block text-center flex-1">
            <img 
              class="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2" 
              src="/images/team-logos/{gameData[0][6]}.svg" 
              alt="{gameData[0][0]} logo"
              on:error={handleImageError}
            >
            <div class="team-seed bg-gray-800 text-white inline-block px-2 py-1 rounded mb-1">
              #{gameData[0][2]}
            </div>
            <div class="team-name text-lg sm:text-xl font-semibold mb-1 {isWinner(gameData[0]) ? 'text-white' : isWinner(gameData[1]) ? 'text-gray-400 line-through' : 'text-white'}">
              {gameData[0][4]}
            </div>
            <div class="team-score text-3xl sm:text-4xl font-bold {isWinner(gameData[0]) ? 'text-yellow-300' : 'text-white'}">
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
              class="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2" 
              src="/images/team-logos/{gameData[1][6]}.svg" 
              alt="{gameData[1][0]} logo"
              on:error={handleImageError}
            >
            <div class="team-seed bg-gray-800 text-white inline-block px-2 py-1 rounded mb-1">
              #{gameData[1][2]}
            </div>
            <div class="team-name text-lg sm:text-xl font-semibold mb-1 {isWinner(gameData[1]) ? 'text-white' : isWinner(gameData[0]) ? 'text-gray-400 line-through' : 'text-white'}">
              {gameData[1][4]}
            </div>
            <div class="team-score text-3xl sm:text-4xl font-bold {isWinner(gameData[1]) ? 'text-yellow-300' : 'text-white'}">
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
          <!-- Mobile Layout (Below md breakpoint) -->
          <div class="md:hidden space-y-6">
            <!-- Away Team Section -->
            <div class="team-section">
              <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-2">
                <img 
                  class="w-6 h-6 sm:w-8 sm:h-8" 
                  src="/images/team-logos/{gameData[0][6]}.svg" 
                  alt="{gameData[0][0]} logo"
                  on:error={handleImageError}
                >
                <h4 class="text-base sm:text-lg font-semibold text-white">{gameData[0][4]} ({teamSelections.away.length})</h4>
              </div>
              
              <div class="bg-zinc-800/30 p-2 sm:p-4 rounded-b-lg">
                {#if teamSelections.away.length === 0}
                  <div class="text-center text-gray-400 py-4">No entries picked this team.</div>
                {:else}
                  <div class="grid grid-cols-2 gap-2 sm:gap-3">
                    {#each teamSelections.away as entry}
                      <div class="px-2 py-1 sm:px-3 sm:py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate text-sm sm:text-base"
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
            
            <!-- Home Team Section -->
            <div class="team-section">
              <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-2">
                <img 
                  class="w-6 h-6 sm:w-8 sm:h-8" 
                  src="/images/team-logos/{gameData[1][6]}.svg" 
                  alt="{gameData[1][0]} logo"
                  on:error={handleImageError}
                >
                <h4 class="text-base sm:text-lg font-semibold text-white">{gameData[1][4]} ({teamSelections.home.length})</h4>
              </div>
              
              <div class="bg-zinc-800/30 p-2 sm:p-4 rounded-b-lg">
                {#if teamSelections.home.length === 0}
                  <div class="text-center text-gray-400 py-4">No entries picked this team.</div>
                {:else}
                  <div class="grid grid-cols-2 gap-2 sm:gap-3">
                    {#each teamSelections.home as entry}
                      <div class="px-2 py-1 sm:px-3 sm:py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate text-sm sm:text-base"
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

          <!-- Desktop Layout (md breakpoint and above) -->
          <div class="hidden md:flex md:flex-row justify-between gap-8">
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
                      <div class="px-3 py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate"
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
                      <div class="px-3 py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate"
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

      <!-- Unexpected Team Picks Section with logos -->
      {#if teamSelections.other && teamSelections.other.length > 0}
        <div class="bg-black bg-opacity-30 rounded-lg p-4 shadow-lg border border-white/10 mt-6">
          <h3 class="text-center text-xl text-white font-semibold mb-4">Alternate Predictions</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            {#each teamSelections.other as teamGroup}
              <div class="bg-zinc-800/30 rounded-lg overflow-hidden">
                <div class="team-header bg-zinc-800/70 rounded-t-lg p-3 flex items-center justify-center gap-2">
                  <img 
                    class="w-6 h-6 sm:w-8 sm:h-8" 
                    src="/images/team-logos/{teamGroup.seoName}.svg" 
                    alt="{teamGroup.name} logo"
                    on:error={handleImageError}
                  >
                  <div class="team-seed bg-gray-700 text-white inline-block px-1.5 py-0.5 rounded text-sm">
                    #{teamGroup.seed}
                  </div>
                  <h4 class="text-base sm:text-lg font-semibold text-white">{teamGroup.name} ({teamGroup.count})</h4>
                </div>
                
                <div class="bg-zinc-800/30 p-2 sm:p-4 rounded-b-lg">
                  <div class="grid grid-cols-2 gap-1.5 text-sm">
                    {#each teamGroup.users as entry}
                      <div class="px-2 py-1 sm:px-3 sm:py-2 bg-zinc-800/30 rounded hover:bg-zinc-700/30 transition-colors {entry.user_id === currentUserId ? 'border border-amber-500' : ''}">
                        <a 
                          href="/entries?selected={entry.name.replace(' ', '|')}" 
                          class="{entry.user_id === currentUserId ? 'text-amber-400 font-bold' : 'text-zinc-300'} hover:text-white transition-colors block truncate text-sm sm:text-base"
                          title={entry.name}
                        >
                          {entry.name}
                        </a>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
</div>