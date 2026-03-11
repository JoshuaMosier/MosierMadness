<script lang="ts">
  export let data: any;

  const { person, aliases, titleYears, yearlyResults, summary } = data;
</script>

<svelte:head>
  <title>Mosier Madness - {person.displayName}</title>
  <meta
    name="description"
    content={`Historical Mosier Madness profile for ${person.displayName}, including titles, placements, and yearly results.`}
  />
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
  <div class="mb-10">
    <a class="text-amber-400 hover:text-amber-300 transition-colors text-sm" href="/past-winners">Back to Hall of Champions</a>
    <h1 class="text-4xl font-bold text-zinc-100 mt-3">{person.displayName}</h1>
    <p class="text-zinc-400 mt-3 max-w-3xl">
      Historical profile pages focus on legacy tournament results, titles, aliases, and year-by-year finishes.
    </p>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-12">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div class="text-xs text-zinc-500 uppercase">Titles</div>
      <div class="text-3xl font-bold text-amber-500 mt-2">{summary.titles}</div>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div class="text-xs text-zinc-500 uppercase">Appearances</div>
      <div class="text-3xl font-bold text-amber-500 mt-2">{summary.appearances}</div>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div class="text-xs text-zinc-500 uppercase whitespace-nowrap">Avg Pctile</div>
      <div class="text-3xl font-bold text-amber-500 mt-2">{summary.averagePercentile ? `${summary.averagePercentile}%` : 'N/A'}</div>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div class="text-xs text-zinc-500 uppercase">Avg Finish</div>
      <div class="text-3xl font-bold text-amber-500 mt-2">{summary.averageFinish || 'N/A'}</div>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div class="text-xs text-zinc-500 uppercase">Best Finish</div>
      <div class="text-3xl font-bold text-amber-500 mt-2">{summary.bestFinish || 'N/A'}</div>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div class="text-xs text-zinc-500 uppercase">Avg Score</div>
      <div class="text-3xl font-bold text-amber-500 mt-2">{summary.averageScore || 'N/A'}</div>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div class="text-xs text-zinc-500 uppercase">Best Score</div>
      <div class="text-3xl font-bold text-amber-500 mt-2">{summary.bestScore || 'N/A'}</div>
    </div>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 class="text-xl font-semibold text-zinc-100 mb-4">Championship Years</h2>
      {#if titleYears.length}
        <div class="flex flex-wrap gap-2">
          {#each titleYears as year}
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-900/60 text-amber-300 text-sm font-medium">
              {year}
            </span>
          {/each}
        </div>
      {:else}
        <p class="text-zinc-400">No titles recorded.</p>
      {/if}
    </div>

    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 class="text-xl font-semibold text-zinc-100 mb-4">Known Aliases</h2>
      {#if aliases.length}
        <div class="flex flex-wrap gap-2">
          {#each aliases as alias}
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 text-sm">
              {alias}
            </span>
          {/each}
        </div>
      {:else}
        <p class="text-zinc-400">No alternate names recorded.</p>
      {/if}
    </div>
  </div>

  <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
    <div class="px-6 py-5 border-b border-zinc-800">
      <h2 class="text-2xl font-semibold text-zinc-100">Year-by-Year Results</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full min-w-[820px] table-fixed">
        <thead class="bg-zinc-800 text-zinc-300 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left w-20">Year</th>
            <th class="px-4 py-3 text-left w-28">Result</th>
            <th class="px-4 py-3 text-left w-24">Rank</th>
            <th class="px-4 py-3 text-left w-20">Pctile</th>
            <th class="px-4 py-3 text-left w-20">Score</th>
            <th class="px-4 py-3 text-left w-20">Games</th>
            <th class="px-4 py-3 text-left">Notes</th>
          </tr>
        </thead>
        <tbody>
          {#each yearlyResults as result, index}
            <tr class="{index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'} border-b border-zinc-800">
              <td class="px-4 py-4 font-medium text-zinc-100">{result.year}</td>
              <td class="px-4 py-4 text-zinc-200">
                {#if result.champion}
                  Champion
                {:else}
                  Entrant
                {/if}
              </td>
              <td class="px-4 py-4 text-zinc-300">{result.finalRank ? `${result.finalRank} / ${result.fieldSize || '?'}` : '-'}</td>
              <td class="px-4 py-4 text-zinc-300">{result.percentile !== null && result.percentile !== undefined ? `${Math.round(result.percentile)}%` : '-'}</td>
              <td class="px-4 py-4 text-zinc-300">{result.totalPoints ?? '-'}</td>
              <td class="px-4 py-4 text-zinc-300">{result.correctGames ?? '-'}</td>
              <td class="px-4 py-4 text-zinc-400 whitespace-normal break-words">{result.notes || '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

