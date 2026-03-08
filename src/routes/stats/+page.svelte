<script>
  export let data;

  const { categories, summary } = data;

  function hasSeasonColumns(category) {
    return category.records.some(record => record.year !== undefined);
  }

  function hasAggregateColumns(category) {
    return category.records.some(record => record.yearsPlayed !== undefined);
  }
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="text-center mb-12">
    <h1 class="text-4xl font-bold mb-4">
      <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md inline-block">
        Tournament Statistics
      </span>
    </h1>
    <p class="text-zinc-400 max-w-2xl mx-auto">
      All-time records and milestones from every tournament season.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{summary.mostGamesCorrect?.stat || 'N/A'}</div>
      <div class="text-zinc-400 text-lg">Most Games Correct</div>
      {#if summary.mostGamesCorrect}
        <div class="text-sm text-zinc-500">
          <a class="text-amber-400 hover:text-amber-300 transition-colors" href={`/players/${summary.mostGamesCorrect.slug}`}>
            {summary.mostGamesCorrect.participant}
          </a>
          ({summary.mostGamesCorrect.year})
        </div>
      {/if}
    </div>

    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{summary.highestScore?.stat || 'N/A'}</div>
      <div class="text-zinc-400 text-lg">Highest Score</div>
      {#if summary.highestScore}
        <div class="text-sm text-zinc-500">
          <a class="text-amber-400 hover:text-amber-300 transition-colors" href={`/players/${summary.highestScore.slug}`}>
            {summary.highestScore.participant}
          </a>
          ({summary.highestScore.year})
        </div>
      {/if}
    </div>

    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{summary.mostTournamentWins.value}</div>
      <div class="text-zinc-400 text-lg">Most Tournament Wins</div>
      <div class="text-sm text-zinc-500">
        {#each summary.mostTournamentWins.leaders as leader, index}
          <a class="text-amber-400 hover:text-amber-300 transition-colors" href={`/players/${leader.slug}`}>{leader.participant}</a>{index < summary.mostTournamentWins.leaders.length - 1 ? ', ' : ''}
        {/each}
      </div>
    </div>
  </div>

  {#each categories as category}
    <section class="stat-category mb-16">
      <h2 class="text-2xl font-bold mb-6 text-center">
        <span class="bg-gradient-to-r from-amber-800 to-amber-600 text-white px-3 py-1 rounded-md shadow-md inline-block">
          {category.category}
        </span>
      </h2>

      <div class="bg-zinc-900 bg-opacity-90 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-zinc-800 text-zinc-300 text-xs uppercase">
              <tr>
                <th class="px-4 py-3 text-left">Rank</th>
                <th class="px-4 py-3 text-left">Stat</th>
                <th class="px-4 py-3 text-left">Participant</th>
                {#if hasSeasonColumns(category)}
                  <th class="px-4 py-3 text-left">Year</th>
                  <th class="px-4 py-3 text-left">Final Rank</th>
                {/if}
                {#if hasAggregateColumns(category)}
                  <th class="px-4 py-3 text-left">Years Played</th>
                  <th class="px-4 py-3 text-left">Champion?</th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#if category.records.length === 0}
                <tr>
                  <td class="px-4 py-4 text-zinc-400" colspan="5">No records available.</td>
                </tr>
              {:else}
                {#each category.records as record, index}
                  <tr class="{index === 0 ? 'bg-amber-900/60' : index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'} border-b border-zinc-800">
                    <td class="px-4 py-4 font-medium">{index + 1}</td>
                    <td class="px-4 py-4 font-medium text-zinc-200">{record.stat}</td>
                    <td class="px-4 py-4">
                      <a class="text-amber-400 hover:text-amber-300 transition-colors" href={`/players/${record.slug}`}>
                        {record.participant}
                      </a>
                    </td>
                    {#if hasSeasonColumns(category)}
                      <td class="px-4 py-4 text-zinc-300">{record.year}</td>
                      <td class="px-4 py-4 text-zinc-300">{record.finalRank}</td>
                    {/if}
                    {#if hasAggregateColumns(category)}
                      <td class="px-4 py-4 text-zinc-300">{record.yearsPlayed}</td>
                      <td class="px-4 py-4 text-zinc-300">{record.isChampion ? 'Yes' : 'No'}</td>
                    {/if}
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  {/each}
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }

  .stat-category {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-color-scheme: light) {
    .bg-gradient-to-r.from-amber-700.to-amber-600 {
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
  }
</style>