<script>
  export let data;

  const { winners, leaderboard, summary } = data;
  const topWinnersText = summary.topWinners.map(winner => winner.name).join(', ');
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="text-center mb-12">
    <h1 class="text-4xl font-bold mb-4">
      <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md inline-block">
        Hall of Champions
      </span>
    </h1>
    <p class="text-zinc-400 max-w-2xl mx-auto">
      Every champion in Mosier Madness history.
    </p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{summary.totalSeasons}</div>
      <div class="text-zinc-400 text-lg">Tournament Years</div>
      <div class="text-sm text-zinc-500">{summary.completedTournaments} completed</div>
    </div>

    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{summary.uniqueChampions}</div>
      <div class="text-zinc-400 text-lg">Unique Champions</div>
    </div>

    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{summary.maxWins}</div>
      <div class="text-zinc-400 text-lg">Most Wins</div>
      <div class="text-sm text-zinc-500">{topWinnersText}</div>
    </div>
  </div>

  <div class="mb-16">
    <div class="bg-zinc-900 bg-opacity-90 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
      <div class="grid grid-cols-3 text-xs uppercase bg-zinc-800 text-zinc-300 p-4 font-semibold">
        <div>
          <span class="bg-zinc-700 px-2 py-1 rounded text-white">Rank</span>
        </div>
        <div>
          <span class="bg-zinc-700 px-2 py-1 rounded text-white">Champion</span>
        </div>
        <div class="text-right">
          <span class="bg-zinc-700 px-2 py-1 rounded text-white">Titles</span>
        </div>
      </div>
      {#each leaderboard as entry, i}
        <div class="grid grid-cols-3 p-4 border-b border-zinc-800 items-center {entry.rank === 1 ? 'bg-amber-900/80' : i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'}">
          <div class="font-medium">{entry.rank}</div>
          <div class="font-medium">
            <a class="text-amber-400 hover:text-amber-300 transition-colors" href={`/players/${entry.slug}`}>{entry.name}</a>
          </div>
          <div class="text-right">
            {#each Array(entry.count) as _}
              <span class="inline-block w-4 h-4 bg-amber-600 rounded-full mx-0.5" title="Championship"></span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="relative">
    <h2 class="text-2xl font-bold mb-8 text-center">
      <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-3 py-1 rounded-md shadow-md">
        Championship Timeline
      </span>
    </h2>

    <div class="absolute left-1/2 transform -translate-x-1/2 h-full w-2 bg-zinc-700"></div>

    <div class="space-y-12">
      {#each winners as winner, i}
        <div class="winner-card relative {i % 2 === 0 ? 'text-right pr-12 md:pr-0 md:mr-auto md:ml-0 md:text-right' : 'text-left pl-12 md:pl-0 md:ml-auto md:mr-0 md:text-left'} md:w-5/12">
          <div class="absolute top-5 {i % 2 === 0 ? 'right-0 md:-right-8' : 'left-0 md:-left-8'} w-6 h-6 rounded-full bg-amber-600 border-4 border-zinc-900 z-10"></div>

          <div class="bg-gradient-to-br {winner.special ? 'from-zinc-800 to-zinc-900 border-red-900' : winner.highlight ? 'from-amber-900 to-zinc-900 border-amber-700' : 'from-zinc-900 to-zinc-800 border-zinc-700'} rounded-xl p-6 shadow-lg border transform hover:scale-105 transition-transform duration-300">
            <div class="text-3xl font-bold text-amber-600 mb-1">{winner.year}</div>
            {#if winner.slug}
              <a class="text-xl font-medium mb-2 block text-zinc-100 hover:text-amber-300 transition-colors" href={`/players/${winner.slug}`}>
                {winner.name}
              </a>
            {:else}
              <div class="text-xl font-medium mb-2">{winner.name || 'No champion crowned'}</div>
            {/if}

            {#if winner.special}
              <div class="text-red-600 text-sm">{winner.notes}</div>
            {:else if winner.highlight}
              <div class="text-amber-600 text-sm">Reigning champion</div>
            {:else if winner.notes}
              <div class="text-zinc-400 text-sm">{winner.notes}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }

  .winner-card {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-color-scheme: light) {
    .bg-gradient-to-r.from-amber-700.to-amber-600 {
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .bg-zinc-700 {
      background-color: #4b5563;
    }
  }
</style>