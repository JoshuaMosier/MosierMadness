<script lang="ts">
  import { handleImageError } from '$lib/utils/imageUtils';
  import { hexToRgb } from '$lib/utils/teamColorUtils';
  import type { GeneratedScenarioEntry, GeneratedScenarioGamePreview, GeneratedScenarioTeam } from '$lib/types';

  export let entries: GeneratedScenarioEntry[] = [];
  export let previewGames: GeneratedScenarioGamePreview[] = [];
  export let currentUserId: string | null = null;
  export let selectedUser: string | null = null;
  let selectedUserValue = '';
  const teamLogoClass = 'w-full h-full object-contain p-0.5 opacity-90';
  const teamLogoContainerClass = 'w-10 h-10 rounded-lg p-1 overflow-hidden shadow-inner relative';
  const svgFilter = `
  <svg width="0" height="0" style="position: absolute;">
    <defs>
      <filter id="generatedTeamLogoOutline" x="-20%" y="-20%" width="140%" height="140%">
        <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="blackThicken" />
        <feFlood flood-color="black" result="blackOutline" />
        <feComposite in="blackOutline" in2="blackThicken" operator="in" result="blackOutline" />
        <feMorphology operator="dilate" radius="0.5" in="SourceAlpha" result="whiteThicken" />
        <feFlood flood-color="white" result="whiteOutline" />
        <feComposite in="whiteOutline" in2="whiteThicken" operator="in" result="whiteOutline" />
        <feComposite in="whiteOutline" in2="blackOutline" operator="over" result="outlines" />
        <feComposite in="SourceGraphic" in2="outlines" operator="over" />
      </filter>
    </defs>
  </svg>
  `;

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

    if (!primaryRgb) {
      return `
        background-color: rgba(24, 24, 27, 0.95);
        filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3)) drop-shadow(-1px -1px 1px rgba(255, 255, 255, 0.1));
      `;
    }

    return `
      background-color: rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8);
      filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3)) drop-shadow(-1px -1px 1px rgba(255, 255, 255, 0.1));
    `;
  }

  function formatGameStartLabel(startTime: string | undefined): string {
    if (!startTime) {
      return 'TBD';
    }

    const parsedDate = new Date(startTime);
    if (!Number.isNaN(parsedDate.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(parsedDate).replace(',', ' ·');
    }

    return startTime;
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

{@html svgFilter}

<div class="generated-rooting">
  <div class="generated-rooting-toolbar">
    <div class="generated-rooting-toolbar-row">
      <label for="generatedUserSelect" class="generated-rooting-kicker">
        {#if currentUserId && selectedEntry?.userId === currentUserId}
          Your Bracket
        {:else}
          Bracket Focus
        {/if}
      </label>

      <select
        id="generatedUserSelect"
        class="generated-rooting-select"
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

      {#if selectedEntry}
        <div class="generated-rooting-baseline">
          <span class="generated-rooting-baseline-label">1st-place chance</span>
          <span class="generated-rooting-baseline-pill">
            {selectedEntry.firstPlaceCount.toLocaleString()} scenarios
          </span>
          <span class="generated-rooting-baseline-value">{selectedEntry.firstPlacePct.toFixed(2)}%</span>
        </div>
      {/if}
    </div>
  </div>

  {#if !selectedUser}
    <div class="generated-rooting-state">
      Select a bracket to see which currently known games help the most.
    </div>
  {:else if previewGames.length === 0}
    <div class="generated-rooting-state">
      No currently determined games are available for generated rooting guidance.
    </div>
  {:else}
    <div class="generated-rooting-shell">
      <div class="generated-rooting-summary">
        {#if counterIntuitiveCount > 0}
          <span class="generated-rooting-pill is-warning">
            {counterIntuitiveCount} current game{counterIntuitiveCount === 1 ? '' : 's'} help more if your pick loses
          </span>
        {:else}
          <span class="generated-rooting-pill">
            No current known games produce an against-your-bracket edge
          </span>
        {/if}
      </div>

      <div class="generated-rooting-grid">
        {#each gameSummaries as game}
          <div class={`generated-rooting-card ${game.counterIntuitive ? 'is-counter' : ''}`}>
            <div class={`generated-rooting-card-header ${game.counterIntuitive ? 'is-counter' : ''}`}>
              <span>{game.roundLabel}</span>
              <span class={`generated-rooting-card-time ${game.counterIntuitive ? 'is-counter' : ''}`}>
                {formatGameStartLabel(game.startTime)}
              </span>
            </div>

            <div class="generated-rooting-card-body">
              <div
                class={`generated-rooting-team ${game.favoredTeam === 'A' ? 'is-favored' : 'is-neutral'}`}
              >
                <div class="generated-rooting-team-main">
                  <div
                    class={teamLogoContainerClass}
                    style={getTeamLogoContainerStyle(game.teamA)}
                  >
                    <img
                      src={game.teamA.seoName ? `/images/team-logos/${game.teamA.seoName}.svg` : '/images/placeholder-team.svg'}
                      alt={`${game.teamA.name} logo`}
                      class={teamLogoClass}
                      style="filter: url(#generatedTeamLogoOutline);"
                      on:error={handleImageError}
                    />
                  </div>
                  <div class="generated-rooting-team-copy">
                    <div class="generated-rooting-team-name">{game.teamA.seed} {game.teamA.name}</div>
                  </div>
                </div>
                {#if game.teamASummary}
                  <div class={`generated-rooting-team-value ${game.favoredTeam === 'A' ? 'is-favored' : 'is-neutral'}`}>
                    {formatBranchValue(game.teamASummary)}
                  </div>
                {/if}
              </div>

              <div
                class={`generated-rooting-team ${game.favoredTeam === 'B' ? 'is-favored' : 'is-neutral'}`}
              >
                <div class="generated-rooting-team-main">
                  <div
                    class={teamLogoContainerClass}
                    style={getTeamLogoContainerStyle(game.teamB)}
                  >
                    <img
                      src={game.teamB.seoName ? `/images/team-logos/${game.teamB.seoName}.svg` : '/images/placeholder-team.svg'}
                      alt={`${game.teamB.name} logo`}
                      class={teamLogoClass}
                      style="filter: url(#generatedTeamLogoOutline);"
                      on:error={handleImageError}
                    />
                  </div>
                  <div class="generated-rooting-team-copy">
                    <div class="generated-rooting-team-name">{game.teamB.seed} {game.teamB.name}</div>
                  </div>
                </div>
                {#if game.teamBSummary}
                  <div class={`generated-rooting-team-value ${game.favoredTeam === 'B' ? 'is-favored' : 'is-neutral'}`}>
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

<style>
  .generated-rooting {
    margin-bottom: 1.5rem;
  }

  .generated-rooting-toolbar {
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(12, 12, 13, 0.72);
  }

  .generated-rooting-toolbar-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .generated-rooting-kicker {
    flex: 0 0 auto;
    color: var(--mm-subtle);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .generated-rooting-select {
    min-width: 18rem;
    flex: 1 1 22rem;
    min-height: 2.65rem;
    padding: 0.62rem 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.9rem;
    background: rgba(15, 15, 16, 0.96);
    color: var(--mm-text);
  }

  .generated-rooting-baseline {
    display: flex;
    flex: 1 1 21rem;
    min-width: 15rem;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0.55rem;
  }

  .generated-rooting-baseline-label {
    color: var(--mm-subtle);
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .generated-rooting-baseline-pill,
  .generated-rooting-baseline-value {
    display: inline-flex;
    align-items: center;
    min-height: 2.2rem;
    padding: 0.45rem 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.9rem;
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 600;
  }

  .generated-rooting-baseline-pill {
    color: #fbbf24;
  }

  .generated-rooting-baseline-value {
    border-color: rgba(245, 158, 11, 0.2);
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
    font-size: 0.84rem;
    font-weight: 700;
  }

  .generated-rooting-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--mm-muted);
  }

  .generated-rooting-shell {
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(11, 11, 12, 0.74);
  }

  .generated-rooting-summary {
    margin-bottom: 0.9rem;
  }

  .generated-rooting-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.45rem 0.8rem;
    background: rgba(39, 39, 42, 0.7);
    color: var(--mm-text);
    font-size: 0.76rem;
    font-weight: 600;
  }

  .generated-rooting-pill.is-warning {
    background: rgba(127, 29, 29, 0.32);
    color: #fca5a5;
  }

  .generated-rooting-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .generated-rooting-card {
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: linear-gradient(180deg, rgba(20, 20, 22, 0.96), rgba(10, 10, 11, 0.98));
  }

  .generated-rooting-card.is-counter {
    border-color: rgba(127, 29, 29, 0.65);
  }

  .generated-rooting-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(34, 34, 36, 0.82);
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 700;
  }

  .generated-rooting-card-header.is-counter {
    background: rgba(69, 10, 10, 0.4);
    color: #fecaca;
  }

  .generated-rooting-card-time {
    color: var(--mm-subtle);
    font-size: 0.72rem;
    white-space: nowrap;
  }

  .generated-rooting-card-time.is-counter {
    color: rgba(252, 165, 165, 0.82);
  }

  .generated-rooting-card-body {
    display: grid;
    gap: 0.65rem;
    padding: 0.85rem;
  }

  .generated-rooting-team {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.9rem;
  }

  .generated-rooting-team.is-favored {
    background: rgba(20, 83, 45, 0.2);
    border-color: rgba(22, 101, 52, 0.62);
  }

  .generated-rooting-team.is-neutral {
    background: rgba(39, 39, 42, 0.42);
    border-color: rgba(63, 63, 70, 0.9);
  }

  .generated-rooting-team-main {
    display: flex;
    min-width: 0;
    flex: 1 1 auto;
    align-items: center;
    gap: 0.75rem;
  }

  .generated-rooting-team-copy {
    min-width: 0;
  }

  .generated-rooting-team-name {
    overflow: hidden;
    color: var(--mm-text);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .generated-rooting-team-value {
    flex-shrink: 0;
    min-width: 3.75rem;
    text-align: right;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .generated-rooting-team-value.is-favored {
    color: #86efac;
  }

  .generated-rooting-team-value.is-neutral {
    color: #fbbf24;
  }

  @media (min-width: 768px) {
    .generated-rooting-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1280px) {
    .generated-rooting-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 767px) {
    .generated-rooting-toolbar-row {
      align-items: stretch;
    }

    .generated-rooting-select,
    .generated-rooting-baseline {
      min-width: 0;
      width: 100%;
      flex-basis: 100%;
    }

    .generated-rooting-baseline {
      justify-content: flex-start;
    }

    .generated-rooting-shell {
      padding: 0.9rem;
    }

    .generated-rooting-team {
      padding: 0.6rem 0.65rem;
    }
  }
</style>
