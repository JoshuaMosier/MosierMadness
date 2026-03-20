<script lang="ts">
  import { handleImageError } from '$lib/utils/imageUtils';
  import { hexToRgb } from '$lib/utils/teamColorUtils';
  import type { GeneratedScenarioEntry, GeneratedScenarioGamePreview, GeneratedScenarioTeam } from '$lib/types';

  export let entries: GeneratedScenarioEntry[] = [];
  export let previewGames: GeneratedScenarioGamePreview[] = [];
  export let currentUserId: string | null = null;
  export let selectedUser: string | null = null;
  let selectedUserValue = '';

  type BranchSnapshot = {
    entryId: string;
    firstPlaceCount: number;
    firstPlacePct: number;
    placeCounts: number[];
    totalScenarios: number;
  };

  type BranchSummary = {
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
        pct: snapshot.firstPlacePct,
        count: snapshot.firstPlaceCount,
        place: 1,
        titleAlive: true,
      };
    }

    const bestPlace = getBestPlace(snapshot.placeCounts);
    const bestPlaceCount = bestPlace > 0 ? snapshot.placeCounts[bestPlace - 1] ?? 0 : 0;
    return {
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

  function formatBranchValue(summary: BranchSummary | null): string {
    if (!summary) {
      return 'N/A';
    }

    return summary.titleAlive ? `${summary.pct.toFixed(2)}%` : `P${summary.place}`;
  }

  function getImpactPercent(left: BranchSummary | null, right: BranchSummary | null): number {
    return Math.abs((left?.pct ?? 0) - (right?.pct ?? 0));
  }

  function getImpactPlaceDelta(left: BranchSummary | null, right: BranchSummary | null): number {
    return Math.abs((left?.place ?? 0) - (right?.place ?? 0));
  }

  function getTeamLogoContainerStyle(team: GeneratedScenarioTeam): string {
    const primaryRgb = hexToRgb(team.primaryColor ?? '');
    const secondaryRgb = hexToRgb(team.secondaryColor ?? '');

    if (!primaryRgb) {
      return 'background-color: rgba(24, 24, 27, 0.95); border-color: rgba(63, 63, 70, 0.9);';
    }

    const borderColor = secondaryRgb
      ? `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.82)`
      : `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.9)`;

    return `
      background: linear-gradient(135deg,
        rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.94) 0%,
        rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.72) 100%
      );
      border-color: ${borderColor};
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.14),
        0 6px 14px rgba(0, 0, 0, 0.24);
    `;
  }

  $: sortedEntries = [...entries].sort((left, right) => {
    const leftName = getDisplayName(left).toLowerCase();
    const rightName = getDisplayName(right).toLowerCase();
    return leftName.localeCompare(rightName);
  });

  $: selectedUserValue = selectedUser ?? '';
  $: selectedEntry = entries.find((entry) => entry.entryId === selectedUser) ?? null;
  $: gameSummaries = previewGames.map((game) => {
    const teamASnapshot = findEntrySnapshot(game.outcomeA.entries, selectedUser, game.outcomeA.totalScenarios);
    const teamBSnapshot = findEntrySnapshot(game.outcomeB.entries, selectedUser, game.outcomeB.totalScenarios);
    const teamASummary = buildBranchSummary(teamASnapshot);
    const teamBSummary = buildBranchSummary(teamBSnapshot);
    const comparison = compareBranchSummaries(teamASummary, teamBSummary);
    const favoredTeam = comparison > 0 ? 'A' : comparison < 0 ? 'B' : null;
    const selectedPickTeamId = selectedEntry?.picks?.[game.gameIndex] ?? null;
    const selectedPickBranch = selectedPickTeamId === game.teamA.teamId
      ? 'A'
      : selectedPickTeamId === game.teamB.teamId
        ? 'B'
        : null;
    const counterIntuitive = Boolean(favoredTeam && selectedPickBranch && favoredTeam !== selectedPickBranch);
    const impactPct = getImpactPercent(teamASummary, teamBSummary);
    const impactPlaceDelta = getImpactPlaceDelta(teamASummary, teamBSummary);

    return {
      ...game,
      teamASummary,
      teamBSummary,
      favoredTeam,
      selectedPickBranch,
      counterIntuitive,
      impactPct,
      impactPlaceDelta,
    };
  }).sort((left, right) => {
    if (right.impactPct !== left.impactPct) {
      return right.impactPct - left.impactPct;
    }

    if (right.impactPlaceDelta !== left.impactPlaceDelta) {
      return right.impactPlaceDelta - left.impactPlaceDelta;
    }

    if ((left.favoredTeam !== null) !== (right.favoredTeam !== null)) {
      return left.favoredTeam !== null ? -1 : 1;
    }

    if (left.counterIntuitive !== right.counterIntuitive) {
      return left.counterIntuitive ? -1 : 1;
    }

    return left.gameIndex - right.gameIndex;
  });
  $: counterIntuitiveCount = gameSummaries.filter((game) => game.counterIntuitive).length;
</script>

<div class="mb-6">
  <div class="mb-4">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div class="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
        <label for="generatedUserSelect" class="shrink-0 text-sm font-medium text-zinc-300">
          {#if currentUserId && selectedEntry?.userId === currentUserId}
            Your bracket:
          {:else}
            Select a bracket:
          {/if}
        </label>
        <select
          id="generatedUserSelect"
          class="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-200 w-full lg:w-80"
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

      {#if selectedEntry}
        <div class="shrink-0 bg-zinc-800 border border-amber-600 rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
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
      <div class="mb-4 flex flex-wrap gap-2">
        {#if counterIntuitiveCount > 0}
          <span class="inline-flex items-center rounded-full bg-rose-900/30 px-3 py-1 text-xs font-medium text-rose-300">
            {counterIntuitiveCount} current game{counterIntuitiveCount === 1 ? '' : 's'} help more if your pick loses
          </span>
        {:else}
          <span class="inline-flex items-center rounded-full bg-zinc-700/70 px-3 py-1 text-xs font-medium text-zinc-300">
            No current known games produce an against-your-bracket edge
          </span>
        {/if}
      </div>

      <div class="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {#each gameSummaries as game}
          <div class="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
            <div class="bg-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 flex items-center justify-between gap-3">
              <span>{game.roundLabel}</span>
              <span class="text-xs uppercase tracking-[0.18em] text-zinc-400">Game {game.gameIndex + 1}</span>
            </div>

            <div class="min-h-[2rem] flex items-center justify-between gap-2 px-3 pt-2">
              {#if !game.favoredTeam}
                <span class="inline-flex items-center rounded-full bg-zinc-700/60 px-2 py-1 text-[11px] font-medium text-zinc-300">
                  No edge
                </span>
              {:else}
                <span></span>
              {/if}

              {#if game.counterIntuitive}
                <span class="inline-flex items-center rounded-full bg-rose-900/30 px-2 py-1 text-[11px] font-medium text-rose-300">
                  Against your bracket
                </span>
              {/if}
            </div>

            <div class="p-3 pt-1 space-y-2.5">
              <div
                class={`flex items-center gap-3 rounded-lg p-2.5 ${
                  game.favoredTeam === 'A'
                    ? 'bg-green-900/20 border border-green-900/70'
                    : 'bg-zinc-700/30 border border-zinc-700'
                } ${game.selectedPickBranch === 'A' ? 'ring-1 ring-amber-500/60 ring-inset' : ''}`}
              >
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-md overflow-hidden border flex-shrink-0 p-1"
                    style={getTeamLogoContainerStyle(game.teamA)}
                  >
                    <img
                      src={game.teamA.seoName ? `/images/team-logos/${game.teamA.seoName}.svg` : '/images/placeholder-team.svg'}
                      alt={`${game.teamA.name} logo`}
                      class="w-full h-full object-contain"
                      on:error={handleImageError}
                    />
                  </div>
                  <div class="min-w-0">
                    <div class="text-zinc-100 font-medium truncate">{game.teamA.seed} {game.teamA.name}</div>
                  </div>
                </div>
                {#if game.teamASummary}
                  <div class={`ml-auto min-w-[60px] text-right text-sm font-semibold ${game.favoredTeam === 'A' ? 'text-green-400' : 'text-amber-400'}`}>
                    {formatBranchValue(game.teamASummary)}
                  </div>
                {/if}
              </div>

              <div
                class={`flex items-center gap-3 rounded-lg p-2.5 ${
                  game.favoredTeam === 'B'
                    ? 'bg-green-900/20 border border-green-900/70'
                    : 'bg-zinc-700/30 border border-zinc-700'
                } ${game.selectedPickBranch === 'B' ? 'ring-1 ring-amber-500/60 ring-inset' : ''}`}
              >
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-md overflow-hidden border flex-shrink-0 p-1"
                    style={getTeamLogoContainerStyle(game.teamB)}
                  >
                    <img
                      src={game.teamB.seoName ? `/images/team-logos/${game.teamB.seoName}.svg` : '/images/placeholder-team.svg'}
                      alt={`${game.teamB.name} logo`}
                      class="w-full h-full object-contain"
                      on:error={handleImageError}
                    />
                  </div>
                  <div class="min-w-0">
                    <div class="text-zinc-100 font-medium truncate">{game.teamB.seed} {game.teamB.name}</div>
                  </div>
                </div>
                {#if game.teamBSummary}
                  <div class={`ml-auto min-w-[60px] text-right text-sm font-semibold ${game.favoredTeam === 'B' ? 'text-green-400' : 'text-amber-400'}`}>
                    {formatBranchValue(game.teamBSummary)}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
