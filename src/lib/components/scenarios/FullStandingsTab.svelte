<script lang="ts">
  import { getRowHeatmapColor, getOrdinalSuffix, getSortedPositionData } from '$lib/utils/scenarioEngine';

  export let positionProbabilities: any[] = [];
  export let totalScenarios: number = 0;
  export let numEntries: number = 0;
  export let displayMode: string = 'percent';

  let hoveredRow: number | null = null;
  let hoveredCol: number | null = null;
  let hoveredCell: string | null = null;

  function getRowClass(index: number): string {
    return `scenario-standings-row ${index % 2 === 0 ? 'is-even' : 'is-odd'}`;
  }

  function getNameCellClass(index: number): string {
    const stripeClass = index % 2 === 0 ? 'is-even' : 'is-odd';
    return `scenario-standings-namecell ${hoveredRow === index ? 'is-hovered' : stripeClass}`;
  }
</script>

<div class="scenario-standings-toolbar">
  <p class="scenario-standings-copy">Table sorted by best possible finish, then by probability of that finish. A dash (-) indicates zero scenarios. Total scenarios: {totalScenarios.toLocaleString()}</p>

  <div class="scenario-standings-toggle">
    <span class="scenario-standings-label">Display:</span>
    <button
      class={`scenario-standings-button ${displayMode === 'count' ? 'is-active' : ''}`}
      on:click={() => displayMode = 'count'}
    >
      Counts
    </button>
    <button
      class={`scenario-standings-button ${displayMode === 'percent' ? 'is-active' : ''}`}
      on:click={() => displayMode = 'percent'}
    >
      Percentages
    </button>
  </div>
</div>
<div class="scenario-standings-table-wrap">
  <table class="scenario-standings-table">
    <thead class="scenario-standings-head">
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
      {#each getSortedPositionData(positionProbabilities) as user, i}
        {@const userProbabilities = Object.values(user.positionProbabilities)}
        {@const maxProbability = Math.max(...userProbabilities, 0.1)}
        <tr class={getRowClass(i)}>
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
    min-height: 1.95rem;
    padding: 0.28rem 0.72rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-muted);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .scenario-standings-button.is-active {
    color: white;
    background: rgba(217, 119, 6, 0.9);
    border-color: rgba(217, 119, 6, 0.9);
  }

  .scenario-standings-table-wrap {
    overflow-x: auto;
    padding-bottom: 1rem;
    max-height: 70vh;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(14, 14, 15, 0.92);
  }

  .scenario-standings-table {
    min-width: 100%;
    border-collapse: collapse;
    white-space: nowrap;
  }

  .scenario-standings-head {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(18, 18, 19, 0.98);
  }

  .scenario-standings-table th {
    padding: 0.68rem 0.75rem;
    color: var(--mm-subtle);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    text-align: center;
  }

  .scenario-standings-sticky {
    position: sticky;
    left: 0;
    z-index: 20;
    background: rgba(18, 18, 19, 0.98);
    text-align: left;
  }

  .scenario-standings-colhead {
    width: 5rem;
    transition: background-color 150ms ease;
  }

  .scenario-standings-colhead.is-hovered {
    background: rgba(146, 64, 14, 0.42);
  }

  .scenario-standings-body {
    background: rgba(255, 255, 255, 0.015);
  }

  .scenario-standings-row.is-even {
    background: rgba(255, 255, 255, 0.025);
  }

  .scenario-standings-row.is-odd {
    background: rgba(8, 8, 9, 0.1);
  }

  .scenario-standings-namecell {
    position: sticky;
    left: 0;
    z-index: 10;
    padding: 0.62rem 0.75rem;
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

  .scenario-standings-cell {
    min-width: 2.5rem;
    padding: 0.5rem 0;
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

  .scenario-standings-legend {
    margin-top: 0.85rem;
    padding: 0.85rem 1rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.03);
    color: var(--mm-muted);
    font-size: 0.76rem;
  }

  .scenario-standings-legend-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.4rem;
    flex-wrap: wrap;
  }

  .scenario-standings-legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .scenario-standings-legend-swatch {
    width: 0.95rem;
    height: 0.95rem;
    border-radius: 0.28rem;
  }

  @media (max-width: 767px) {
    .scenario-standings-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
