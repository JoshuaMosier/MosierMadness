<script lang="ts">
  import { getRowHeatmapColor, getOrdinalSuffix, getSortedPositionData } from '$lib/utils/scenarioEngine';

  export let positionProbabilities: any[] = [];
  export let totalScenarios: number = 0;
  export let numEntries: number = 0;
  export let displayMode: string = 'percent';
  export let currentUserEntryId: string | null = null;

  let hoveredRow: number | null = null;
  let hoveredCol: number | null = null;
  let hoveredCell: string | null = null;
  let standingsView: 'summary' | 'matrix' = 'summary';

  type SummaryBucket = {
    label: string;
    start: number;
    end: number;
    color: string;
  };

  function getRowClass(index: number): string {
    return `scenario-standings-row ${index % 2 === 0 ? 'is-even' : 'is-odd'}`;
  }

  function getNameCellClass(index: number): string {
    const stripeClass = index % 2 === 0 ? 'is-even' : 'is-odd';
    return `scenario-standings-namecell ${hoveredRow === index ? 'is-hovered' : stripeClass}`;
  }

  function getSummaryRowClass(index: number): string {
    return `scenario-summary-row ${index % 2 === 0 ? 'is-even' : 'is-odd'}`;
  }

  function getSummaryNameCellClass(index: number): string {
    return `scenario-summary-namecell ${index % 2 === 0 ? 'is-even' : 'is-odd'}`;
  }

  function getEntryHref(user: any): string {
    const nameIdentifier = `${user.firstName || ''}|${user.lastName || ''}`;
    return `/entries?selected=${encodeURIComponent(nameIdentifier)}`;
  }

  function isCurrentUserEntry(user: any): boolean {
    return Boolean(currentUserEntryId && user.entryId && user.entryId === currentUserEntryId);
  }

  function getSummaryBuckets(totalEntries: number): SummaryBucket[] {
    const starts = [1, 2, 4, 9, 17, 33];
    const colors = [
      'rgba(245, 158, 11, 0.96)',
      'rgba(217, 119, 6, 0.92)',
      'rgba(161, 98, 7, 0.82)',
      'rgba(113, 113, 122, 0.82)',
      'rgba(82, 82, 91, 0.82)',
      'rgba(69, 10, 10, 0.76)',
    ];

    return starts
      .map((start, index) => {
        const nextStart = starts[index + 1];
        const end = nextStart ? Math.min(totalEntries, nextStart - 1) : totalEntries;
        const label =
          start > totalEntries
            ? null
            : !nextStart && start >= 33
              ? `${start}+`
              : start === end
                ? `${start}`
                : `${start}-${end}`;

        return label
          ? {
              label,
              start,
              end,
              color: colors[index],
            }
          : null;
      })
      .filter((bucket): bucket is SummaryBucket => Boolean(bucket));
  }

  function sumCounts(record: Record<number, number>, start: number, end: number): number {
    let total = 0;
    for (let position = start; position <= end; position += 1) {
      total += record[position] || 0;
    }
    return total;
  }

  function sumProbabilities(record: Record<number, number>, start: number, end: number): number {
    let total = 0;
    for (let position = start; position <= end; position += 1) {
      total += record[position] || 0;
    }
    return total;
  }

  function formatScenarioValue(probability: number, count: number): string {
    if (displayMode === 'count') {
      return count === 0 ? '-' : count.toLocaleString();
    }

    return probability === 0 ? '-' : `${probability.toFixed(1)}%`;
  }

  function clamp(value: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, value));
  }

  function getMetricDisplayValue(metric: { probability: number; count: number }): number {
    return displayMode === 'count' ? metric.count : metric.probability;
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

  function getSummaryCellStyle(
    value: number,
    range: { min: number; max: number },
    invert = false,
  ): string {
    if (!Number.isFinite(value)) {
      return 'background-color: rgba(255, 255, 255, 0.03);';
    }

    if (range.max === range.min) {
      return 'background-color: rgba(255, 255, 255, 0.03);';
    }

    const normalized = clamp((value - range.min) / (range.max - range.min));
    const strength = invert ? 1 - normalized : normalized;
    const hue = Math.round(strength * 120);
    const alpha = 0.18 + strength * 0.44;
    const borderAlpha = 0.12 + strength * 0.24;

    return [
      `background-color: hsla(${hue}, 64%, 38%, ${alpha.toFixed(3)})`,
      `box-shadow: inset 0 0 0 1px hsla(${hue}, 70%, 52%, ${borderAlpha.toFixed(3)})`,
    ].join('; ');
  }

  function getExpectedFinish(user: any): number {
    let weightedTotal = 0;
    let totalCount = 0;

    for (let position = 1; position <= numEntries; position += 1) {
      const count = user.positions[position] || 0;
      weightedTotal += position * count;
      totalCount += count;
    }

    return totalCount > 0 ? weightedTotal / totalCount : numEntries;
  }

  function formatExpectedFinish(value: number): string {
    return value.toFixed(1).replace(/\.0$/, '');
  }

  $: sortedUsers = getSortedPositionData(positionProbabilities);
  $: summaryBuckets = getSummaryBuckets(numEntries);
  $: podiumLimit = Math.min(3, numEntries);
  $: podiumLabel = podiumLimit >= 3 ? 'Podium' : `Top ${podiumLimit}`;
  $: topGroupLimit = Math.max(1, Math.ceil(numEntries / 4));
  $: topGroupLabel = topGroupLimit === 1 ? 'Top 1' : `Top ${topGroupLimit}`;
  $: summaryRows = sortedUsers.map((user) => {
    const winCount = sumCounts(user.positions, 1, 1);
    const winProbability = sumProbabilities(user.positionProbabilities, 1, 1);
    const podiumCount = sumCounts(user.positions, 1, podiumLimit);
    const podiumProbability = sumProbabilities(user.positionProbabilities, 1, podiumLimit);
    const topGroupCount = sumCounts(user.positions, 1, topGroupLimit);
    const topGroupProbability = sumProbabilities(user.positionProbabilities, 1, topGroupLimit);
    const expectedFinish = getExpectedFinish(user);

    return {
      ...user,
      win: { count: winCount, probability: winProbability },
      podium: { count: podiumCount, probability: podiumProbability },
      topGroup: { count: topGroupCount, probability: topGroupProbability },
      expectedFinish,
      distribution: summaryBuckets.map((bucket) => ({
        ...bucket,
        count: sumCounts(user.positions, bucket.start, bucket.end),
        probability: sumProbabilities(user.positionProbabilities, bucket.start, bucket.end),
      })),
    };
  });
  $: summaryColumnRanges = {
    win: getValueRange(summaryRows.map((user) => getMetricDisplayValue(user.win))),
    podium: getValueRange(summaryRows.map((user) => getMetricDisplayValue(user.podium))),
    topGroup: getValueRange(summaryRows.map((user) => getMetricDisplayValue(user.topGroup))),
    expected: getValueRange(summaryRows.map((user) => user.expectedFinish)),
  };
</script>

<div class="scenario-standings-toolbar">
  <p class="scenario-standings-copy">
  </p>

  <div class="scenario-standings-toolbar-controls">
    <div class="scenario-standings-toggle">
      <span class="scenario-standings-label">View:</span>
      <button
        class={`scenario-standings-button mm-toggle-button ${standingsView === 'summary' ? 'is-active' : ''}`}
        on:click={() => standingsView = 'summary'}
      >
        Summary
      </button>
      <button
        class={`scenario-standings-button mm-toggle-button ${standingsView === 'matrix' ? 'is-active' : ''}`}
        on:click={() => standingsView = 'matrix'}
      >
        Exact Matrix
      </button>
    </div>

    <div class="scenario-standings-toggle">
      <span class="scenario-standings-label">Display:</span>
      <button
        class={`scenario-standings-button mm-toggle-button ${displayMode === 'count' ? 'is-active' : ''}`}
        on:click={() => displayMode = 'count'}
      >
        Counts
      </button>
      <button
        class={`scenario-standings-button mm-toggle-button ${displayMode === 'percent' ? 'is-active' : ''}`}
        on:click={() => displayMode = 'percent'}
      >
        Percentages
      </button>
    </div>
  </div>
</div>

{#if standingsView === 'summary'}
  <div class="scenario-summary-wrap mm-data-table-frame mm-data-table-scroll">
    <table class="scenario-summary-table mm-data-table mm-data-table--compact mm-data-table--centered">
      <thead class="scenario-summary-head mm-data-table-head-sticky">
        <tr>
          <th scope="col" class="scenario-summary-sticky">Name</th>
          <th scope="col">1st</th>
          <th scope="col">{podiumLabel}</th>
          <th scope="col">{topGroupLabel}</th>
          <th scope="col">Expected</th>
          <th scope="col" class="scenario-summary-distribution-head">Finish Distribution</th>
        </tr>
      </thead>
      <tbody class="scenario-summary-body">
        {#each summaryRows as user, i}
          <tr
            class={getSummaryRowClass(i)}
            class:is-current-user={isCurrentUserEntry(user)}
            class:mm-data-table-row-highlight={isCurrentUserEntry(user)}
          >
            <td class={getSummaryNameCellClass(i)}>
              <a href={getEntryHref(user)} class="scenario-summary-namepill mm-pill-link">
                <span class="scenario-summary-name">
                  {user.displayName || `${user.firstName} ${user.lastName}`.trim()}
                </span>
              </a>
            </td>
            <td
              class="scenario-summary-metric is-heatmap"
              style={getSummaryCellStyle(getMetricDisplayValue(user.win), summaryColumnRanges.win)}
            >
              {formatScenarioValue(user.win.probability, user.win.count)}
            </td>
            <td
              class="scenario-summary-metric is-heatmap"
              style={getSummaryCellStyle(getMetricDisplayValue(user.podium), summaryColumnRanges.podium)}
            >
              {formatScenarioValue(user.podium.probability, user.podium.count)}
            </td>
            <td
              class="scenario-summary-metric is-heatmap"
              style={getSummaryCellStyle(getMetricDisplayValue(user.topGroup), summaryColumnRanges.topGroup)}
            >
              {formatScenarioValue(user.topGroup.probability, user.topGroup.count)}
            </td>
            <td
              class="scenario-summary-expected is-heatmap"
              style={getSummaryCellStyle(user.expectedFinish, summaryColumnRanges.expected, true)}
            >
              {formatExpectedFinish(user.expectedFinish)}
            </td>
            <td class="scenario-summary-distribution-cell">
              <div class="scenario-summary-bar" aria-label="Finish distribution">
                {#each user.distribution as bucket}
                  <div
                    class="scenario-summary-segment"
                    style={`width: ${bucket.probability}%; background: ${bucket.color};`}
                    title={`${bucket.label}: ${formatScenarioValue(bucket.probability, bucket.count)}`}
                  ></div>
                {/each}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="scenario-summary-legend">
    <div class="scenario-summary-legend-row">
      {#each summaryBuckets as bucket}
        <div class="scenario-summary-legend-item">
          <div class="scenario-summary-legend-swatch" style={`background: ${bucket.color};`}></div>
          <span>{bucket.label}</span>
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="scenario-standings-table-wrap mm-data-table-frame mm-data-table-scroll">
    <table class="scenario-standings-table mm-data-table mm-data-table--compact mm-data-table--centered">
      <thead class="scenario-standings-head mm-data-table-head-sticky">
        <tr>
          <th scope="col" class="scenario-standings-sticky">
            Name
          </th>
          {#each Array(numEntries) as _, i}
            <th
              scope="col"
              class={`scenario-standings-colhead ${hoveredCol === i ? 'is-hovered' : ''}`}
            >
              {i + 1}{getOrdinalSuffix(i + 1)}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="scenario-standings-body">
        {#each sortedUsers as user, i}
          {@const userProbabilities = Object.values(user.positionProbabilities)}
          {@const maxProbability = Math.max(...userProbabilities, 0.1)}
          <tr
            class={getRowClass(i)}
            class:is-current-user={isCurrentUserEntry(user)}
            class:mm-data-table-row-highlight={isCurrentUserEntry(user)}
          >
            <td class={getNameCellClass(i)}>
              {user.displayName || `${user.firstName} ${user.lastName}`.trim()}
            </td>
            {#each Array(numEntries) as _, j}
              {@const position = j + 1}
              {@const count = user.positions[position] || 0}
              {@const probability = user.positionProbabilities[position] || 0}
              <td
                class={`scenario-standings-cell ${hoveredCell === `${i}-${j}` ? 'is-hovered' : ''}`}
                style="background-color: {getRowHeatmapColor(probability, maxProbability)}"
                on:mouseenter={() => {
                  hoveredRow = i;
                  hoveredCol = j;
                  hoveredCell = `${i}-${j}`;
                }}
                on:mouseleave={() => {
                  hoveredRow = null;
                  hoveredCol = null;
                  hoveredCell = null;
                }}
              >
                <span class={`scenario-standings-value ${count === 0 ? 'is-empty' : 'is-filled'}`}>
                  {#if displayMode === 'count'}
                    {count === 0 ? '-' : count.toLocaleString()}
                  {:else}
                    {probability === 0 ? '-' : probability.toFixed(1) + '%'}
                  {/if}
                </span>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="scenario-standings-legend">
    <div class="scenario-standings-legend-row">
      <div class="scenario-standings-legend-item">
        <div class="scenario-standings-legend-swatch" style="background-color: hsla(120, 65%, 45%, 0.8)"></div>
        <span>Most common position</span>
      </div>
      <div class="scenario-standings-legend-item">
        <div class="scenario-standings-legend-swatch" style="background-color: hsla(60, 65%, 45%, 0.6)"></div>
        <span>Medium frequency</span>
      </div>
      <div class="scenario-standings-legend-item">
        <div class="scenario-standings-legend-swatch" style="background-color: hsla(0, 65%, 45%, 0.4)"></div>
        <span>Less common position</span>
      </div>
      <div class="scenario-standings-legend-item">
        <div class="scenario-standings-legend-swatch" style="background-color: rgba(50, 50, 50, 0.2)"></div>
        <span>0 scenarios</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .scenario-standings-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.7rem;
    color: var(--mm-muted);
    font-size: 0.76rem;
  }

  .scenario-standings-copy {
    margin: 0;
    max-width: 48rem;
  }

  .scenario-standings-toolbar-controls {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .scenario-standings-toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .scenario-standings-label {
    color: var(--mm-text);
  }

  .scenario-standings-button {
    flex-shrink: 0;
  }

  .scenario-summary-wrap,
  .scenario-standings-table-wrap {
    padding-bottom: 1rem;
    max-height: 70vh;
  }

  .scenario-summary-table,
  .scenario-standings-table {
    min-width: 100%;
    white-space: nowrap;
  }

  .scenario-summary-sticky,
  .scenario-standings-sticky {
    position: sticky;
    left: 0;
    z-index: 20;
    background: rgba(18, 18, 19, 0.98);
    text-align: left;
  }

  .scenario-summary-distribution-head {
    min-width: 13rem;
  }

  .scenario-summary-namecell {
    position: sticky;
    left: 0;
    z-index: 10;
    padding: 0.34rem 0.62rem;
    text-align: center;
  }

  .scenario-summary-namecell.is-even {
    background: rgba(37, 37, 39, 0.98);
  }

  .scenario-summary-namecell.is-odd {
    background: rgba(25, 25, 27, 0.98);
  }

  .scenario-summary-row.is-current-user .scenario-summary-namecell {
    background:
      linear-gradient(90deg, rgba(180, 83, 9, 0.24), rgba(245, 158, 11, 0.08) 44%, rgba(33, 33, 36, 0.98));
    box-shadow: inset 3px 0 0 rgba(245, 158, 11, 0.52);
  }

  .scenario-summary-metric,
  .scenario-summary-expected,
  .scenario-summary-distribution-cell {
    padding: 0.34rem 0.62rem;
    text-align: center;
    color: var(--mm-text);
  }

  .scenario-summary-metric,
  .scenario-summary-expected {
    font-size: 0.79rem;
    font-weight: 700;
  }

  .scenario-summary-metric.is-heatmap,
  .scenario-summary-expected.is-heatmap {
    color: white;
  }

  .scenario-summary-namepill {
    width: min(100%, 13.5rem);
    max-width: 100%;
    padding: 0.22rem 0.72rem;
    text-decoration: none;
  }

  .scenario-summary-name {
    display: block;
    overflow: hidden;
    color: var(--mm-text);
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.15;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scenario-summary-row.is-current-user .scenario-summary-namepill {
    border-color: rgba(245, 158, 11, 0.2);
    background: rgba(245, 158, 11, 0.08);
  }

  .scenario-summary-row.is-current-user .scenario-summary-name {
    color: #fde68a;
  }

  .scenario-summary-distribution-cell {
    min-width: 11rem;
  }

  .scenario-summary-bar {
    display: flex;
    overflow: hidden;
    width: 100%;
    height: 0.72rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .scenario-summary-segment {
    height: 100%;
  }

  .scenario-summary-legend,
  .scenario-standings-legend {
    margin-top: 0.85rem;
    padding: 0.85rem 1rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.03);
    color: var(--mm-muted);
    font-size: 0.76rem;
  }

  .scenario-summary-legend-row,
  .scenario-standings-legend-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    flex-wrap: wrap;
  }

  .scenario-summary-legend-item,
  .scenario-standings-legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .scenario-summary-legend-swatch,
  .scenario-standings-legend-swatch {
    width: 0.95rem;
    height: 0.95rem;
    border-radius: 0.28rem;
  }

  .scenario-standings-colhead {
    width: 5rem;
    transition: background-color 150ms ease;
  }

  .scenario-standings-colhead.is-hovered {
    background: rgba(146, 64, 14, 0.42);
  }

  .scenario-standings-namecell {
    position: sticky;
    left: 0;
    z-index: 10;
    padding: 0.44rem 0.68rem;
    color: var(--mm-text);
    font-size: 0.88rem;
    font-weight: 600;
    transition: background-color 150ms ease;
  }

  .scenario-standings-namecell.is-even {
    background: rgba(37, 37, 39, 0.98);
  }

  .scenario-standings-namecell.is-odd {
    background: rgba(25, 25, 27, 0.98);
  }

  .scenario-standings-namecell.is-hovered {
    background: rgba(146, 64, 14, 0.46);
  }

  .scenario-standings-row.is-current-user .scenario-standings-namecell {
    color: #fde68a;
    background:
      linear-gradient(90deg, rgba(180, 83, 9, 0.24), rgba(245, 158, 11, 0.08) 44%, rgba(33, 33, 36, 0.98));
    box-shadow: inset 3px 0 0 rgba(245, 158, 11, 0.52);
  }

  .scenario-standings-cell {
    min-width: 2.5rem;
    padding: 0.34rem 0;
    white-space: nowrap;
    text-align: center;
    box-shadow: inset 0 0 0 1px rgba(10, 10, 11, 0.18);
    transition: box-shadow 150ms ease;
  }

  .scenario-standings-cell.is-hovered {
    box-shadow: inset 0 0 0 2px rgba(214, 211, 209, 0.85);
  }

  .scenario-standings-value {
    font-size: 0.75rem;
  }

  .scenario-standings-value.is-filled {
    color: white;
    font-weight: 600;
  }

  .scenario-standings-value.is-empty {
    color: #71717a;
    font-weight: 400;
  }

  @media (max-width: 767px) {
    .scenario-standings-toolbar {
      align-items: stretch;
      gap: 0.55rem;
    }

    .scenario-standings-toolbar-controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
      align-items: stretch;
      gap: 0.45rem;
      width: 100%;
    }

    .scenario-standings-toggle {
      width: 100%;
      min-width: 0;
      gap: 0.4rem;
    }

    .scenario-standings-copy,
    .scenario-summary-legend,
    .scenario-standings-legend {
      display: none;
    }

    .scenario-standings-label {
      display: none;
    }

    .scenario-standings-button {
      flex: 1 1 0;
      min-width: 0;
      min-height: 1.8rem;
      padding: 0.24rem 0.46rem;
      font-size: 0.69rem;
    }

    .scenario-summary-wrap,
    .scenario-standings-table-wrap {
      max-height: none;
      padding-bottom: 0;
    }

    .scenario-summary-table th,
    .scenario-standings-table th {
      padding: 0.5rem 0.58rem;
      font-size: 0.62rem;
    }

    .scenario-summary-table th:nth-child(3),
    .scenario-summary-table td:nth-child(3),
    .scenario-summary-table th:nth-child(6),
    .scenario-summary-table td:nth-child(6) {
      display: none;
    }

    .scenario-summary-namecell,
    .scenario-summary-metric,
    .scenario-summary-expected {
      padding: 0.28rem 0.45rem;
    }

    .scenario-summary-namepill {
      width: min(100%, 9.5rem);
      padding: 0.2rem 0.56rem;
    }

    .scenario-summary-name {
      font-size: 0.8rem;
    }

    .scenario-summary-metric,
    .scenario-summary-expected {
      font-size: 0.72rem;
    }

    .scenario-standings-cell {
      min-width: 2.2rem;
      padding: 0.28rem 0;
    }

    .scenario-standings-namecell {
      padding: 0.36rem 0.52rem;
      font-size: 0.8rem;
    }

    .scenario-standings-value {
      font-size: 0.69rem;
    }
  }
</style>
