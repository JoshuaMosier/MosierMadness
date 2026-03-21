<script lang="ts">
  import { fade } from 'svelte/transition';
  import { FADE_CONTENT } from '$lib/constants/transitions';
  import BracketFrame from './BracketFrame.svelte';
  import BracketView from './BracketView.svelte';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  export let entries: any[] = [];
  export let selectedEntrantId: string = '';
  export let selectedBracketData: any = null;
  let user: any = null;

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
    const entry = entries.find(candidate => candidate.id === nextEntryId || candidate.entryId === nextEntryId);
    if (!entry) {
      return;
    }

    goto(`/entries?selected=${entry.first_name}|${entry.last_name}`);
  }
</script>

<div class="mm-page">
  <div class="bracket-toolbar" in:fade={FADE_CONTENT}>
    <div class="bracket-toolbar__meta">
      <label for="entrant-select" class="bracket-toolbar__label">
        Select an entrant
      </label>
      <div class="bracket-toolbar__count">{sortedEntries.length} submitted</div>
    </div>

    <select
      id="entrant-select"
      value={selectedEntrantId}
      class="mm-select bracket-toolbar__select"
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

  {#if selectedEntrantId && selectedBracketData}
    <BracketFrame>
      <BracketView
        mode="view"
        bracketData={selectedBracketData}
        isLocked={true}
        showScores={false}
      />
    </BracketFrame>
  {:else}
    <div class="mm-empty-state" in:fade={FADE_CONTENT}>
      Select an entrant above to view their bracket.
    </div>
  {/if}
</div>

<style>
  .bracket-toolbar {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-bottom: 1rem;
  }

  .bracket-toolbar__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .bracket-toolbar__label {
    color: var(--mm-muted);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
  }

  .bracket-toolbar__count {
    padding: 0.42rem 0.78rem;
    border: 1px solid rgba(245, 158, 11, 0.18);
    border-radius: 999px;
    background: rgba(245, 158, 11, 0.09);
    color: #fcd34d;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    line-height: 1;
    text-transform: uppercase;
  }

  .bracket-toolbar__select {
    width: 100%;
  }

  @media (min-width: 768px) {
    .bracket-toolbar {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .bracket-toolbar__meta {
      justify-content: flex-start;
    }

    .bracket-toolbar__select {
      width: min(100%, 24rem);
    }
  }
</style>
