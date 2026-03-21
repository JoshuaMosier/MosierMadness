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
        <h2 class="generated-scenarios-title">Tournament Outcome Probabilities</h2>
        <p class="generated-scenarios-subtitle">
          Use Standings for title odds, finish ranges, and the full matrix view, and Rooting Guide to see which currently known outcomes help a bracket most.
        </p>
      </div>

      <div class="generated-scenarios-summary">
        <div class="generated-scenarios-summary-label">Scenarios</div>
        <div class="generated-scenarios-summary-value">{totalScenarios.toLocaleString()}</div>
      </div>
    </div>
  </div>

  <div class="generated-scenarios-body">
    <div class="generated-scenarios-tabs">
      <button
        class={`generated-scenarios-tab ${selectedTab === 'standings' ? 'is-active' : ''}`}
        on:click={() => selectedTab = 'standings'}
      >
        Standings
      </button>
      {#if previewGames.length > 0}
        <button
          class={`generated-scenarios-tab ${selectedTab === 'root' ? 'is-active' : ''}`}
          on:click={() => selectedTab = 'root'}
        >
          Rooting Guide
        </button>
      {/if}
    </div>

    {#if previewGames.length > 0 && selectedTab !== 'root'}
      <div class="generated-scenarios-preview">
        <div class="generated-scenarios-preview-row">
          <div class="generated-scenarios-preview-kicker">Single-Game Preview</div>

          <select
            class="generated-scenarios-select"
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
                  class={`generated-scenarios-preview-button ${selectedPreviewWinner === 'A' ? 'is-active' : ''}`}
                  on:click={() => selectPreviewWinner('A')}
                >
                  {selectedPreviewGame.teamA.seed} {selectedPreviewGame.teamA.name}
                </button>
                <button
                  class={`generated-scenarios-preview-button ${selectedPreviewWinner === 'B' ? 'is-active' : ''}`}
                  on:click={() => selectPreviewWinner('B')}
                >
                  {selectedPreviewGame.teamB.seed} {selectedPreviewGame.teamB.name}
                </button>
                <button
                  class="generated-scenarios-preview-button is-reset"
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
        {totalScenarios}
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
    margin: 0;
    color: var(--mm-text);
    font-size: clamp(1.7rem, 3.2vw, 2.25rem);
    font-weight: 700;
    line-height: 1.04;
  }

  .generated-scenarios-subtitle {
    margin: 0.5rem 0 0;
    max-width: 44rem;
    color: var(--mm-muted);
    font-size: 0.94rem;
  }

  .generated-scenarios-summary {
    min-width: 16rem;
    padding: 0.95rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(9, 9, 10, 0.6);
  }

  .generated-scenarios-summary-label {
    color: var(--mm-subtle);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
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
    display: flex;
    gap: 0.55rem;
    margin-bottom: 1rem;
    overflow-x: auto;
  }

  .generated-scenarios-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.35rem;
    padding: 0.45rem 0.95rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.03);
    color: var(--mm-muted);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
  }

  .generated-scenarios-tab:hover {
    color: var(--mm-text);
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.05);
  }

  .generated-scenarios-tab.is-active {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(245, 158, 11, 0.08);
  }

  .generated-scenarios-preview {
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(12, 12, 13, 0.72);
  }

  .generated-scenarios-preview-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .generated-scenarios-preview-kicker {
    flex: 0 0 auto;
    color: var(--mm-subtle);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .generated-scenarios-select {
    min-width: 18rem;
    flex: 1 1 22rem;
    min-height: 2.65rem;
    padding: 0.62rem 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.9rem;
    background: rgba(17, 17, 18, 0.92);
    color: var(--mm-text);
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
    min-height: 2.2rem;
    padding: 0.45rem 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.9rem;
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 600;
    transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
  }

  .generated-scenarios-preview-button:hover {
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.06);
  }

  .generated-scenarios-preview-button.is-active {
    border-color: rgba(245, 158, 11, 0.34);
    background: rgba(245, 158, 11, 0.14);
    color: #fbbf24;
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

    .generated-scenarios-tabs {
      flex-direction: column;
      overflow: visible;
    }

    .generated-scenarios-tab {
      width: 100%;
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
