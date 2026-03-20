<script lang="ts">
  import { handleImageError } from '$lib/utils/imageUtils';
  import { getOrdinalSuffix } from '$lib/utils/scenarioEngine';
  import type { GeneratedScenarioEntry, GeneratedScenarioGamePreview } from '$lib/types';

  export let entries: GeneratedScenarioEntry[] = [];
  export let previewGames: GeneratedScenarioGamePreview[] = [];
  export let currentUserId: string | null = null;
  export let selectedUser: string | null = null;

  type BranchSnapshot = {
    entryId: string;
    firstPlaceCount: number;
    firstPlacePct: number;
    placeCounts: number[];
    totalScenarios: number;
  };

  type BranchSummary = {
    label: string;
    pct: number;
    count: number;
    place: number;
    titleAlive: boolean;
  };

  function getDisplayName(entry: GeneratedScenarioEntry): string {
    return entry.displayName || `${entry.firstName ?? ''} ${entry.lastName ?? ''}`.trim() || entry.entryId;
  }

  function findEntrySnapshot(
    snapshots: GeneratedScenarioEntry[],
    entryId: string | null,
    totalScenarios: number,
  ): BranchSnapshot | null {
    if (!entryId) {
      return null;
    }

    const snapshot = snapshots.find((entry) => entry.entryId === entryId);
    if (!snapshot) {
      return null;
    }

    return {
      entryId: snapshot.entryId,
      firstPlaceCount: snapshot.firstPlaceCount,
      firstPlacePct: snapshot.firstPlacePct,
      placeCounts: snapshot.placeCounts,
      totalScenarios,
    };
  }

  function getBestPlace(placeCounts: number[]): number {
    const bestPlaceIndex = placeCounts.findIndex((count) => count > 0);
    return bestPlaceIndex === -1 ? placeCounts.length : bestPlaceIndex + 1;
  }

  function buildBranchSummary(snapshot: BranchSnapshot | null): BranchSummary | null {
    if (!snapshot) {
      return null;
    }

    if (snapshot.firstPlaceCount > 0) {
      return {
        label: '1st place',
        pct: snapshot.firstPlacePct,
        count: snapshot.firstPlaceCount,
        place: 1,
        titleAlive: true,
      };
    }

    const bestPlace = getBestPlace(snapshot.placeCounts);
    const bestPlaceCount = bestPlace > 0 ? snapshot.placeCounts[bestPlace - 1] ?? 0 : 0;
    return {
      label: `Best finish: ${bestPlace}${getOrdinalSuffix(bestPlace)}`,
      pct: snapshot.totalScenarios > 0 ? (bestPlaceCount / snapshot.totalScenarios) * 100 : 0,
      count: bestPlaceCount,
      place: bestPlace,
      titleAlive: false,
    };
  }

  function compareBranchSummaries(left: BranchSummary | null, right: BranchSummary | null): number {
    if (!left && !right) return 0;
    if (!left) return -1;
    if (!right) return 1;

    if (left.titleAlive !== right.titleAlive) {
      return left.titleAlive ? 1 : -1;
    }

    if (!left.titleAlive && left.place !== right.place) {
      return left.place < right.place ? 1 : -1;
    }

    if (left.count !== right.count) {
      return left.count > right.count ? 1 : -1;
    }

    if (left.pct !== right.pct) {
      return left.pct > right.pct ? 1 : -1;
    }

    return 0;
  }

  function describeRecommendation(
    preferredTeamName: string | null,
    preferredSummary: BranchSummary | null,
    otherSummary: BranchSummary | null,
  ): string {
    if (!preferredTeamName || !preferredSummary) {
      return 'No current recommendation';
    }

    if (preferredSummary.titleAlive) {
      if (!otherSummary?.titleAlive) {
        return `Must root for ${preferredTeamName} to keep a title path alive.`;
      }
      if (otherSummary.count === 0) {
        return `Must root for ${preferredTeamName} to keep a title path alive.`;
      }
      return `Root for ${preferredTeamName} for the better first-place path.`;
    }

    if (!otherSummary) {
      return `Root for ${preferredTeamName} for the strongest remaining finish.`;
    }

    if (preferredSummary.place < otherSummary.place) {
      return `Root for ${preferredTeamName} for a better floor: ${preferredSummary.place}${getOrdinalSuffix(preferredSummary.place)} instead of ${otherSummary.place}${getOrdinalSuffix(otherSummary.place)}.`;
    }

    if (preferredSummary.place === otherSummary.place && preferredSummary.count !== otherSummary.count) {
      return `Root for ${preferredTeamName} for more ${preferredSummary.place}${getOrdinalSuffix(preferredSummary.place)}-place paths.`;
    }

    return `Root for ${preferredTeamName} for the stronger remaining floor.`;
  }

  $: sortedEntries = [...entries].sort((left, right) => {
    const leftName = getDisplayName(left).toLowerCase();
    const rightName = getDisplayName(right).toLowerCase();
    return leftName.localeCompare(rightName);
  });

  $: selectedEntry = entries.find((entry) => entry.entryId === selectedUser) ?? null;

  $: gameSummaries = previewGames.map((game) => {
    const teamASnapshot = findEntrySnapshot(game.outcomeA.entries, selectedUser, game.outcomeA.totalScenarios);
    const teamBSnapshot = findEntrySnapshot(game.outcomeB.entries, selectedUser, game.outcomeB.totalScenarios);
    const teamASummary = buildBranchSummary(teamASnapshot);
    const teamBSummary = buildBranchSummary(teamBSnapshot);
    const comparison = compareBranchSummaries(teamASummary, teamBSummary);
    const favoredTeam = comparison > 0 ? 'A' : comparison < 0 ? 'B' : null;
    const recommendation = comparison === 0
      ? 'Both sides leave this bracket in essentially the same spot.'
      : favoredTeam === 'A'
        ? describeRecommendation(game.teamA.name, teamASummary, teamBSummary)
        : describeRecommendation(game.teamB.name, teamBSummary, teamASummary);

    return {
      ...game,
      teamASummary,
      teamBSummary,
      favoredTeam,
      recommendation,
    };
  });
</script>

<div class="mb-6">
  <div class="mb-4">
    <div class="flex flex-col md:flex-row items-start gap-4">
      <div class="w-full md:w-auto">
        <label for="generatedUserSelect" class="block text-sm font-medium text-zinc-300 mb-1">
          {#if currentUserId && selectedEntry?.userId === currentUserId}
            Your bracket is automatically selected:
          {:else}
            Select a bracket:
          {/if}
        </label>
        <select
          id="generatedUserSelect"
          class="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-200 w-full md:w-72"
          bind:value={selectedUser}
        >
          <option value={null} disabled selected={!selectedUser}>Select a bracket...</option>
          {#each sortedEntries as entry}
            <option value={entry.entryId}>
              {getDisplayName(entry)}{entry.userId === currentUserId ? ' (You)' : ''}
            </option>
          {/each}
        </select>
      </div>

      {#if selectedEntry}
        <div class="bg-zinc-800 border border-amber-600 rounded-lg p-3 flex flex-wrap items-center gap-2">
          <span class="text-zinc-200 text-sm">Baseline 1st-place chance:</span>
          <span class="bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded text-sm font-semibold">
            {selectedEntry.firstPlaceCount.toLocaleString()} scenarios
          </span>
          <span class="text-base font-bold text-amber-500">{selectedEntry.firstPlacePct.toFixed(2)}%</span>
        </div>
      {/if}
    </div>
  </div>

  {#if !selectedUser}
    <div class="text-center py-8 text-zinc-500">
      Select a bracket to see which currently known games help the most.
    </div>
  {:else if previewGames.length === 0}
    <div class="text-center py-8 text-zinc-500">
      No currently determined games are available for generated rooting guidance.
    </div>
  {:else}
    <div class="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4">
      <div class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {#each gameSummaries as game}
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
            <div class="bg-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 flex items-center justify-between gap-3">
              <span>{game.roundLabel}</span>
              <span class="text-xs uppercase tracking-[0.18em] text-zinc-400">Game {game.gameIndex + 1}</span>
            </div>

            <div class="p-3 space-y-3">
              <div
                class={`flex items-center justify-between gap-3 rounded-lg p-3 ${
                  game.favoredTeam === 'A'
                    ? 'bg-green-900/20 border border-green-900/70'
                    : 'bg-zinc-700/30 border border-zinc-700'
                }`}
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-md overflow-hidden bg-zinc-900 flex-shrink-0 p-1">
                    <img
                      src={game.teamA.seoName ? `/images/team-logos/${game.teamA.seoName}.svg` : '/images/placeholder-team.svg'}
                      alt={`${game.teamA.name} logo`}
                      class="w-full h-full object-contain"
                      on:error={handleImageError}
                    />
                  </div>
                  <div class="min-w-0">
                    <div class="text-zinc-100 font-medium truncate">{game.teamA.seed} {game.teamA.name}</div>
                    {#if game.teamASummary}
                      <div class="text-xs text-zinc-400">
                        {game.teamASummary.label} in {game.teamASummary.count.toLocaleString()} scenarios ({game.teamASummary.pct.toFixed(2)}%)
                      </div>
                    {/if}
                  </div>
                </div>
                {#if game.teamASummary}
                  <div class={`text-sm font-semibold ${game.favoredTeam === 'A' ? 'text-green-400' : 'text-amber-400'}`}>
                    {game.teamASummary.titleAlive ? `${game.teamASummary.pct.toFixed(2)}%` : `P${game.teamASummary.place}`}
                  </div>
                {/if}
              </div>

              <div
                class={`flex items-center justify-between gap-3 rounded-lg p-3 ${
                  game.favoredTeam === 'B'
                    ? 'bg-green-900/20 border border-green-900/70'
                    : 'bg-zinc-700/30 border border-zinc-700'
                }`}
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-md overflow-hidden bg-zinc-900 flex-shrink-0 p-1">
                    <img
                      src={game.teamB.seoName ? `/images/team-logos/${game.teamB.seoName}.svg` : '/images/placeholder-team.svg'}
                      alt={`${game.teamB.name} logo`}
                      class="w-full h-full object-contain"
                      on:error={handleImageError}
                    />
                  </div>
                  <div class="min-w-0">
                    <div class="text-zinc-100 font-medium truncate">{game.teamB.seed} {game.teamB.name}</div>
                    {#if game.teamBSummary}
                      <div class="text-xs text-zinc-400">
                        {game.teamBSummary.label} in {game.teamBSummary.count.toLocaleString()} scenarios ({game.teamBSummary.pct.toFixed(2)}%)
                      </div>
                    {/if}
                  </div>
                </div>
                {#if game.teamBSummary}
                  <div class={`text-sm font-semibold ${game.favoredTeam === 'B' ? 'text-green-400' : 'text-amber-400'}`}>
                    {game.teamBSummary.titleAlive ? `${game.teamBSummary.pct.toFixed(2)}%` : `P${game.teamBSummary.place}`}
                  </div>
                {/if}
              </div>

              <div class="rounded-lg bg-zinc-900/60 border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
                {#if game.favoredTeam === 'A'}
                  <span class="text-amber-400 font-semibold">{game.recommendation}</span>
                {:else if game.favoredTeam === 'B'}
                  <span class="text-amber-400 font-semibold">{game.recommendation}</span>
                {:else}
                  <span class="text-zinc-400">{game.recommendation}</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
