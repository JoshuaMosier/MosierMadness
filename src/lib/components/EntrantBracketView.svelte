<script lang="ts">
  import { fade } from 'svelte/transition';
  import { FADE_CONTENT } from '$lib/constants/transitions';
  import BracketView from './BracketView.svelte';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  export let entries: any[] = [];
  export let selectedEntrantId: string = '';
  export let selectedBracketData: any = null;
  let user: any = null;
  
  // Helper function to find entry by name
  function findEntryByName(firstName: string, lastName: string): any {
    return entries.find(e => 
      e.first_name.toLowerCase() === firstName.toLowerCase() && 
      e.last_name.toLowerCase() === lastName.toLowerCase()
    );
  }
  
  $: selectedEntrant = entries.find(e => e.id === selectedEntrantId);
  $: sortedEntries = entries
    .filter(entry => entry.brackets[0]?.is_submitted)
    .sort((a, b) => a.first_name.localeCompare(b.first_name));


  onMount(async () => {
    try {
      // Get the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user = currentUser;
      
      if (!selectedEntrantId && user && entries.length > 0) {
        const userEntry = entries.find(e => e.email === user.email);
        if (userEntry) {
          goto(`/entries?selected=${userEntry.first_name}|${userEntry.last_name}`);
        }
      }
    } catch (err) {
      console.error('Error in component initialization:', err);
    }
  });

  function handleEntrantChange(event: Event): void {
    const nextEntryId = (event.currentTarget as HTMLSelectElement).value;
    const entry = entries.find(candidate => candidate.id === nextEntryId);
    if (!entry) {
      return;
    }

    goto(`/entries?selected=${entry.first_name}|${entry.last_name}`);
  }
</script>

<div class="max-w-7xl mx-auto px-4 py-8">

  <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
       in:fade={FADE_CONTENT}>
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
          value={selectedEntrantId}
          class="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          on:change={handleEntrantChange}
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
    {#if selectedEntrantId && selectedBracketData}
      <div class="p-6">
        <BracketView
          mode="view"
          bracketData={selectedBracketData}
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
</div> 