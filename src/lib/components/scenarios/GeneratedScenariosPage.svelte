<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import FullStandingsTab from '$lib/components/scenarios/FullStandingsTab.svelte';
  import GeneratedRootingGuideTab from '$lib/components/scenarios/GeneratedRootingGuideTab.svelte';
  import WinChancesTab from '$lib/components/scenarios/WinChancesTab.svelte';
  import type { GeneratedScenarioArtifact, GeneratedScenarioEntry, GeneratedScenarioGamePreview } from '$lib/types';

  export let artifact: GeneratedScenarioArtifact | null = null;

  let selectedTab = 'win';
  let displayMode = 'percent';
  let currentUserId: string | null = null;
  let selectedUser: string | null = null;
  let selectedPreviewGameValue = '';
  let selectedPreviewWinner: 'A' | 'B' | null = null;

  function getDisplayName(entry: GeneratedScenarioEntry): string {
    return entry.displayName || `${entry.firstName ?? ''} ${entry.lastName ?? ''}`.trim() || entry.entryId;
  }

  function getActiveEntries(sourceEntries: GeneratedScenarioEntry[], scenarioTotal: number) {
    const userWinCounts = sourceEntries
      .map((entry) => ({
        entryId: entry.entryId,
        displayName: getDisplayName(entry),
        firstName: entry.firstName ?? '',
        lastName: entry.lastName ?? '',
        winCount: entry.firstPlaceCount,
        winProbability: entry.firstPlacePct,
      }))
      .sort((left, right) => right.winProbability - left.winProbability);

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

    return { userWinCounts, positionProbabilities };
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
  $: activeSnapshotLabel = previewModeActive ? getPreviewLabel(selectedPreviewGame, selectedPreviewWinner) : null;
  $: ({ userWinCounts, positionProbabilities } = getActiveEntries(activeEntries, totalScenarios));

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;

    if (!currentUserId) {
      return;
    }

    const ownEntry = entries.find((entry) => entry.userId === currentUserId);
    if (ownEntry) {
      selectedUser = ownEntry.entryId;
      if (previewGames.length > 0) {
        selectedTab = 'root';
      }
    }
  });
</script>

<div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
  <div class="border-b border-zinc-800 bg-zinc-900/50">
    <div class="p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-amber-700/50 bg-amber-900/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-400">
            Generated Snapshot
          </div>
          <h2 class="mt-3 text-2xl font-semibold text-zinc-100">Tournament Outcome Probabilities</h2>
          <p class="mt-2 max-w-3xl text-sm text-zinc-400">
            This mode uses an offline-generated exact scenario snapshot. It keeps the standings and title odds on the site without trying to run a large exact tree in the browser.
          </p>
        </div>

        <div class="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 lg:min-w-[260px]">
          <div class="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {activeSnapshotLabel ? 'Conditional Scenarios' : 'Exact Scenarios'}
          </div>
          <div class="mt-2 text-2xl font-semibold text-zinc-100">{totalScenarios.toLocaleString()}</div>
          <div class="mt-1 text-xs text-zinc-500">
            {#if activeSnapshotLabel}
              Showing only outcomes where {activeSnapshotLabel}.
            {:else}
              Exact standings and title odds from the imported snapshot.
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="p-6">
    {#if previewGames.length > 0 && selectedTab !== 'root'}
      <div class="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div class="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Single-Game Preview</div>
            <div class="mt-2 text-sm text-zinc-300">
              Pick one currently known matchup to see how the heatmap and win chances move if that team advances.
            </div>
          </div>

          <div class="flex flex-col gap-3 lg:items-end">
            <select
              class="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-200 min-w-[280px]"
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

            {#if selectedPreviewGame}
              <div class="flex flex-wrap gap-2">
                <button
                  class={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedPreviewWinner === 'A'
                      ? 'bg-amber-600 text-white'
                      : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  }`}
                  on:click={() => selectPreviewWinner('A')}
                >
                  {selectedPreviewGame.teamA.seed} {selectedPreviewGame.teamA.name}
                </button>
                <button
                  class={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedPreviewWinner === 'B'
                      ? 'bg-amber-600 text-white'
                      : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  }`}
                  on:click={() => selectPreviewWinner('B')}
                >
                  {selectedPreviewGame.teamB.seed} {selectedPreviewGame.teamB.name}
                </button>
                <button
                  class="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                  on:click={resetPreview}
                >
                  Reset
                </button>
              </div>
            {/if}
          </div>
        </div>

        {#if activeSnapshotLabel}
          <div class="mt-4 rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-3 text-sm text-amber-100">
            Showing conditional standings for <strong>{activeSnapshotLabel}</strong>.
          </div>
        {/if}
      </div>
    {/if}

    <div class="mb-6">
      <div class="border-b border-zinc-700">
        <div class="flex">
          <button
            class={`py-2 px-4 font-medium text-sm ${selectedTab === 'win' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}
            on:click={() => selectedTab = 'win'}
          >
            Win Chances
          </button>
          <button
            class={`py-2 px-4 font-medium text-sm ${selectedTab === 'full' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}
            on:click={() => selectedTab = 'full'}
          >
            Full Standings
          </button>
          {#if previewGames.length > 0}
            <button
              class={`py-2 px-4 font-medium text-sm ${selectedTab === 'root' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}
              on:click={() => selectedTab = 'root'}
            >
              Rooting Guide
            </button>
          {/if}
        </div>
      </div>
    </div>

    {#if selectedTab === 'win'}
      <WinChancesTab {userWinCounts} />
    {:else if selectedTab === 'full'}
      <FullStandingsTab
        {positionProbabilities}
        {totalScenarios}
        numEntries={activeEntries.length}
        bind:displayMode
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
