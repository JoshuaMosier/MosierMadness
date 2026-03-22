<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import FullStandingsTab from '$lib/components/scenarios/FullStandingsTab.svelte';
  import GeneratedRootingGuideTab from '$lib/components/scenarios/GeneratedRootingGuideTab.svelte';
  import GeneratedTitleOddsTab from '$lib/components/scenarios/GeneratedTitleOddsTab.svelte';
  import type {
    GeneratedScenarioAnalysisMode,
    GeneratedScenarioArtifact,
    GeneratedScenarioEntry,
    GeneratedScenarioGamePreview,
  } from '$lib/types';

  export let artifact: GeneratedScenarioArtifact | null = null;

  let selectedTab = 'root';
  let displayMode = 'percent';
  let analysisMode: GeneratedScenarioAnalysisMode = 'weighted';
  let currentUserId: string | null = null;
  let currentUserEntryId: string | null = null;
  let selectedUser: string | null = null;
  let selectedPreviewGameValue = '';
  let selectedPreviewWinner: 'A' | 'B' | null = null;
  let entries: GeneratedScenarioEntry[] = [];
  let previewGames: GeneratedScenarioGamePreview[] = [];
  let selectedPreviewGameIndex: number | null = null;
  let selectedPreviewGame: GeneratedScenarioGamePreview | null = null;
  let previewModeActive = true;
  let selectedPreviewOutcome: GeneratedScenarioGamePreview['outcomeA'] | GeneratedScenarioGamePreview['outcomeB'] | null = null;
  let effectivePreviewOutcome: GeneratedScenarioGamePreview['outcomeA'] | GeneratedScenarioGamePreview['outcomeB'] | null = null;
  let showScenarioPreviewControls = false;
  let showStandingsModeControl = false;
  let showStandingsContext = false;
  let showScenarioToolbar = false;
  let supportsWeighted = false;
  let totalScenarios = 0;
  let activeEntries: GeneratedScenarioEntry[] = [];
  let positionProbabilities: {
    entryId: string;
    displayName: string;
    firstName: string;
    lastName: string;
    positions: Record<number, number>;
    positionProbabilities: Record<number, number>;
  }[] = [];
  let summaryLabel = 'Scenarios';
  let summaryValueText = '0';
  let liveTitleEntries = 0;

  function getDisplayName(entry: GeneratedScenarioEntry): string {
    return entry.displayName || `${entry.firstName ?? ''} ${entry.lastName ?? ''}`.trim() || entry.entryId;
  }

  function hasWeightedPlaceData(entry: GeneratedScenarioEntry): boolean {
    return Array.isArray(entry.weightedPlacePcts) && entry.weightedPlacePcts.length === entry.placeCounts.length;
  }

  function getActiveEntries(
    sourceEntries: GeneratedScenarioEntry[],
    scenarioTotal: number,
    mode: GeneratedScenarioAnalysisMode,
  ) {
    const positionProbabilities = sourceEntries.map((entry) => {
      const positions: Record<number, number> = {};
      const positionPercentages: Record<number, number> = {};
      entry.placeCounts.forEach((count, index) => {
        const position = index + 1;
        const weightedPct = entry.weightedPlacePcts?.[index] ?? 0;
        if (mode === 'weighted' && hasWeightedPlaceData(entry)) {
          positions[position] = weightedPct;
          positionPercentages[position] = weightedPct;
          return;
        }

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

  function resetPreview() {
    selectedPreviewGameValue = '';
    selectedPreviewWinner = null;
  }

  function selectPreviewWinner(branch: 'A' | 'B') {
    selectedPreviewWinner = selectedPreviewWinner === branch ? null : branch;
  }

  function getAnalysisModeNote(mode: GeneratedScenarioAnalysisMode): string {
    return mode === 'weighted'
      ? 'More likely outcomes count more.'
      : 'Every remaining path counts the same.';
  }

  $: entries = artifact?.entries ?? [];
  $: previewGames = artifact?.previewGames ?? [];
  $: if (selectedTab === 'root' && previewGames.length === 0) {
    selectedTab = 'title-odds';
  }
  $: selectedPreviewGameIndex = selectedPreviewGameValue === '' ? null : Number(selectedPreviewGameValue);
  $: selectedPreviewGame = previewGames.find((game) => game.gameIndex === selectedPreviewGameIndex) ?? null;
  $: previewModeActive = selectedTab !== 'root';
  $: showStandingsContext = selectedTab === 'standings';
  $: showScenarioPreviewControls = previewGames.length > 0 && (selectedTab === 'title-odds' || selectedTab === 'standings');
  $: showStandingsModeControl = supportsWeighted && showStandingsContext;
  $: showScenarioToolbar = showScenarioPreviewControls || selectedTab === 'title-odds' || showStandingsModeControl;
  $: selectedPreviewOutcome = selectedPreviewGame && selectedPreviewWinner
    ? selectedPreviewWinner === 'A'
      ? selectedPreviewGame.outcomeA
      : selectedPreviewGame.outcomeB
    : null;
  $: effectivePreviewOutcome = previewModeActive ? selectedPreviewOutcome : null;
  $: supportsWeighted = Boolean(artifact?.weighting) && entries.every((entry) => hasWeightedPlaceData(entry));
  $: if (!supportsWeighted && analysisMode === 'weighted') {
    analysisMode = 'exact';
  }
  $: if (analysisMode === 'weighted' && displayMode !== 'percent') {
    displayMode = 'percent';
  }
  $: totalScenarios = effectivePreviewOutcome?.totalScenarios ?? artifact?.totalScenarios ?? 0;
  $: activeEntries = effectivePreviewOutcome?.entries ?? entries;
  $: liveTitleEntries = activeEntries.filter((entry) => entry.firstPlacePct > 0 || (entry.weightedFirstPlacePct ?? 0) > 0).length;
  $: ({ positionProbabilities } = getActiveEntries(activeEntries, totalScenarios, analysisMode));
  $: summaryLabel = selectedTab === 'title-odds'
    ? 'Live Brackets'
    : analysisMode === 'weighted'
      ? 'Weighted Model'
      : 'Scenarios';
  $: summaryValueText = selectedTab === 'title-odds'
    ? liveTitleEntries.toLocaleString()
    : totalScenarios.toLocaleString();
  $: if (currentUserId) {
    const ownEntry = entries.find((entry) => entry.userId === currentUserId) ?? null;
    currentUserEntryId = ownEntry?.entryId ?? null;

    if (ownEntry && !selectedUser) {
      selectedUser = ownEntry.entryId;
    }
  } else {
    currentUserEntryId = null;
  }

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;
  });
</script>

<div class="generated-scenarios mm-shell">
  <div class="generated-scenarios-header">
    <div class="generated-scenarios-header-row">
      <div class="generated-scenarios-copy">
        <h2 class="generated-scenarios-title mm-page-title">Tournament Outcome Probabilities</h2>
        <div class="generated-scenarios-subtitle">
          <div class="generated-scenarios-subtitle-line">
            <span class="generated-scenarios-subtitle-label">Rooting Guide</span>
            <span class="generated-scenarios-subtitle-text">See which result to root for in each live game to help a specific bracket the most.</span>
          </div>
          <div class="generated-scenarios-subtitle-line">
            <span class="generated-scenarios-subtitle-label">Title Odds</span>
            <span class="generated-scenarios-subtitle-text">See who can still win your pool, and how realistic each bracket’s title chance really is.</span>
          </div>
          <div class="generated-scenarios-subtitle-line">
            <span class="generated-scenarios-subtitle-label">Standings</span>
            <span class="generated-scenarios-subtitle-text">See where every bracket can still finish if you want the full picture, not just who can win.</span>
          </div>
        </div>
      </div>

      <div class="generated-scenarios-summary mm-control-shell">
        <div class="generated-scenarios-summary-label mm-compact-eyebrow">{summaryLabel}</div>
        <div class="generated-scenarios-summary-value">{summaryValueText}</div>
      </div>
    </div>
  </div>

  <div class="generated-scenarios-body">
    <div class="generated-scenarios-tabs mm-tab-row">
      {#if previewGames.length > 0}
        <button
          class={`generated-scenarios-tab mm-tab ${selectedTab === 'root' ? 'is-active' : ''}`}
          on:click={() => selectedTab = 'root'}
        >
          Rooting Guide
        </button>
      {/if}
      <button
        class={`generated-scenarios-tab mm-tab ${selectedTab === 'standings' ? 'is-active' : ''}`}
        on:click={() => selectedTab = 'standings'}
      >
        Standings
      </button>
      <button
        class={`generated-scenarios-tab mm-tab ${selectedTab === 'title-odds' ? 'is-active' : ''}`}
        on:click={() => selectedTab = 'title-odds'}
      >
        Title Odds
      </button>
    </div>

    {#if showScenarioToolbar}
      <div class="generated-scenarios-standings-toolbar mm-control-shell">
        <div class="generated-scenarios-standings-toolbar-row mm-control-row">
          {#if showScenarioPreviewControls}
            <label for="generatedPreviewSelect" class="generated-scenarios-preview-kicker mm-compact-eyebrow">
              Single-Game Preview
            </label>

            <select
              id="generatedPreviewSelect"
              class="generated-scenarios-select mm-select"
              bind:value={selectedPreviewGameValue}
              on:change={() => selectedPreviewWinner = null}
            >
              <option value="">Choose game...</option>
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
                  Pick a winner to preview that branch.
                </div>
              {/if}
            </div>
          {/if}

          {#if selectedTab === 'title-odds'}
            <div class="generated-scenarios-mode is-placeholder" aria-hidden="true">
              <div class="generated-scenarios-mode-copy">
                <div class="generated-scenarios-mode-kicker mm-compact-eyebrow">Analysis Mode</div>
                <div class="generated-scenarios-mode-note">More likely outcomes count more.</div>
              </div>

              <div class="generated-scenarios-mode-toggle">
                <button class="generated-scenarios-mode-button mm-toggle-button">Exact</button>
                <button class="generated-scenarios-mode-button mm-toggle-button">Weighted</button>
              </div>
            </div>
          {:else if showStandingsModeControl}
            <div class="generated-scenarios-mode">
              <div class="generated-scenarios-mode-copy">
                <div class="generated-scenarios-mode-kicker mm-compact-eyebrow">Analysis Mode</div>
                <div class="generated-scenarios-mode-note">{getAnalysisModeNote(analysisMode)}</div>
              </div>

              <div class="generated-scenarios-mode-toggle">
                <button
                  class={`generated-scenarios-mode-button mm-toggle-button ${analysisMode === 'exact' ? 'is-active' : ''}`}
                  on:click={() => analysisMode = 'exact'}
                >
                  Exact
                </button>
                <button
                  class={`generated-scenarios-mode-button mm-toggle-button ${analysisMode === 'weighted' ? 'is-active' : ''}`}
                  on:click={() => analysisMode = 'weighted'}
                >
                  Weighted
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if selectedTab === 'title-odds'}
      {#key `title-odds:${selectedPreviewGameValue}:${selectedPreviewWinner ?? 'none'}`}
        <GeneratedTitleOddsTab
          entries={activeEntries}
          {currentUserEntryId}
        />
      {/key}
    {:else if selectedTab === 'standings'}
      {#key `standings:${analysisMode}:${selectedPreviewGameValue}:${selectedPreviewWinner ?? 'none'}`}
        <FullStandingsTab
          {positionProbabilities}
          numEntries={activeEntries.length}
          bind:displayMode
          {currentUserEntryId}
          allowCountDisplay={analysisMode === 'exact'}
          matrixLabel={analysisMode === 'exact' ? 'Exact Matrix' : 'Probability Matrix'}
        />
      {/key}
    {:else}
      {#key `rooting:${analysisMode}`}
        <GeneratedRootingGuideTab
          entries={entries}
          {previewGames}
          {currentUserId}
          bind:analysisMode
          {supportsWeighted}
          bind:selectedUser
        />
      {/key}
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
    gap: 1.1rem;
  }

  .generated-scenarios-copy {
    min-width: 0;
    flex: 1 1 42rem;
  }

  .generated-scenarios-title {
    font-size: clamp(1.7rem, 3.2vw, 2.25rem);
    line-height: 1.04;
  }

  .generated-scenarios-subtitle {
    max-width: 56rem;
    display: grid;
    gap: 0.32rem;
    margin-top: 0.45rem;
  }

  .generated-scenarios-subtitle-line {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    color: var(--mm-muted);
    font-size: 0.92rem;
    line-height: 1.4;
  }

  .generated-scenarios-subtitle-label {
    color: var(--mm-text);
    font-weight: 700;
    white-space: nowrap;
  }

  .generated-scenarios-subtitle-text {
    flex: 1 1 28rem;
  }

  .generated-scenarios-summary {
    min-width: 12.5rem;
    max-width: 13.5rem;
    flex: 0 0 13.5rem;
  }

  .generated-scenarios-summary-label {
    display: block;
  }

  .generated-scenarios-summary-value {
    margin-top: 0.5rem;
    color: var(--mm-text);
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1;
  }

  .generated-scenarios-body {
    padding: 1.3rem 1.5rem 1.5rem;
  }

  .generated-scenarios-tabs {
    margin-bottom: 1rem;
  }

  .generated-scenarios-standings-toolbar {
    margin-bottom: 1rem;
  }

  .generated-scenarios-standings-toolbar-row {
    align-items: center;
  }

  .generated-scenarios-preview-kicker {
    display: block;
  }

  .generated-scenarios-mode {
    display: grid;
    gap: 0.35rem;
    min-width: 17rem;
    margin-left: auto;
  }

  .generated-scenarios-mode.is-placeholder {
    visibility: hidden;
    pointer-events: none;
  }

  .generated-scenarios-mode-copy {
    min-width: 0;
  }

  .generated-scenarios-mode-kicker {
    display: block;
  }

  .generated-scenarios-mode-note {
    margin-top: 0.25rem;
    color: var(--mm-muted);
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .generated-scenarios-mode-toggle {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .generated-scenarios-select {
    min-width: 16rem;
    flex: 1 1 20rem;
  }

  .generated-scenarios-preview-actions {
    display: flex;
    align-items: center;
    min-height: 2.5rem;
    min-width: 14rem;
    flex: 1 1 18rem;
  }

  .generated-scenarios-preview-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .generated-scenarios-preview-placeholder {
    display: flex;
    align-items: center;
    color: var(--mm-subtle);
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .generated-scenarios-preview-button {
    min-width: 0;
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

    .generated-scenarios-standings-toolbar-row {
      align-items: stretch;
    }

    .generated-scenarios-preview-actions,
    .generated-scenarios-mode,
    .generated-scenarios-select {
      min-width: 0;
      width: 100%;
      flex-basis: 100%;
    }

    .generated-scenarios-mode {
      margin-left: 0;
      gap: 0.35rem;
    }

    .generated-scenarios-mode-toggle {
      width: 100%;
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

    .generated-scenarios-preview-actions,
    .generated-scenarios-preview-placeholder {
      justify-content: flex-start;
    }
  }
</style>
