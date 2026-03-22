<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import FullStandingsTab from '$lib/components/scenarios/FullStandingsTab.svelte';
  import GeneratedRootingGuideTab from '$lib/components/scenarios/GeneratedRootingGuideTab.svelte';
  import type { GeneratedScenarioArtifact, GeneratedScenarioEntry, GeneratedScenarioGamePreview } from '$lib/types';

  export let artifact: GeneratedScenarioArtifact | null = null;

  let selectedTab = 'standings';
  let displayMode = 'percent';
  let currentUserId: string | null = null;
  let currentUserEntryId: string | null = null;
  let selectedUser: string | null = null;
  let selectedPreviewGameValue = '';
  let selectedPreviewWinner: 'A' | 'B' | null = null;

  function getDisplayName(entry: GeneratedScenarioEntry): string {
    return entry.displayName || `${entry.firstName ?? ''} ${entry.lastName ?? ''}`.trim() || entry.entryId;
  }

  function getActiveEntries(sourceEntries: GeneratedScenarioEntry[], scenarioTotal: number) {
    const positionProbabilities = sourceEntries.map((entry) => {
      const positions: Record<number, number> = {};
      const positionPercentages: Record<number, number> = {};
      entry.placeCounts.forEach((count, index) => {
        const position = index + 1;
        positions[position] = count;
        positionPercentages[position] = scenarioTotal > 0 ? (count / scenarioTotal) * 100 : 0;
      });
      return {
        entryId: entry.entryId,
        displayName: getDisplayName(entry),
        firstName: entry.firstName ?? '',
        lastName: entry.lastName ?? '',
        positions,
        positionProbabilities: positionPercentages,
      };
    });

    return { positionProbabilities };
  }

  function getPreviewLabel(game: GeneratedScenarioGamePreview | null, winner: 'A' | 'B' | null): string | null {
    if (!game || !winner) {
      return null;
    }

    const team = winner === 'A' ? game.teamA : game.teamB;
    return `${team.seed} ${team.name} wins ${game.roundLabel}`;
  }

  function resetPreview() {
    selectedPreviewGameValue = '';
    selectedPreviewWinner = null;
  }

  function selectPreviewWinner(branch: 'A' | 'B') {
    selectedPreviewWinner = selectedPreviewWinner === branch ? null : branch;
  }

  $: entries = artifact?.entries ?? [];
  $: previewGames = artifact?.previewGames ?? [];
  $: selectedPreviewGameIndex = selectedPreviewGameValue === '' ? null : Number(selectedPreviewGameValue);
  $: selectedPreviewGame = previewGames.find((game) => game.gameIndex === selectedPreviewGameIndex) ?? null;
  $: previewModeActive = selectedTab !== 'root';
  $: selectedPreviewOutcome = selectedPreviewGame && selectedPreviewWinner
    ? selectedPreviewWinner === 'A'
      ? selectedPreviewGame.outcomeA
      : selectedPreviewGame.outcomeB
    : null;
  $: effectivePreviewOutcome = previewModeActive ? selectedPreviewOutcome : null;
  $: totalScenarios = effectivePreviewOutcome?.totalScenarios ?? artifact?.totalScenarios ?? 0;
  $: activeEntries = effectivePreviewOutcome?.entries ?? entries;
  $: ({ positionProbabilities } = getActiveEntries(activeEntries, totalScenarios));

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;

    if (!currentUserId) {
      return;
    }

    const ownEntry = entries.find((entry) => entry.userId === currentUserId);
    if (ownEntry) {
      currentUserEntryId = ownEntry.entryId;
      selectedUser = ownEntry.entryId;
      if (previewGames.length > 0) {
        selectedTab = 'root';
      }
    }
  });
</script>

<div class="generated-scenarios mm-shell">
  <div class="generated-scenarios-header">
    <div class="generated-scenarios-header-row">
      <div class="generated-scenarios-copy">
        <h2 class="generated-scenarios-title mm-page-title">Tournament Outcome Probabilities</h2>
        <p class="generated-scenarios-subtitle mm-page-subtitle">
          Use Standings for title odds, finish ranges, and the full matrix view, and Rooting Guide to see which currently known outcomes help a bracket most. Rooting recommendations are based on the best remaining pool outcome, so they may not match the team originally picked.
        </p>
      </div>

      <div class="generated-scenarios-summary mm-control-shell">
        <div class="generated-scenarios-summary-label mm-compact-eyebrow">Scenarios</div>
        <div class="generated-scenarios-summary-value">{totalScenarios.toLocaleString()}</div>
      </div>
    </div>
  </div>

  <div class="generated-scenarios-body">
    <div class="generated-scenarios-tabs mm-tab-row">
      <button
        class={`generated-scenarios-tab mm-tab ${selectedTab === 'standings' ? 'is-active' : ''}`}
        on:click={() => selectedTab = 'standings'}
      >
        Standings
      </button>
      {#if previewGames.length > 0}
        <button
          class={`generated-scenarios-tab mm-tab ${selectedTab === 'root' ? 'is-active' : ''}`}
          on:click={() => selectedTab = 'root'}
        >
          Rooting Guide
        </button>
      {/if}
    </div>

    {#if previewGames.length > 0 && selectedTab !== 'root'}
      <div class="generated-scenarios-preview mm-control-shell">
        <div class="generated-scenarios-preview-row mm-control-row">
          <div class="generated-scenarios-preview-kicker mm-compact-eyebrow">Single-Game Preview</div>

          <select
            class="generated-scenarios-select mm-select"
            bind:value={selectedPreviewGameValue}
            on:change={() => selectedPreviewWinner = null}
          >
            <option value="">Choose a game to preview...</option>
            {#each previewGames as game}
              <option value={String(game.gameIndex)}>
                {game.roundLabel}: {game.teamA.seed} {game.teamA.name} vs {game.teamB.seed} {game.teamB.name}
              </option>
            {/each}
          </select>

          <div class="generated-scenarios-preview-actions">
            {#if selectedPreviewGame}
              <div class="generated-scenarios-preview-buttons">
                <button
                  class={`generated-scenarios-preview-button mm-chip-button ${selectedPreviewWinner === 'A' ? 'is-active' : ''}`}
                  on:click={() => selectPreviewWinner('A')}
                >
                  {selectedPreviewGame.teamA.seed} {selectedPreviewGame.teamA.name}
                </button>
                <button
                  class={`generated-scenarios-preview-button mm-chip-button ${selectedPreviewWinner === 'B' ? 'is-active' : ''}`}
                  on:click={() => selectPreviewWinner('B')}
                >
                  {selectedPreviewGame.teamB.seed} {selectedPreviewGame.teamB.name}
                </button>
                <button
                  class="generated-scenarios-preview-button mm-chip-button is-reset"
                  on:click={resetPreview}
                >
                  Reset
                </button>
              </div>
            {:else}
              <div class="generated-scenarios-preview-placeholder">
                Pick a winner to preview
              </div>
            {/if}
          </div>
        </div>

      </div>
    {/if}

    {#if selectedTab === 'standings'}
      <FullStandingsTab
        {positionProbabilities}
        numEntries={activeEntries.length}
        bind:displayMode
        {currentUserEntryId}
      />
    {:else}
      <GeneratedRootingGuideTab
        entries={entries}
        {previewGames}
        {currentUserId}
        bind:selectedUser
      />
    {/if}
  </div>
</div>

<style>
  .generated-scenarios {
    overflow: hidden;
    background: rgba(10, 10, 11, 0.96);
  }

  .generated-scenarios-header {
    padding: 1.5rem 1.5rem 1.15rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(14, 14, 15, 0.92);
  }

  .generated-scenarios-header-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .generated-scenarios-copy {
    min-width: 0;
    flex: 1 1 34rem;
  }

  .generated-scenarios-title {
    font-size: clamp(1.7rem, 3.2vw, 2.25rem);
    line-height: 1.04;
  }

  .generated-scenarios-subtitle {
    max-width: 44rem;
    font-size: 0.94rem;
  }

  .generated-scenarios-summary {
    min-width: 16rem;
  }

  .generated-scenarios-summary-label {
    display: block;
  }

  .generated-scenarios-summary-value {
    margin-top: 0.5rem;
    color: var(--mm-text);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
  }

  .generated-scenarios-body {
    padding: 1.3rem 1.5rem 1.5rem;
  }

  .generated-scenarios-tabs {
    margin-bottom: 1rem;
  }

  .generated-scenarios-preview {
    margin-bottom: 1rem;
  }

  .generated-scenarios-preview-row {
    align-items: center;
  }

  .generated-scenarios-select {
    min-width: 18rem;
    flex: 1 1 22rem;
  }

  .generated-scenarios-preview-actions {
    display: flex;
    flex: 1 1 24rem;
    justify-content: flex-end;
    min-width: 16rem;
  }

  .generated-scenarios-preview-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    justify-content: flex-end;
  }

  .generated-scenarios-preview-placeholder {
    color: var(--mm-subtle);
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .generated-scenarios-preview-button {
    text-align: center;
  }

  .generated-scenarios-preview-button.is-reset {
    color: var(--mm-muted);
  }

  @media (max-width: 767px) {
    .generated-scenarios-header,
    .generated-scenarios-body {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .generated-scenarios-subtitle {
      display: none;
    }

    .generated-scenarios-title {
      font-size: 1.55rem;
    }

    .generated-scenarios-summary {
      min-width: 0;
      width: 100%;
      padding: 0.85rem 0.9rem;
    }

    .generated-scenarios-summary-value {
      margin-top: 0.35rem;
      font-size: 1.55rem;
    }

    .generated-scenarios-preview {
      padding: 0.9rem;
    }

    .generated-scenarios-preview-kicker {
      display: none;
    }

    .generated-scenarios-preview-row {
      align-items: stretch;
    }

    .generated-scenarios-select,
    .generated-scenarios-preview-actions {
      min-width: 0;
      width: 100%;
      flex-basis: 100%;
    }

    .generated-scenarios-preview-actions,
    .generated-scenarios-preview-buttons {
      justify-content: flex-start;
    }

    .generated-scenarios-preview-buttons {
      width: 100%;
    }

    .generated-scenarios-preview-button {
      flex: 1 1 calc(50% - 0.3rem);
      justify-content: center;
      text-align: center;
    }

    .generated-scenarios-preview-button.is-reset {
      flex-basis: 100%;
    }

    .generated-scenarios-preview-placeholder {
      display: none;
    }
  }
</style>
