<script lang="ts">
  import { fade } from 'svelte/transition';
  import { FADE_CONTENT } from '$lib/constants/transitions';
  import BracketFrame from './BracketFrame.svelte';
  import BracketView from './BracketView.svelte';
  import { goto } from '$app/navigation';

  export let entries: any[] = [];
  export let selectedEntrantId: string = '';
  export let selectedBracketData: any = null;

  $: sortedEntries = entries
    .filter(entry => entry.brackets[0]?.is_submitted)
    .sort((a, b) => a.first_name.localeCompare(b.first_name));

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
  {#if selectedEntrantId && selectedBracketData}
    <div class="bracket-toolbar bracket-toolbar--mobile" in:fade={FADE_CONTENT}>
      <div class="bracket-toolbar__meta">
        <label for="entrant-select-mobile" class="bracket-toolbar__label">
          Select an entrant
        </label>
        <div class="bracket-toolbar__count">{sortedEntries.length} submitted</div>
      </div>

      <select
        id="entrant-select-mobile"
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

    <BracketFrame>
      <BracketView
        mode="view"
        bracketData={selectedBracketData}
        isLocked={true}
        showScores={false}
      >
        <svelte:fragment slot="overlay">
          <div class="entrant-select-overlay">
            <label for="entrant-select" class="entrant-select-overlay__label">Select an entrant</label>
            <select
              id="entrant-select"
              value={selectedEntrantId}
              class="mm-select entrant-select-overlay__control"
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
        </svelte:fragment>
      </BracketView>
    </BracketFrame>
  {:else}
    <div in:fade={FADE_CONTENT} class="space-y-4">
      <div class="bracket-toolbar">
        <div class="bracket-toolbar__meta">
          <label for="entrant-select-empty" class="bracket-toolbar__label">
            Select an entrant
          </label>
          <div class="bracket-toolbar__count">{sortedEntries.length} submitted</div>
        </div>

        <select
          id="entrant-select-empty"
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

      <div class="mm-empty-state">
        Select an entrant above to view their bracket.
      </div>
    </div>
  {/if}
</div>

<style>
  .entrant-select-overlay {
    display: none;
    width: min(100%, 14.25rem);
    margin: 0 auto;
    text-align: left;
  }

  .entrant-select-overlay__label {
    display: block;
    margin-bottom: 0.35rem;
    color: rgba(229, 231, 235, 0.94);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    line-height: 1;
    text-align: center;
    text-transform: uppercase;
  }

  .entrant-select-overlay__control {
    width: 100%;
    min-height: 2.45rem;
    padding-top: 0.6rem;
    padding-bottom: 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: linear-gradient(180deg, rgba(38, 40, 46, 0.96) 0%, rgba(22, 24, 29, 0.98) 100%);
    color: #f3f4f6;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 10px 20px rgba(0, 0, 0, 0.22);
    --tw-ring-color: rgba(229, 231, 235, 0.18);
  }

  .bracket-toolbar {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-bottom: 1rem;
  }

  .bracket-toolbar--mobile {
    display: flex;
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
    .entrant-select-overlay {
      display: block;
    }

    .bracket-toolbar {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .bracket-toolbar--mobile {
      display: none;
    }

    .bracket-toolbar__meta {
      justify-content: flex-start;
    }

    .bracket-toolbar__select {
      width: min(100%, 24rem);
    }
  }
</style>
