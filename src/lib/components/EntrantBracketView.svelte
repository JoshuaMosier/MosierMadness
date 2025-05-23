<script>
  import { fade } from 'svelte/transition';
  import BracketView from './BracketView.svelte';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { page } from '$app/stores';

  export let entries = [];
  export let loading = false;
  export let error = null;

  let selectedEntrantId = '';
  let liveBracketData = null;
  let loadingBracketData = true;
  let user = null;
  
  // Helper function to find entry by name
  function findEntryByName(firstName, lastName) {
    return entries.find(e => 
      e.first_name.toLowerCase() === firstName.toLowerCase() && 
      e.last_name.toLowerCase() === lastName.toLowerCase()
    );
  }

  // Watch for both URL parameter changes AND entries being loaded
  $: if (!loading && entries.length > 0 && $page.url.searchParams.get('selected')) {
    const urlSelectedId = $page.url.searchParams.get('selected');
    // Find the corresponding score in the URL
    const [firstName, lastName] = urlSelectedId.split('|');
    if (firstName && lastName) {
      const matchingEntry = findEntryByName(firstName, lastName);
      if (matchingEntry) {
        selectedEntrantId = matchingEntry.id;
      }
    }
  }
  
  $: selectedEntrant = entries.find(e => e.id === selectedEntrantId);
  $: selectedBracket = selectedEntrant?.brackets[0];

  // Sort entries by first name
  $: sortedEntries = entries
    .filter(entry => entry.brackets[0]?.is_submitted)
    .sort((a, b) => a.first_name.localeCompare(b.first_name));

  // Helper function to format team string (e.g., "1 Houston")
  function formatTeamString(team) {
    if (!team) return null;
    return `${team.seed} ${team.name}`;
  }

  // Function to transform bracket data into the format expected by BracketView
  function transformBracketData(bracketData) {
    if (!bracketData || !liveBracketData) return null;

    const matches = {};
    const selections = bracketData.selections || [];
    
    // Build a list of eliminated teams from live bracket data
    const eliminatedTeams = new Set();
    const advancedTeams = new Set();
    
    // First add all losing teams to eliminated set
    for (let i = 1; i <= 48; i++) {
      const match = liveBracketData.matches[i];
      // Only add teams to eliminated if the match has a winner
      if (match?.winner) {
        // Add the losing team to the eliminated set
        const losingTeam = match.winner === 'A' ? match.teamB : match.teamA;
        if (losingTeam) {
          const teamStr = formatTeamString(losingTeam);
          eliminatedTeams.add(teamStr);
          console.log('Added to eliminated:', teamStr);
        }
      }
    }

    console.log('Eliminated teams before processing winners:', Array.from(eliminatedTeams));

    // DO NOT REMOVE teams from eliminatedTeams based on the bracket data!
    // This logic is incorrect and is causing the issue:
    // Instead, use a different approach - build advancedTeams separately
    for (let i = 1; i <= 63; i++) {
      const match = liveBracketData.matches[i];
      if (match?.winner) {
        const winningTeam = match.winner === 'A' ? match.teamA : match.teamB;
        if (winningTeam) {
          const teamStr = formatTeamString(winningTeam);
          advancedTeams.add(teamStr);
          // Do NOT delete from eliminatedTeams here
        }
      }
    }

    // Debug what we have now
    console.log('Final eliminated teams:', Array.from(eliminatedTeams));
    console.log('Advanced teams:', Array.from(advancedTeams));

    // Initialize first round matches using live bracket data (1-32)
    for (let i = 0; i < 32; i++) {
      const liveMatch = liveBracketData.matches[i + 1];
      
      matches[i + 1] = {
        teamA: liveMatch.teamA,
        teamB: liveMatch.teamB,
        winner: selections[i] ? 
          (selections[i] === formatTeamString(liveMatch.teamA) ? 'A' : 'B') : 
          null,
      };
    }

    // Initialize later round matches (33-63)
    for (let i = 32; i < 63; i++) {
      const prevRoundMatchA = Math.floor((i - 32) * 2) + 1;
      const prevRoundMatchB = prevRoundMatchA + 1;
      
      // Get the winning teams from previous matches
      const prevMatchA = matches[prevRoundMatchA];
      const prevMatchB = matches[prevRoundMatchB];
      
      // Get the teams that advance from previous matches
      const winnerA = prevMatchA?.winner ? 
        (prevMatchA.winner === 'A' ? prevMatchA.teamA : prevMatchA.teamB) : 
        null;
      
      const winnerB = prevMatchB?.winner ? 
        (prevMatchB.winner === 'A' ? prevMatchB.teamA : prevMatchB.teamB) : 
        null;

      // Get the actual result from the live bracket
      const liveMatch = liveBracketData.matches[i + 1];
      const liveTeamA = liveMatch?.teamA;
      const liveTeamB = liveMatch?.teamB;
      const liveWinner = liveMatch?.winner;
      
      // Get user's selected team for this match
      const userSelection = selections[i];
      
      // Format team strings for comparison
      const teamAString = formatTeamString(winnerA);
      const teamBString = formatTeamString(winnerB);
      
      // Determine if user selection matches the actual teams in this position
      let isCorrectA = false;
      let isCorrectB = false;
      let isWrongA = false;
      let isWrongB = false;
      let isEliminatedA = false;
      let isEliminatedB = false;
      
      // Check if user's selection matches team A or has been eliminated
      if (teamAString) {
        // If we have live data for this match position
        if (liveTeamA) {
          const liveTeamStr = formatTeamString(liveTeamA);
          isCorrectA = teamAString === liveTeamStr;
          // IMPORTANT: Use the eliminatedTeams set directly, don't rely on other logic
          isWrongA = eliminatedTeams.has(teamAString);
        } 
        // If no live data yet, check if the team is already eliminated
        else {
          isEliminatedA = eliminatedTeams.has(teamAString);
        }
      }
      
      // Check if user's selection matches team B or has been eliminated
      if (teamBString) {
        // If we have live data for this match position
        if (liveTeamB) {
          const liveTeamStr = formatTeamString(liveTeamB);
          isCorrectB = teamBString === liveTeamStr;
          // IMPORTANT: Use the eliminatedTeams set directly
          isWrongB = eliminatedTeams.has(teamBString);
        } 
        // If no live data yet, check if the team is already eliminated
        else {
          isEliminatedB = eliminatedTeams.has(teamBString);
        }
      }

      // Create teams with appropriate colors
      const teamA = winnerA ? { 
        ...winnerA, 
        color: isCorrectA ? '#22c55e' : (isWrongA || isEliminatedA) ? '#ef4444' : '#666666', 
        secondaryColor: isCorrectA ? '#16a34a' : (isWrongA || isEliminatedA) ? '#dc2626' : '#666666' 
      } : null;
      
      const teamB = winnerB ? { 
        ...winnerB, 
        color: isCorrectB ? '#22c55e' : (isWrongB || isEliminatedB) ? '#ef4444' : '#666666', 
        secondaryColor: isCorrectB ? '#16a34a' : (isWrongB || isEliminatedB) ? '#dc2626' : '#666666' 
      } : null;
      
      matches[i + 1] = {
        teamA,
        teamB,
        winner: selections[i] ? 
          (selections[i] === teamAString ? 'A' : 
           selections[i] === teamBString ? 'B' : null) : 
          null
      };
    }

    // Set champion if we have a winner in the final match
    const finalMatch = matches[63];
    const champion = finalMatch?.winner ? 
      (finalMatch.winner === 'A' ? finalMatch.teamA : finalMatch.teamB) : 
      null;

    return {
      matches,
      champion
    };
  }

  function isTeamEliminated(teamStr, eliminatedTeamsSet) {
    if (!teamStr) return false;
    
    // Direct check
    if (eliminatedTeamsSet.has(teamStr)) return true;
    
    // Normalize and check again (remove punctuation, lowercase)
    const normalizedTeamStr = teamStr.toLowerCase().replace(/[^\w\s]/g, '');
    
    for (const eliminatedTeam of eliminatedTeamsSet) {
      const normalizedEliminatedTeam = eliminatedTeam.toLowerCase().replace(/[^\w\s]/g, '');
      if (normalizedTeamStr === normalizedEliminatedTeam) return true;
    }
    
    return false;
  }

  onMount(async () => {
    try {
      // Get the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user = currentUser;
      
      // Fetch live bracket data
      const response = await fetch('/api/live-bracket');
      if (!response.ok) {
        throw new Error(`Error fetching live bracket data: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      liveBracketData = data;
      loadingBracketData = false;
      
      // If no URL parameter and user is logged in, default to their entry
      if (!$page.url.searchParams.get('selected') && user && entries.length > 0) {
        const userEntry = entries.find(e => e.email === user.email);
        if (userEntry) {
          selectedEntrantId = userEntry.id;
        }
      }
    } catch (err) {
      console.error('Error in component initialization:', err);
      error = err.message;
      loadingBracketData = false;
    }
  });
</script>

<div class="max-w-7xl mx-auto px-4 py-8">

  {#if loading || loadingBracketData}
    <div class="flex justify-center items-center min-h-[400px]" in:fade={{ duration: 100 }}>
      <div class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-amber-600 font-medium">Loading brackets...</div>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-lg text-center mb-4" 
         in:fade={{ duration: 100, delay: 100 }}>
      {error}
    </div>
  {:else}
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
         in:fade={{ duration: 300, delay: 100 }}>
      <!-- Header Section with Entrant Selector -->
      <div class="border-b border-zinc-800 bg-zinc-900/50 p-6">
        <div class="max-w-sm mx-auto">
          <div class="flex items-center justify-between mb-2">
            <label for="entrant-select" class="block text-sm font-medium text-zinc-400">
              Select an Entrant
            </label>
            <div class="text-sm text-zinc-500">
              {sortedEntries.length} submitted
            </div>
          </div>
          <select
            id="entrant-select"
            bind:value={selectedEntrantId}
            class="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="">Choose an entrant...</option>
            {#each sortedEntries as entry}
              <option value={entry.id || entry.entryId}>
                {entry.first_name} {entry.last_name}
              </option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Bracket View -->
      {#if selectedEntrantId && liveBracketData}
        <div class="p-6">
          <BracketView
            mode="view"
            bracketData={transformBracketData(selectedBracket)}
            isLocked={true}
            showScores={false}
          />
        </div>
      {:else}
        <div class="p-6 text-center text-zinc-400">
          Select an entrant above to view their bracket
        </div>
      {/if}
    </div>
  {/if}
</div> 