<script>
  import { fade } from 'svelte/transition';
  import BracketView from './BracketView.svelte';
  import { onMount } from 'svelte';

  export let entries = [];
  export let loading = false;
  export let error = null;

  let selectedEntrantId = '';
  let firstRoundTeams = []; // Will be populated dynamically
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
    if (!bracketData) return null;

    const matches = {};
    const selections = bracketData.selections || [];
    
    // Initialize first round matches with actual teams (1-32)
    for (let i = 0; i < 32; i++) {
      matches[i + 1] = {
        teamA: firstRoundTeams[i * 2],
        teamB: firstRoundTeams[i * 2 + 1],
        winner: selections[i] ? (selections[i] === formatTeamString(firstRoundTeams[i * 2]) ? 'A' : 'B') : null
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

      const teamAString = formatTeamString(winnerA);
      const teamBString = formatTeamString(winnerB);
      
      matches[i + 1] = {
        teamA: winnerA,
        teamB: winnerB,
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

  onMount(async () => {
    try {
      // Fetch teams from our server endpoint
      const response = await fetch('/api/bracket-teams');
      if (!response.ok) {
        throw new Error(`Error fetching teams: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      firstRoundTeams = data;
    } catch (err) {
      console.error('Error fetching bracket teams:', err);
      error = err.message;
    }
  });
</script>

<div class="max-w-7xl mx-auto px-4 py-8">

  {#if loading}
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
              <option value={entry.id}>
                {entry.first_name} {entry.last_name}
              </option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Bracket View -->
      {#if selectedEntrantId && firstRoundTeams.length > 0}
        <div class="p-6">
          <BracketView
            mode="view"
            bracketData={transformBracketData(selectedBracket)}
            isLocked={true}
            showScores={true}
            highlightWinners={true}
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