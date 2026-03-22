<script lang="ts">
  import type { GeneratedScenarioEntry } from '$lib/types';

  export let entries: GeneratedScenarioEntry[] = [];
  export let currentUserEntryId: string | null = null;

  type TitleOddsRow = {
    entryId: string;
    displayName: string;
    exactPct: number;
    weightedPct: number;
    deltaPct: number;
    isCurrentUser: boolean;
  };

  type ActiveLabel = {
    x: number;
    y: number;
    labelX: number;
    labelY: number;
    anchor: 'start' | 'end';
  };

  const PLOT_WIDTH = 920;
  const PLOT_HEIGHT = 560;
  const PLOT_MARGIN = {
    top: 20,
    right: 28,
    bottom: 64,
    left: 76,
  };

  let hoveredEntryId: string | null = null;
  let pinnedEntryId: string | null = null;
  let rows: TitleOddsRow[] = [];
  let sortedRows: TitleOddsRow[] = [];
  let axisMax = 0;
  let axisTicks: number[] = [];
  let exactRange = { min: 0, max: 0 };
  let weightedRange = { min: 0, max: 0 };
  let exactFavorite: TitleOddsRow | null = null;
  let weightedFavorite: TitleOddsRow | null = null;
  let biggestGain: TitleOddsRow | null = null;
  let biggestDrop: TitleOddsRow | null = null;
  let focusedEntry: TitleOddsRow | null = null;
  let activePoint: { x: number; y: number } | null = null;
  let activeLabel: ActiveLabel | null = null;

  function getDisplayName(entry: GeneratedScenarioEntry): string {
    return entry.displayName || `${entry.firstName ?? ''} ${entry.lastName ?? ''}`.trim() || entry.entryId;
  }

  function formatPercent(value: number): string {
    if (value <= 0) {
      return '0.00%';
    }

    return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
  }

  function formatDelta(value: number): string {
    if (Math.abs(value) < 0.005) {
      return '0.00 pts';
    }

    const sign = value > 0 ? '+' : '';
    const formatted = Math.abs(value) >= 10 ? value.toFixed(1) : value.toFixed(2);
    return `${sign}${formatted} pts`;
  }

  function formatAxisTick(value: number): string {
    if (value === 0) {
      return '0%';
    }

    return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)}%`;
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

  function getValueRange(values: number[]): { min: number; max: number } {
    if (values.length === 0) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  function getSummaryCellStyle(value: number, range: { min: number; max: number }): string {
    if (!Number.isFinite(value)) {
      return 'background-color: rgba(255, 255, 255, 0.03);';
    }

    if (range.max === range.min) {
      return 'background-color: rgba(255, 255, 255, 0.03);';
    }

    const normalized = clamp((value - range.min) / (range.max - range.min));
    const hue = Math.round(normalized * 120);
    const alpha = 0.18 + normalized * 0.44;
    const borderAlpha = 0.12 + normalized * 0.24;

    return [
      `background-color: hsla(${hue}, 64%, 38%, ${alpha.toFixed(3)})`,
      `box-shadow: inset 0 0 0 1px hsla(${hue}, 70%, 52%, ${borderAlpha.toFixed(3)})`,
      'color: white',
    ].join('; ');
  }

  function innerWidth(): number {
    return PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
  }

  function innerHeight(): number {
    return PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
  }

  function plotX(value: number, maxValue: number): number {
    if (maxValue <= 0) {
      return PLOT_MARGIN.left;
    }

    return PLOT_MARGIN.left + (value / maxValue) * innerWidth();
  }

  function plotY(value: number, maxValue: number): number {
    if (maxValue <= 0) {
      return PLOT_HEIGHT - PLOT_MARGIN.bottom;
    }

    return PLOT_MARGIN.top + innerHeight() - (value / maxValue) * innerHeight();
  }

  function setHovered(entryId: string | null): void {
    hoveredEntryId = entryId;
  }

  function togglePinned(entryId: string): void {
    pinnedEntryId = pinnedEntryId === entryId ? null : entryId;
  }

  function handlePointKeydown(event: KeyboardEvent, entryId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    togglePinned(entryId);
  }

  $: rows = entries
    .map((entry) => {
      const exactPct = entry.firstPlacePct ?? 0;
      const weightedPct = entry.weightedFirstPlacePct ?? exactPct;

      return {
        entryId: entry.entryId,
        displayName: getDisplayName(entry),
        exactPct,
        weightedPct,
        deltaPct: weightedPct - exactPct,
        isCurrentUser: isCurrentUserEntry(entry.entryId),
      };
    })
    .filter((entry) => entry.exactPct > 0 || entry.weightedPct > 0);

  $: axisMax = roundAxisMax(
    rows.reduce((maxValue, row) => Math.max(maxValue, row.exactPct, row.weightedPct), 0),
  );

  $: axisTicks = Array.from({ length: 5 }, (_, index) => axisMax * (index / 4));
  $: exactRange = getValueRange(rows.map((row) => row.exactPct));
  $: weightedRange = getValueRange(rows.map((row) => row.weightedPct));
  $: sortedRows = [...rows].sort((left, right) => {
    if (right.weightedPct !== left.weightedPct) {
      return right.weightedPct - left.weightedPct;
    }

    if (right.exactPct !== left.exactPct) {
      return right.exactPct - left.exactPct;
    }

    return left.displayName.localeCompare(right.displayName);
  });

  $: exactFavorite = [...rows].sort((left, right) => {
    if (right.exactPct !== left.exactPct) {
      return right.exactPct - left.exactPct;
    }

    return left.displayName.localeCompare(right.displayName);
  })[0] ?? null;

  $: weightedFavorite = [...rows].sort((left, right) => {
    if (right.weightedPct !== left.weightedPct) {
      return right.weightedPct - left.weightedPct;
    }

    return left.displayName.localeCompare(right.displayName);
  })[0] ?? null;

  $: biggestGain = [...rows].sort((left, right) => {
    if (right.deltaPct !== left.deltaPct) {
      return right.deltaPct - left.deltaPct;
    }

    return left.displayName.localeCompare(right.displayName);
  })[0] ?? null;

  $: biggestDrop = [...rows].sort((left, right) => {
    if (left.deltaPct !== right.deltaPct) {
      return left.deltaPct - right.deltaPct;
    }

    return left.displayName.localeCompare(right.displayName);
  })[0] ?? null;

  $: if (pinnedEntryId && !rows.some((row) => row.entryId === pinnedEntryId)) {
    pinnedEntryId = null;
  }

  $: if (hoveredEntryId && !rows.some((row) => row.entryId === hoveredEntryId)) {
    hoveredEntryId = null;
  }

  $: focusedEntry = rows.find((row) => row.entryId === (pinnedEntryId ?? hoveredEntryId)) ?? null;
  $: activePoint = focusedEntry
    ? {
        x: plotX(focusedEntry.exactPct, axisMax),
        y: plotY(focusedEntry.weightedPct, axisMax),
      }
    : null;
  $: activeLabel = focusedEntry && activePoint
    ? {
        x: activePoint.x,
        y: activePoint.y,
        anchor: activePoint.x > PLOT_WIDTH * 0.72 ? 'end' : 'start',
        labelX: activePoint.x + (activePoint.x > PLOT_WIDTH * 0.72 ? -12 : 12),
        labelY: Math.max(PLOT_MARGIN.top + 14, activePoint.y - 14),
      }
    : null;
</script>

<div class="generated-title-odds">
  {#if rows.length === 0}
    <div class="generated-title-odds-state">
      No entries still have a path to 1st place in this view.
    </div>
  {:else}
    <div class="generated-title-odds-plot mm-control-shell">
      <div class="generated-title-odds-legend">
        <div class="generated-title-odds-legend-item">
          <span class="generated-title-odds-legend-marker is-up"></span>
          <span>Weighted gain</span>
        </div>
        <div class="generated-title-odds-legend-item">
          <span class="generated-title-odds-legend-marker is-down"></span>
          <span>Weighted drop</span>
        </div>
        <div class="generated-title-odds-legend-item">
          <span class="generated-title-odds-legend-marker is-you"></span>
          <span>Your bracket</span>
        </div>
      </div>

      <div class="generated-title-odds-plot-grid">
        <div class="generated-title-odds-chart-wrap">
          <svg
            class="generated-title-odds-chart"
            viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
            role="img"
            aria-label="Scatter plot comparing likely title odds against all-path title odds for live brackets"
          >
            {#each axisTicks as tick}
              <line
                class="generated-title-odds-grid-line"
                x1={plotX(tick, axisMax)}
                y1={PLOT_MARGIN.top}
                x2={plotX(tick, axisMax)}
                y2={PLOT_HEIGHT - PLOT_MARGIN.bottom}
              />
              <line
                class="generated-title-odds-grid-line"
                x1={PLOT_MARGIN.left}
                y1={plotY(tick, axisMax)}
                x2={PLOT_WIDTH - PLOT_MARGIN.right}
                y2={plotY(tick, axisMax)}
              />
            {/each}

            <line
              class="generated-title-odds-diagonal"
              x1={plotX(0, axisMax)}
              y1={plotY(0, axisMax)}
              x2={plotX(axisMax, axisMax)}
              y2={plotY(axisMax, axisMax)}
            />

            <line
              class="generated-title-odds-axis-line"
              x1={PLOT_MARGIN.left}
              y1={PLOT_HEIGHT - PLOT_MARGIN.bottom}
              x2={PLOT_WIDTH - PLOT_MARGIN.right}
              y2={PLOT_HEIGHT - PLOT_MARGIN.bottom}
            />
            <line
              class="generated-title-odds-axis-line"
              x1={PLOT_MARGIN.left}
              y1={PLOT_MARGIN.top}
              x2={PLOT_MARGIN.left}
              y2={PLOT_HEIGHT - PLOT_MARGIN.bottom}
            />

            {#each axisTicks as tick}
              <text
                class="generated-title-odds-axis-label"
                x={plotX(tick, axisMax)}
                y={PLOT_HEIGHT - PLOT_MARGIN.bottom + 24}
                text-anchor="middle"
              >
                {formatAxisTick(tick)}
              </text>
              <text
                class="generated-title-odds-axis-label"
                x={PLOT_MARGIN.left - 12}
                y={plotY(tick, axisMax) + 4}
                text-anchor="end"
              >
                {formatAxisTick(tick)}
              </text>
            {/each}

            <text
              class="generated-title-odds-axis-title"
              x={(PLOT_MARGIN.left + PLOT_WIDTH - PLOT_MARGIN.right) / 2}
              y={PLOT_HEIGHT - 12}
              text-anchor="middle"
            >
              All Paths %
            </text>
            <text
              class="generated-title-odds-axis-title"
              x={20}
              y={(PLOT_MARGIN.top + PLOT_HEIGHT - PLOT_MARGIN.bottom) / 2}
              text-anchor="middle"
              transform={`rotate(-90 20 ${(PLOT_MARGIN.top + PLOT_HEIGHT - PLOT_MARGIN.bottom) / 2})`}
            >
              Likely Paths %
            </text>

            <text
              class="generated-title-odds-note"
              x={PLOT_WIDTH - PLOT_MARGIN.right}
              y={PLOT_MARGIN.top + 8}
              text-anchor="end"
            >
              Above line = better in weighted model
            </text>

            {#each rows as row}
              <g
                class="generated-title-odds-hit"
                role="button"
                tabindex="0"
                aria-label={`${row.displayName}: all paths ${formatPercent(row.exactPct)}, likely paths ${formatPercent(row.weightedPct)}, change ${formatDelta(row.deltaPct)}`}
                on:mouseenter={() => setHovered(row.entryId)}
                on:mouseleave={() => setHovered(null)}
                on:focus={() => setHovered(row.entryId)}
                on:blur={() => setHovered(null)}
                on:click={() => togglePinned(row.entryId)}
                on:keydown={(event) => handlePointKeydown(event, row.entryId)}
              >
                <circle
                  class={`generated-title-odds-point ${row.deltaPct >= 0 ? 'is-up' : 'is-down'} ${row.isCurrentUser ? 'is-current-user' : ''} ${focusedEntry?.entryId === row.entryId ? 'is-active' : ''}`}
                  cx={plotX(row.exactPct, axisMax)}
                  cy={plotY(row.weightedPct, axisMax)}
                  r={row.isCurrentUser ? 8 : focusedEntry?.entryId === row.entryId ? 7 : 5.5}
                />
                <title>{`${row.displayName}: All Paths ${formatPercent(row.exactPct)}, Likely Paths ${formatPercent(row.weightedPct)}, Change ${formatDelta(row.deltaPct)}`}</title>
              </g>
            {/each}

            {#if focusedEntry && activePoint && activeLabel}
              <line
                class="generated-title-odds-guide-line"
                x1={PLOT_MARGIN.left}
                y1={activePoint.y}
                x2={activePoint.x}
                y2={activePoint.y}
              />
              <line
                class="generated-title-odds-guide-line"
                x1={activePoint.x}
                y1={activePoint.y}
                x2={activePoint.x}
                y2={PLOT_HEIGHT - PLOT_MARGIN.bottom}
              />
              <circle
                class="generated-title-odds-active-ring"
                cx={activePoint.x}
                cy={activePoint.y}
                r={focusedEntry.isCurrentUser ? 11 : 9}
              />
              <line
                class="generated-title-odds-label-line"
                x1={activeLabel.x}
                y1={activeLabel.y}
                x2={activeLabel.labelX}
                y2={activeLabel.labelY - 5}
              />
              <text
                class={`generated-title-odds-point-label ${focusedEntry.deltaPct >= 0 ? 'is-up' : 'is-down'}`}
                x={activeLabel.labelX}
                y={activeLabel.labelY}
                text-anchor={activeLabel.anchor}
              >
                {focusedEntry.displayName}
              </text>
            {/if}
          </svg>
        </div>

        <div class="generated-title-odds-side">
          <div class="generated-title-odds-list">
            <div class="generated-title-odds-list-kicker mm-compact-eyebrow">All Brackets</div>
            <div class="generated-title-odds-list-columns">
              <span>Bracket</span>
              <span>All</span>
              <span>Likely</span>
            </div>
            <div class="generated-title-odds-list-rows">
              {#each sortedRows as row}
                <button
                  type="button"
                  class={`generated-title-odds-list-row ${row.deltaPct >= 0 ? 'is-up' : 'is-down'} ${row.isCurrentUser ? 'is-current-user' : ''} ${focusedEntry?.entryId === row.entryId ? 'is-active' : ''} ${pinnedEntryId === row.entryId ? 'is-pinned' : ''}`}
                  on:mouseenter={() => setHovered(row.entryId)}
                  on:mouseleave={() => setHovered(null)}
                  on:focus={() => setHovered(row.entryId)}
                  on:blur={() => setHovered(null)}
                  on:click={() => togglePinned(row.entryId)}
                  aria-label={`${row.displayName}: all paths ${formatPercent(row.exactPct)}, likely paths ${formatPercent(row.weightedPct)}`}
                >
                  <div class="generated-title-odds-list-name">
                    <span>{row.displayName}</span>
                    {#if row.isCurrentUser}
                      <span class="generated-title-odds-you">You</span>
                    {/if}
                  </div>
                  <div
                    class="generated-title-odds-list-value is-heatmap"
                    style={getSummaryCellStyle(row.exactPct, exactRange)}
                  >
                    {formatPercent(row.exactPct)}
                  </div>
                  <div
                    class="generated-title-odds-list-value is-heatmap is-weighted"
                    style={getSummaryCellStyle(row.weightedPct, weightedRange)}
                  >
                    {formatPercent(row.weightedPct)}
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
  .generated-title-odds {
    display: grid;
    gap: 1rem;
  }

  .generated-title-odds-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--mm-muted);
  }

  .generated-title-odds-plot {
    display: grid;
    gap: 1rem;
  }

  .generated-title-odds-legend {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.9rem;
  }

  .generated-title-odds-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--mm-muted);
    font-size: 0.8rem;
  }

  .generated-title-odds-legend-marker {
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 999px;
    display: inline-flex;
  }

  .generated-title-odds-legend-marker.is-up {
    background: #86efac;
    box-shadow: 0 0 0 3px rgba(134, 239, 172, 0.15);
  }

  .generated-title-odds-legend-marker.is-down {
    background: #fda4af;
    box-shadow: 0 0 0 3px rgba(253, 164, 175, 0.15);
  }

  .generated-title-odds-legend-marker.is-you {
    background: #93c5fd;
    box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.2);
  }

  .generated-title-odds-plot-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(17rem, 20rem);
    gap: 1rem;
    align-items: start;
  }

  .generated-title-odds-side {
    min-width: 0;
  }

  .generated-title-odds-chart-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 1rem;
    background:
      radial-gradient(circle at top, rgba(245, 158, 11, 0.08), transparent 38%),
      rgba(13, 13, 15, 0.9);
    padding: 0.75rem;
  }

  .generated-title-odds-chart {
    width: 100%;
    min-width: 46rem;
    height: auto;
    display: block;
  }

  .generated-title-odds-grid-line {
    stroke: rgba(255, 255, 255, 0.08);
    stroke-width: 1;
  }

  .generated-title-odds-diagonal {
    stroke: rgba(252, 211, 77, 0.55);
    stroke-width: 2;
    stroke-dasharray: 8 8;
  }

  .generated-title-odds-axis-line {
    stroke: rgba(255, 255, 255, 0.22);
    stroke-width: 1.4;
  }

  .generated-title-odds-axis-label {
    fill: var(--mm-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .generated-title-odds-axis-title {
    fill: var(--mm-text);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .generated-title-odds-note {
    fill: rgba(254, 240, 138, 0.9);
    font-size: 12px;
    font-weight: 700;
  }

  .generated-title-odds-hit {
    cursor: pointer;
  }

  .generated-title-odds-point {
    opacity: 0.92;
    stroke-width: 2.5;
    transition: r 140ms ease, opacity 140ms ease, transform 140ms ease;
  }

  .generated-title-odds-point.is-up {
    fill: rgba(134, 239, 172, 0.9);
    stroke: rgba(187, 247, 208, 0.9);
  }

  .generated-title-odds-point.is-down {
    fill: rgba(253, 164, 175, 0.9);
    stroke: rgba(254, 205, 211, 0.92);
  }

  .generated-title-odds-point.is-current-user {
    fill: rgba(147, 197, 253, 0.98);
    stroke: rgba(219, 234, 254, 0.98);
  }

  .generated-title-odds-point.is-active {
    opacity: 1;
  }

  .generated-title-odds-guide-line {
    stroke: rgba(255, 255, 255, 0.18);
    stroke-width: 1.5;
    stroke-dasharray: 4 6;
    pointer-events: none;
  }

  .generated-title-odds-active-ring {
    fill: none;
    stroke: rgba(255, 255, 255, 0.72);
    stroke-width: 2;
    pointer-events: none;
  }

  .generated-title-odds-label-line {
    stroke: rgba(255, 255, 255, 0.18);
    stroke-width: 1.5;
    pointer-events: none;
  }

  .generated-title-odds-point-label {
    font-size: 12px;
    font-weight: 700;
    pointer-events: none;
  }

  .generated-title-odds-point-label.is-up {
    fill: #bbf7d0;
  }

  .generated-title-odds-point-label.is-down {
    fill: #fecdd3;
  }

  .generated-title-odds-list {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(16, 16, 18, 0.82);
    padding: 0.65rem 0.7rem;
    display: grid;
    gap: 0.35rem;
  }

  .generated-title-odds-list-kicker {
    display: block;
  }

  .generated-title-odds-list-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4.1rem 4.6rem;
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

  .generated-title-odds-list-rows {
    display: grid;
    gap: 0;
    max-height: 32rem;
    overflow: auto;
  }

  .generated-title-odds-list-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4.1rem 4.6rem;
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

  .generated-title-odds-list-row.is-active {
    background: rgba(252, 211, 77, 0.08);
  }

  .generated-title-odds-list-row.is-current-user {
    background-image: linear-gradient(90deg, rgba(59, 130, 246, 0.12), transparent 42%);
  }

  .generated-title-odds-list-row.is-pinned {
    background-color: rgba(252, 211, 77, 0.06);
  }

  .generated-title-odds-list-name {
    display: flex;
    flex-wrap: wrap;
    gap: 0.28rem;
    align-items: center;
    color: var(--mm-text);
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 0;
  }

  .generated-title-odds-list-value {
    color: var(--mm-muted);
    font-size: 0.7rem;
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
  }

  .generated-title-odds-list-value.is-heatmap {
    border-radius: 0.4rem;
    padding: 0.16rem 0.32rem;
  }

  .generated-title-odds-list-value.is-weighted {
    color: #fde68a;
  }

  .generated-title-odds-you {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.15);
    color: #bfdbfe;
    padding: 0.1rem 0.45rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  @media (max-width: 1023px) {
    .generated-title-odds-plot-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 767px) {
    .generated-title-odds-chart {
      min-width: 40rem;
    }
  }
</style>
