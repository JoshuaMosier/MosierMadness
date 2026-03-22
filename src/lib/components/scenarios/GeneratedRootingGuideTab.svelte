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
    placeCounts: number[];
    totalScenarios: number;
  };

  type BranchSummary = {
    pct: number;
    count: number;
    place: number;
  };

  type CardPriority = {
    label: string;
    tone: 'need' | 'prefer' | 'edge' | 'neutral';
    rank: number;
  };

  const CLEAR_EDGE_RATIO_THRESHOLD = 2;
  const SMALL_EDGE_RATIO_THRESHOLD = 1.1;

  function getDisplayName(entry: GeneratedScenarioEntry): string {
    return entry.displayName || `${entry.firstName ?? ''} ${entry.lastName ?? ''}`.trim() || entry.entryId;
  }

  function findEntrySnapshot(
    snapshots: GeneratedScenarioEntry[],
    entryId: string | null,
    totalScenarios: number | null = null,
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
      placeCounts: snapshot.placeCounts,
      totalScenarios: totalScenarios ?? snapshot.placeCounts.reduce((sum, count) => sum + count, 0),
    };
  }

  function getBestPlace(placeCounts: number[]): number {
    const bestPlaceIndex = placeCounts.findIndex((count) => count > 0);
    return bestPlaceIndex === -1 ? placeCounts.length : bestPlaceIndex + 1;
  }

  function getOrdinalSuffix(value: number): string {
    const modTen = value % 10;
    const modHundred = value % 100;

    if (modTen === 1 && modHundred !== 11) return 'st';
    if (modTen === 2 && modHundred !== 12) return 'nd';
    if (modTen === 3 && modHundred !== 13) return 'rd';
    return 'th';
  }

  function formatPlaceLabel(place: number): string {
    return `${place}${getOrdinalSuffix(place)}`;
  }

  function getCountForPlace(snapshot: BranchSnapshot, place: number): number {
    if (place <= 1) {
      return snapshot.firstPlaceCount;
    }

    return snapshot.placeCounts[place - 1] ?? 0;
  }

  function buildBranchSummary(snapshot: BranchSnapshot | null, targetPlace: number): BranchSummary | null {
    if (!snapshot) {
      return null;
    }

    const clampedTargetPlace = Math.max(1, targetPlace);
    const targetCount = getCountForPlace(snapshot, clampedTargetPlace);
    const displayPlace = targetCount > 0 ? clampedTargetPlace : getBestPlace(snapshot.placeCounts);
    const displayCount = getCountForPlace(snapshot, displayPlace);

    return {
      pct: snapshot.totalScenarios > 0 ? (displayCount / snapshot.totalScenarios) * 100 : 0,
      count: displayCount,
      place: displayPlace,
    };
  }

  function compareBranchSummaries(left: BranchSummary | null, right: BranchSummary | null): number {
    if (!left && !right) return 0;
    if (!left) return -1;
    if (!right) return 1;

    if (left.place !== right.place) {
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

  function formatBranchValue(summary: BranchSummary | null, targetPlace: number): string {
    if (!summary) {
      return 'N/A';
    }

    if (summary.place !== targetPlace) {
      return formatPlaceLabel(summary.place);
    }

    return `${summary.pct.toFixed(summary.pct >= 10 ? 1 : 2)}%`;
  }

  function getImpactPercent(left: BranchSummary | null, right: BranchSummary | null): number {
    return Math.abs((left?.pct ?? 0) - (right?.pct ?? 0));
  }

  function getImpactPlaceDelta(left: BranchSummary | null, right: BranchSummary | null): number {
    return Math.abs((left?.place ?? 0) - (right?.place ?? 0));
  }

  function getCardPriority(
    left: BranchSummary | null,
    right: BranchSummary | null,
    targetPlace: number,
  ): CardPriority {
    if (!left || !right) {
      return { label: 'No Real Difference', tone: 'neutral', rank: 0 };
    }

    const keepsTargetAliveCount = Number(left.place === targetPlace) + Number(right.place === targetPlace);
    if (keepsTargetAliveCount === 1) {
      return { label: 'Must-Have', tone: 'need', rank: 3 };
    }

    const higherCount = Math.max(left.count, right.count);
    const lowerCount = Math.min(left.count, right.count);
    const ratio = lowerCount === 0 ? Number.POSITIVE_INFINITY : higherCount / lowerCount;

    if (ratio >= CLEAR_EDGE_RATIO_THRESHOLD) {
      return { label: 'Clear Edge', tone: 'prefer', rank: 2 };
    }

    if (ratio > SMALL_EDGE_RATIO_THRESHOLD) {
      return { label: 'Small Edge', tone: 'edge', rank: 1 };
    }

    return { label: 'No Real Difference', tone: 'neutral', rank: 0 };
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
  $: selectedEntrySnapshot = findEntrySnapshot(entries, selectedUser);
  $: targetPlace = selectedEntrySnapshot ? getBestPlace(selectedEntrySnapshot.placeCounts) : 1;
  $: targetPlaceLabel = formatPlaceLabel(targetPlace);
  $: selectedTargetSummary = buildBranchSummary(selectedEntrySnapshot, targetPlace);
  $: gameSummaries = previewGames.map((game) => {
    const teamASnapshot = findEntrySnapshot(game.outcomeA.entries, selectedUser, game.outcomeA.totalScenarios);
    const teamBSnapshot = findEntrySnapshot(game.outcomeB.entries, selectedUser, game.outcomeB.totalScenarios);
    const teamASummary = buildBranchSummary(teamASnapshot, targetPlace);
    const teamBSummary = buildBranchSummary(teamBSnapshot, targetPlace);
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
    const priority = getCardPriority(teamASummary, teamBSummary, targetPlace);

    return {
      ...game,
      teamASummary,
      teamBSummary,
      favoredTeam,
      selectedPickBranch,
      counterIntuitive,
      impactPct,
      impactPlaceDelta,
      priority,
    };
  }).sort((left, right) => {
    if (right.priority.rank !== left.priority.rank) {
      return right.priority.rank - left.priority.rank;
    }

    if (right.impactPlaceDelta !== left.impactPlaceDelta) {
      return right.impactPlaceDelta - left.impactPlaceDelta;
    }

    if (right.impactPct !== left.impactPct) {
      return right.impactPct - left.impactPct;
    }

    if ((left.favoredTeam !== null) !== (right.favoredTeam !== null)) {
      return left.favoredTeam !== null ? -1 : 1;
    }

    if (left.counterIntuitive !== right.counterIntuitive) {
      return left.counterIntuitive ? -1 : 1;
    }

    return left.gameIndex - right.gameIndex;
  });
  $: hasCounterIntuitiveGames = gameSummaries.some((game) => game.counterIntuitive);
</script>

{@html svgFilter}

<div class="generated-rooting">
  <div class="generated-rooting-toolbar mm-control-shell">
    <div class="generated-rooting-toolbar-row mm-control-row">
      <label for="generatedUserSelect" class="generated-rooting-kicker mm-compact-eyebrow">
        {#if currentUserId && selectedEntry?.userId === currentUserId}
          Your Bracket
        {:else}
          Bracket Focus
        {/if}
      </label>

      <select
        id="generatedUserSelect"
        class="generated-rooting-select mm-select"
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
        <div class="generated-rooting-baseline mm-inline-stats">
          <span class="generated-rooting-baseline-label mm-inline-stat-label">
            {targetPlace === 1 ? '1st-place chance' : `${targetPlaceLabel}-place chance`}
          </span>
          <span class="generated-rooting-baseline-pill mm-inline-stat-pill">
            {selectedTargetSummary ? selectedTargetSummary.count.toLocaleString() : '0'} scenarios
          </span>
          <span class="generated-rooting-baseline-value mm-inline-stat-pill is-accent">
            {selectedTargetSummary ? formatBranchValue(selectedTargetSummary, targetPlace) : '0.00%'}
          </span>
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
    <div class="generated-rooting-shell mm-control-shell">
      <div class="generated-rooting-summary">
        <div class="generated-rooting-summary-value">Best possible finish: {targetPlaceLabel}</div>
      </div>

      <div class="generated-rooting-grid">
        {#each gameSummaries as game}
          <div class="generated-rooting-card">
            <div class={`generated-rooting-card-header is-${game.priority.tone}`}>
              <span class={`generated-rooting-card-header-label ${game.counterIntuitive ? 'is-counter' : ''}`}>
                {game.priority.label}
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
                    {formatBranchValue(game.teamASummary, targetPlace)}
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
                    {formatBranchValue(game.teamBSummary, targetPlace)}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if hasCounterIntuitiveGames}
        <div class="generated-rooting-footnote">
          <span class="generated-rooting-card-header-label is-counter">Headers</span>
          mean rooting against your selected pick improves your odds of your best possible finish.
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .generated-rooting {
    margin-bottom: 1.5rem;
  }

  .generated-rooting-toolbar {
    margin-bottom: 1rem;
  }

  .generated-rooting-toolbar-row {
    align-items: center;
  }

  .generated-rooting-select {
    min-width: 18rem;
    flex: 1 1 22rem;
  }

  .generated-rooting-baseline {
    justify-content: flex-end;
  }

  .generated-rooting-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--mm-muted);
  }

  .generated-rooting-shell {
    background: rgba(11, 11, 12, 0.74);
  }

  .generated-rooting-summary {
    margin-bottom: 0.9rem;
    text-align: center;
  }

  .generated-rooting-summary-value {
    color: var(--mm-text);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.01em;
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

  .generated-rooting-card-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.7rem 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(34, 34, 36, 0.82);
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .generated-rooting-card-header-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .generated-rooting-card-header.is-need {
    background: rgba(120, 53, 15, 0.34);
    color: #fcd34d;
  }

  .generated-rooting-card-header.is-prefer,
  .generated-rooting-card-header.is-edge {
    background: rgba(63, 63, 70, 0.82);
    color: #e4e4e7;
  }

  .generated-rooting-card-header.is-neutral {
    color: var(--mm-subtle);
  }

  .generated-rooting-card-header-label.is-counter {
    border-radius: 999px;
    background: rgba(127, 29, 29, 0.32);
    box-shadow:
      inset 0 0 0 1px rgba(252, 165, 165, 0.55),
      0 0 0 1px rgba(0, 0, 0, 0.18);
    color: #fca5a5;
    padding: 0 0.5rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: inherit;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .generated-rooting-footnote {
    margin-top: 0.85rem;
    color: var(--mm-muted);
    font-size: 0.82rem;
    line-height: 1.45;
    text-align: center;
  }

  .generated-rooting-footnote .generated-rooting-card-header-label.is-counter {
    margin-right: 0.35rem;
    vertical-align: middle;
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

    .generated-rooting-kicker,
    .generated-rooting-baseline-label {
      display: none;
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

    .generated-rooting-card-header {
      padding: 0.58rem 0.72rem;
    }

    .generated-rooting-card-body {
      gap: 0.55rem;
      padding: 0.72rem;
    }

    .generated-rooting-team {
      padding: 0.56rem 0.62rem;
      gap: 0.6rem;
    }

    .generated-rooting-team-main {
      gap: 0.6rem;
    }

    .generated-rooting-team-name {
      font-size: 0.88rem;
    }

    .generated-rooting-team-value {
      min-width: 3rem;
      font-size: 0.82rem;
    }
  }
</style>
