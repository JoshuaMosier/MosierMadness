<script lang="ts">
  type ExactTitleOddsEntry = {
    entryId: string;
    displayName: string;
    firstPlacePct: number;
    firstPlaceCount: number;
  };

  type TitleOddsRow = ExactTitleOddsEntry & {
    isCurrentUser: boolean;
    isFavorite: boolean;
  };

  export let entries: ExactTitleOddsEntry[] = [];
  export let totalScenarios: number = 0;
  export let currentUserEntryId: string | null = null;
  export let analysisLabel = 'Exact browser simulation';

  let hoveredEntryId: string | null = null;
  let pinnedEntryId: string | null = null;
  let rows: TitleOddsRow[] = [];
  let focusedEntry: TitleOddsRow | null = null;
  let axisMax = 0;

  function formatPercent(value: number): string {
    if (value <= 0) {
      return '0.00%';
    }

    return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
  }

  function roundAxisMax(value: number): number {
    if (value <= 1) {
      return 1;
    }

    if (value <= 5) {
      return Math.ceil(value);
    }

    if (value <= 20) {
      return Math.ceil(value / 2) * 2;
    }

    return Math.ceil(value / 5) * 5;
  }

  function isCurrentUserEntry(entryId: string): boolean {
    return Boolean(currentUserEntryId && entryId === currentUserEntryId);
  }

  function clamp(value: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, value));
  }

  function getBarWidth(value: number, maxValue: number): string {
    if (maxValue <= 0) {
      return '0%';
    }

    return `${clamp(value / maxValue) * 100}%`;
  }

  function getHeatmapStyle(value: number, maxValue: number): string {
    if (!Number.isFinite(value) || maxValue <= 0) {
      return 'background-color: rgba(255, 255, 255, 0.03);';
    }

    const normalized = clamp(value / maxValue);
    const hue = Math.round(normalized * 120);
    const alpha = 0.18 + normalized * 0.44;
    const borderAlpha = 0.12 + normalized * 0.24;

    return [
      `background-color: hsla(${hue}, 64%, 38%, ${alpha.toFixed(3)})`,
      `box-shadow: inset 0 0 0 1px hsla(${hue}, 70%, 52%, ${borderAlpha.toFixed(3)})`,
      'color: white',
    ].join('; ');
  }

  function setHovered(entryId: string | null): void {
    hoveredEntryId = entryId;
  }

  function togglePinned(entryId: string): void {
    pinnedEntryId = pinnedEntryId === entryId ? null : entryId;
  }

  $: rows = entries
    .filter((entry) => entry.firstPlacePct > 0)
    .sort((left, right) => {
      if (right.firstPlacePct !== left.firstPlacePct) {
        return right.firstPlacePct - left.firstPlacePct;
      }

      if (right.firstPlaceCount !== left.firstPlaceCount) {
        return right.firstPlaceCount - left.firstPlaceCount;
      }

      return left.displayName.localeCompare(right.displayName);
    })
    .map((entry, index) => ({
      ...entry,
      isCurrentUser: isCurrentUserEntry(entry.entryId),
      isFavorite: index === 0,
    }));

  $: axisMax = roundAxisMax(rows.reduce((maxValue, row) => Math.max(maxValue, row.firstPlacePct), 0));

  $: if (pinnedEntryId && !rows.some((row) => row.entryId === pinnedEntryId)) {
    pinnedEntryId = null;
  }

  $: if (hoveredEntryId && !rows.some((row) => row.entryId === hoveredEntryId)) {
    hoveredEntryId = null;
  }

  $: focusedEntry = rows.find((row) => row.entryId === (pinnedEntryId ?? hoveredEntryId)) ?? null;
</script>

<div class="scenario-title-odds">
  {#if rows.length === 0}
    <div class="scenario-title-odds-state">
      No entries still have a path to 1st place in this view.
    </div>
  {:else}
    <div class="scenario-title-odds-shell mm-control-shell">
      <div class="scenario-title-odds-legend">
        <div class="scenario-title-odds-legend-item">
          <span class="scenario-title-odds-legend-marker is-favorite"></span>
          <span>Current favorite</span>
        </div>
        <div class="scenario-title-odds-legend-item">
          <span class="scenario-title-odds-legend-marker is-you"></span>
          <span>Your bracket</span>
        </div>
        <div class="scenario-title-odds-legend-item">
          <span class="scenario-title-odds-legend-marker is-live"></span>
          <span>{analysisLabel}</span>
        </div>
      </div>

      <div class="scenario-title-odds-grid">
        <div class="scenario-title-odds-bars">
          <div class="scenario-title-odds-bars-kicker mm-compact-eyebrow">Exact Title Odds</div>

          <div class="scenario-title-odds-bar-list">
            {#each rows as row}
              <button
                type="button"
                class={`scenario-title-odds-bar-row ${row.isCurrentUser ? 'is-current-user' : ''} ${row.isFavorite ? 'is-favorite' : ''} ${focusedEntry?.entryId === row.entryId ? 'is-active' : ''} ${pinnedEntryId === row.entryId ? 'is-pinned' : ''}`}
                on:mouseenter={() => setHovered(row.entryId)}
                on:mouseleave={() => setHovered(null)}
                on:focus={() => setHovered(row.entryId)}
                on:blur={() => setHovered(null)}
                on:click={() => togglePinned(row.entryId)}
                aria-label={`${row.displayName}: ${formatPercent(row.firstPlacePct)}, ${row.firstPlaceCount.toLocaleString()} winning scenarios`}
              >
                <div class="scenario-title-odds-bar-copy">
                  <div class="scenario-title-odds-bar-name">
                    <span>{row.displayName}</span>
                    {#if row.isCurrentUser}
                      <span class="scenario-title-odds-you">You</span>
                    {/if}
                  </div>
                  <div class="scenario-title-odds-bar-percent">{formatPercent(row.firstPlacePct)}</div>
                </div>

                <div class="scenario-title-odds-bar-track">
                  <div
                    class={`scenario-title-odds-bar-fill ${row.isCurrentUser ? 'is-current-user' : row.isFavorite ? 'is-favorite' : ''}`}
                    style={`width: ${getBarWidth(row.firstPlacePct, axisMax)};`}
                  ></div>
                </div>

                <div class="scenario-title-odds-bar-meta">
                  {row.firstPlaceCount.toLocaleString()} of {totalScenarios.toLocaleString()} scenarios
                </div>
              </button>
            {/each}
          </div>
        </div>

        <div class="scenario-title-odds-side">
          <div class="scenario-title-odds-list">
            <div class="scenario-title-odds-list-kicker mm-compact-eyebrow">All Brackets</div>
            <div class="scenario-title-odds-list-columns">
              <span>Bracket</span>
              <span>Exact</span>
              <span>Wins</span>
            </div>
            <div class="scenario-title-odds-list-rows">
              {#each rows as row}
                <button
                  type="button"
                  class={`scenario-title-odds-list-row ${row.isCurrentUser ? 'is-current-user' : ''} ${row.isFavorite ? 'is-favorite' : ''} ${focusedEntry?.entryId === row.entryId ? 'is-active' : ''} ${pinnedEntryId === row.entryId ? 'is-pinned' : ''}`}
                  on:mouseenter={() => setHovered(row.entryId)}
                  on:mouseleave={() => setHovered(null)}
                  on:focus={() => setHovered(row.entryId)}
                  on:blur={() => setHovered(null)}
                  on:click={() => togglePinned(row.entryId)}
                  aria-label={`${row.displayName}: ${formatPercent(row.firstPlacePct)}, ${row.firstPlaceCount.toLocaleString()} winning scenarios`}
                >
                  <div class="scenario-title-odds-list-name">
                    <span>{row.displayName}</span>
                    {#if row.isCurrentUser}
                      <span class="scenario-title-odds-you">You</span>
                    {/if}
                  </div>
                  <div
                    class="scenario-title-odds-list-value is-heatmap"
                    style={getHeatmapStyle(row.firstPlacePct, axisMax)}
                  >
                    {formatPercent(row.firstPlacePct)}
                  </div>
                  <div class="scenario-title-odds-list-value is-count">
                    {row.firstPlaceCount.toLocaleString()}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .scenario-title-odds {
    display: grid;
    gap: 1rem;
  }

  .scenario-title-odds-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--mm-muted);
  }

  .scenario-title-odds-shell {
    display: grid;
    gap: 1rem;
  }

  .scenario-title-odds-legend {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.9rem;
  }

  .scenario-title-odds-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--mm-muted);
    font-size: 0.8rem;
  }

  .scenario-title-odds-legend-marker {
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 999px;
    display: inline-flex;
  }

  .scenario-title-odds-legend-marker.is-favorite {
    background: #fbbf24;
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.18);
  }

  .scenario-title-odds-legend-marker.is-you {
    background: #93c5fd;
    box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.2);
  }

  .scenario-title-odds-legend-marker.is-live {
    background: #86efac;
    box-shadow: 0 0 0 3px rgba(134, 239, 172, 0.15);
  }

  .scenario-title-odds-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(17rem, 20rem);
    gap: 1rem;
    align-items: start;
  }

  .scenario-title-odds-bars {
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 1rem;
    background:
      radial-gradient(circle at top, rgba(245, 158, 11, 0.08), transparent 38%),
      rgba(13, 13, 15, 0.9);
    padding: 0.8rem;
  }

  .scenario-title-odds-bars-kicker,
  .scenario-title-odds-list-kicker {
    display: block;
  }

  .scenario-title-odds-bar-list,
  .scenario-title-odds-list-rows {
    display: grid;
    gap: 0.38rem;
    margin-top: 0.6rem;
    max-height: 34rem;
    overflow: auto;
  }

  .scenario-title-odds-bar-row {
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 0.95rem;
    background: rgba(16, 16, 18, 0.72);
    color: inherit;
    padding: 0.72rem 0.78rem;
    text-align: left;
    display: grid;
    gap: 0.42rem;
    cursor: pointer;
  }

  .scenario-title-odds-bar-row.is-active,
  .scenario-title-odds-bar-row.is-pinned {
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(245, 158, 11, 0.08);
  }

  .scenario-title-odds-bar-row.is-current-user {
    border-color: rgba(59, 130, 246, 0.24);
    background-image: linear-gradient(90deg, rgba(59, 130, 246, 0.12), transparent 45%);
  }

  .scenario-title-odds-bar-row.is-favorite:not(.is-current-user) {
    border-color: rgba(251, 191, 36, 0.2);
  }

  .scenario-title-odds-bar-copy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .scenario-title-odds-bar-name {
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 700;
  }

  .scenario-title-odds-bar-percent {
    flex-shrink: 0;
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 700;
  }

  .scenario-title-odds-bar-track {
    overflow: hidden;
    height: 0.7rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .scenario-title-odds-bar-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
  }

  .scenario-title-odds-bar-fill.is-favorite {
    background: linear-gradient(90deg, #d97706, #fbbf24);
  }

  .scenario-title-odds-bar-fill.is-current-user {
    background: linear-gradient(90deg, #2563eb, #60a5fa);
  }

  .scenario-title-odds-bar-meta {
    color: var(--mm-muted);
    font-size: 0.74rem;
  }

  .scenario-title-odds-side {
    min-width: 0;
  }

  .scenario-title-odds-list {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(16, 16, 18, 0.82);
    padding: 0.65rem 0.7rem;
    display: grid;
    gap: 0.35rem;
  }

  .scenario-title-odds-list-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4.4rem 4.3rem;
    gap: 0.4rem;
    align-items: center;
    color: var(--mm-muted);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0 0 0.18rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .scenario-title-odds-list-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4.4rem 4.3rem;
    gap: 0.4rem;
    align-items: center;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0;
    background: transparent;
    color: inherit;
    padding: 0.24rem 0;
    text-align: left;
    cursor: pointer;
  }

  .scenario-title-odds-list-row.is-active {
    background: rgba(252, 211, 77, 0.08);
  }

  .scenario-title-odds-list-row.is-current-user {
    background-image: linear-gradient(90deg, rgba(59, 130, 246, 0.12), transparent 42%);
  }

  .scenario-title-odds-list-row.is-favorite:not(.is-current-user) {
    background-image: linear-gradient(90deg, rgba(245, 158, 11, 0.08), transparent 42%);
  }

  .scenario-title-odds-list-row.is-pinned {
    background-color: rgba(252, 211, 77, 0.06);
  }

  .scenario-title-odds-list-name {
    display: flex;
    flex-wrap: wrap;
    gap: 0.28rem;
    align-items: center;
    color: var(--mm-text);
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 0;
  }

  .scenario-title-odds-list-value {
    color: var(--mm-muted);
    font-size: 0.7rem;
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
  }

  .scenario-title-odds-list-value.is-heatmap {
    border-radius: 0.4rem;
    padding: 0.16rem 0.32rem;
  }

  .scenario-title-odds-list-value.is-count {
    color: #fde68a;
  }

  .scenario-title-odds-you {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.15);
    color: #bfdbfe;
    padding: 0.1rem 0.45rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  @media (max-width: 1023px) {
    .scenario-title-odds-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 767px) {
    .scenario-title-odds-bar-row {
      padding: 0.65rem 0.68rem;
    }

    .scenario-title-odds-bar-copy {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.25rem;
    }

    .scenario-title-odds-list-columns,
    .scenario-title-odds-list-row {
      grid-template-columns: minmax(0, 1fr) 4rem 3.8rem;
    }
  }
</style>
