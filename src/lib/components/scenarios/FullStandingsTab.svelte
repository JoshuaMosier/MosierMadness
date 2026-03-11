<script lang="ts">
  import { getRowHeatmapColor, getOrdinalSuffix, getSortedPositionData } from '$lib/utils/scenarioEngine';

  export let positionProbabilities: any[] = [];
  export let totalScenarios: number = 0;
  export let numEntries: number = 0;
  export let displayMode: string = 'percent';

  let hoveredRow: number | null = null;
  let hoveredCol: number | null = null;
  let hoveredCell: string | null = null;
</script>

<div class="mb-2 text-xs text-zinc-400 flex justify-between items-center">
  <p>Table sorted by best possible finish, then by probability of that finish. A dash (-) indicates zero scenarios. Total scenarios: {totalScenarios.toLocaleString()}</p>

  <div class="flex items-center gap-1">
    <span class="text-zinc-300">Display:</span>
    <button
      class={`px-3 py-1 text-xs rounded ${displayMode === 'count' ? 'bg-amber-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
      on:click={() => displayMode = 'count'}
    >
      Counts
    </button>
    <button
      class={`px-3 py-1 text-xs rounded ${displayMode === 'percent' ? 'bg-amber-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
      on:click={() => displayMode = 'percent'}
    >
      Percentages
    </button>
  </div>
</div>
<div class="overflow-x-auto pb-4 max-h-[70vh]">
  <table class="min-w-full divide-y divide-zinc-700 whitespace-nowrap">
    <thead class="bg-zinc-800 sticky top-0 z-10">
      <tr>
        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider sticky left-0 bg-zinc-800 z-20">
          Name
        </th>
        {#each Array(numEntries) as _, i}
          <th scope="col"
              class="py-2 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider w-20 bg-zinc-800 transition-colors duration-150"
              class:bg-amber-800={hoveredCol === i}
          >
            {i + 1}{getOrdinalSuffix(i + 1)}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="bg-zinc-800/50 divide-y divide-zinc-700">
      {#each getSortedPositionData(positionProbabilities) as user, i}
        {@const userProbabilities = Object.values(user.positionProbabilities)}
        {@const maxProbability = Math.max(...userProbabilities, 0.1)}
        <tr class={i % 2 === 0 ? 'bg-zinc-800' : ''}>
          <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-zinc-300 sticky left-0 z-10 transition-colors duration-150"
              class:bg-amber-800={hoveredRow === i}
              class:bg-zinc-700={i % 2 === 0 && hoveredRow !== i}
              class:bg-zinc-800={i % 2 !== 0 && hoveredRow !== i}>
            {user.firstName} {user.lastName}
          </td>
          {#each Array(numEntries) as _, j}
            {@const position = j + 1}
            {@const count = user.positions[position] || 0}
            {@const probability = user.positionProbabilities[position] || 0}
            <td class="py-2 whitespace-nowrap text-center min-w-[2.5rem]"
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
                class:ring-2={hoveredCell === `${i}-${j}`}
                class:ring-stone-300={hoveredCell === `${i}-${j}`}
                class:ring-inset={hoveredCell === `${i}-${j}`}>
              <span class="{count === 0 ? 'text-zinc-500 font-normal' : 'text-white font-medium'} text-xs">
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

<div class="mt-4 p-3 bg-zinc-800/30 rounded text-xs text-zinc-400">
  <div class="flex items-center justify-center gap-6 mb-2">
    <div class="flex items-center gap-1">
      <div class="w-4 h-4 rounded" style="background-color: hsla(120, 65%, 45%, 0.8)"></div>
      <span>Most common position</span>
    </div>
    <div class="flex items-center gap-1">
      <div class="w-4 h-4 rounded" style="background-color: hsla(60, 65%, 45%, 0.6)"></div>
      <span>Medium frequency</span>
    </div>
    <div class="flex items-center gap-1">
      <div class="w-4 h-4 rounded" style="background-color: hsla(0, 65%, 45%, 0.4)"></div>
      <span>Less common position</span>
    </div>
    <div class="flex items-center gap-1">
      <div class="w-4 h-4 rounded" style="background-color: rgba(50, 50, 50, 0.2)"></div>
      <span>0 scenarios</span>
    </div>
  </div>
</div>
