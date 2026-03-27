<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import FullStandingsTab from '$lib/components/scenarios/FullStandingsTab.svelte';
  import GeneratedRootingGuideTab from '$lib/components/scenarios/GeneratedRootingGuideTab.svelte';
  import GeneratedTitleOddsTab from '$lib/components/scenarios/GeneratedTitleOddsTab.svelte';
  import ExactTitleOddsTab from '$lib/components/scenarios/ExactTitleOddsTab.svelte';
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
  let selectedUserValue = '';
  let entries: GeneratedScenarioEntry[] = [];
  let previewGames: GeneratedScenarioGamePreview[] = [];
  let supportsWeighted = false;
  let totalScenarios = 0;
  let activeEntries: GeneratedScenarioEntry[] = [];
  let titleOddsEntries: Array<{
    entryId: string;
    displayName: string;
    firstPlacePct: number;
    firstPlaceCount: number;
  }> = [];
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

  $: entries = artifact?.entries ?? [];
  $: previewGames = artifact?.previewGames ?? [];
  $: if (selectedTab === 'root' && previewGames.length === 0) {
    selectedTab = 'title-odds';
  }
  $: supportsWeighted = Boolean(artifact?.weighting) && entries.every((entry) => hasWeightedPlaceData(entry));
  $: sortedEntries = [...entries].sort((left, right) => {
    return getDisplayName(left).toLowerCase().localeCompare(getDisplayName(right).toLowerCase());
  });
  $: selectedUserValue = selectedUser ?? '';
  $: if (!supportsWeighted && analysisMode === 'weighted') {
    analysisMode = 'exact';
  }
  $: if (analysisMode === 'weighted' && displayMode !== 'percent') {
    displayMode = 'percent';
  }
  $: totalScenarios = artifact?.totalScenarios ?? 0;
  $: activeEntries = entries;
  $: liveTitleEntries = activeEntries.filter((entry) => entry.firstPlacePct > 0 || (entry.weightedFirstPlacePct ?? 0) > 0).length;
  $: titleOddsEntries = activeEntries.map((entry) => ({
    entryId: entry.entryId,
    displayName: getDisplayName(entry),
    firstPlacePct: totalScenarios > 0 ? (entry.firstPlaceCount / totalScenarios) * 100 : 0,
    firstPlaceCount: entry.firstPlaceCount,
  }));
  $: ({ positionProbabilities } = getActiveEntries(activeEntries, totalScenarios, analysisMode));
  $: summaryLabel = selectedTab === 'title-odds'
    ? 'Live Brackets'
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
            <span class="generated-scenarios-subtitle-text">See who can still win your pool, and how realistic each bracket's title chance really is.</span>
          </div>
          <div class="generated-scenarios-subtitle-line">
            <span class="generated-scenarios-subtitle-label">Standings</span>
            <span class="generated-scenarios-subtitle-text">See where every bracket can still finish if you want the full picture, not just who can win.</span>
          </div>
        </div>
      </div>

      <div class="generated-scenarios-header-controls">
        <div class="generated-scenarios-summary mm-control-shell">
          <div class="generated-scenarios-summary-label mm-compact-eyebrow">{summaryLabel}</div>
          <div class="generated-scenarios-summary-value">{summaryValueText}</div>
        </div>

        {#if supportsWeighted}
          <div class="generated-scenarios-mode mm-control-shell">
            <div class="generated-scenarios-mode-kicker mm-compact-eyebrow">Analysis Mode</div>
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
  </div>

  <div class="generated-scenarios-body">
    <div class="generated-scenarios-nav">
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

      {#if entries.length > 0}
        <div class="generated-scenarios-focus" class:is-hidden={selectedTab !== 'root'}>
          <label for="scenariosBracketFocus" class="generated-scenarios-focus-label mm-compact-eyebrow">
            {#if currentUserId && entries.find((e) => e.entryId === selectedUser)?.userId === currentUserId}
              Your Bracket
            {:else}
              Bracket Focus
            {/if}
          </label>
          <select
            id="scenariosBracketFocus"
            class="generated-scenarios-focus-select mm-select"
            bind:value={selectedUserValue}
            on:change={() => selectedUser = selectedUserValue || null}
          >
            <option value="" disabled selected={!selectedUser}>Select a bracket...</option>
            {#each sortedEntries as entry}
              <option value={entry.entryId}>
                {getDisplayName(entry)}{entry.userId === currentUserId ? ' (You)' : ''}
              </option>
            {/each}
          </select>
        </div>
      {/if}
    </div>

    {#if selectedTab !== 'root'}
      <slot name="post-toolbar" />
    {/if}

    {#if selectedTab === 'title-odds'}
      {#key `title-odds:${analysisMode}`}
        {#if analysisMode === 'weighted' && supportsWeighted}
          <GeneratedTitleOddsTab
            entries={activeEntries}
            {currentUserEntryId}
          />
        {:else}
          <ExactTitleOddsTab
            entries={titleOddsEntries}
            {totalScenarios}
            {currentUserEntryId}
            analysisLabel="Exact scenario tree"
          />
        {/if}
      {/key}
    {:else if selectedTab === 'standings'}
      {#key `standings:${analysisMode}`}
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
        >
          <slot name="rooting-post-toolbar" slot="post-focus-controls" />
        </GeneratedRootingGuideTab>
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

  .generated-scenarios-header-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .generated-scenarios-summary {
    min-width: 0;
    flex: 0 0 auto;
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

  .generated-scenarios-mode {
    display: grid;
    gap: 0.3rem;
    min-width: 0;
    flex: 0 0 auto;
  }

  .generated-scenarios-mode-kicker {
    display: block;
  }

  .generated-scenarios-mode-toggle {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .generated-scenarios-body {
    padding: 1.3rem 1.5rem 1.5rem;
  }

  .generated-scenarios-nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .generated-scenarios-tabs {
    margin-bottom: 0;
  }

  .generated-scenarios-focus {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin-left: auto;
  }

  .generated-scenarios-focus.is-hidden {
    visibility: hidden;
    pointer-events: none;
  }

  .generated-scenarios-focus-label {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .generated-scenarios-focus-select {
    min-width: 14rem;
    max-width: 22rem;
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

    .generated-scenarios-header-controls {
      width: 100%;
    }

    .generated-scenarios-summary {
      flex: 1 1 auto;
      padding: 0.85rem 0.9rem;
    }

    .generated-scenarios-summary-value {
      margin-top: 0.35rem;
      font-size: 1.55rem;
    }

    .generated-scenarios-mode {
      flex: 1 1 auto;
      padding: 0.85rem 0.9rem;
    }

    .generated-scenarios-mode-toggle {
      width: 100%;
    }

    .generated-scenarios-nav {
      flex-direction: column;
      align-items: stretch;
    }

    .generated-scenarios-focus {
      margin-left: 0;
    }

    .generated-scenarios-focus-label {
      display: none;
    }

    .generated-scenarios-focus-select {
      min-width: 0;
      max-width: none;
      width: 100%;
    }
  }
</style>
