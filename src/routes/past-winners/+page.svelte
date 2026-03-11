<script>
  export let data;

  const { winners, leaderboard, summary, seasonStandings, playerDirectory } = data;
  const topWinnersText = summary.topWinners.map(winner => winner.name).join(', ');
  const completedWinners = winners.filter(w => w.isChampionYear);

  // Season leaderboard
  const availableYears = Object.keys(seasonStandings)
    .map(Number)
    .sort((a, b) => b - a);
  let selectedYear = availableYears[0] || null;

  $: currentStandings = selectedYear ? seasonStandings[selectedYear] || [] : [];

  // Player directory
  let playerSearch = '';
  $: filteredPlayers = playerSearch.trim()
    ? playerDirectory.filter(p => p.name.toLowerCase().includes(playerSearch.trim().toLowerCase()))
    : playerDirectory;
</script>

<svelte:head>
  <title>Mosier Madness - Hall of Champions</title>
  <meta name="description" content="Mosier Madness hall of champions, season archives, and historical player directory." />
</svelte:head>

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
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700">
      <div class="text-5xl font-bold text-amber-600 mb-2">{summary.totalSeasons}</div>
      <div class="text-zinc-400 text-lg">Tournament Years</div>
      <div class="text-sm text-zinc-500">{summary.completedTournaments} completed</div>
    </div>

    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700">
      <div class="text-5xl font-bold text-amber-600 mb-2">{summary.uniqueChampions}</div>
      <div class="text-zinc-400 text-lg">Unique Champions</div>
    </div>

    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700">
      <div class="text-5xl font-bold text-amber-600 mb-2">{summary.maxWins}</div>
      <div class="text-zinc-400 text-lg">Most Wins</div>
      <div class="text-sm text-zinc-500">{topWinnersText}</div>
    </div>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16">
    <div>
      <h2 class="text-2xl font-bold mb-6 text-center">
        <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-3 py-1 rounded-md shadow-md">
          Title Leaderboard
        </span>
      </h2>
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
        <div class="grid grid-cols-3 text-xs uppercase bg-zinc-800 text-zinc-300 p-4 font-semibold">
          <div>Rank</div>
          <div>Champion</div>
          <div class="text-right">Titles</div>
        </div>
        {#each leaderboard as entry, i}
          <div class="grid grid-cols-3 px-4 py-3 border-b border-zinc-800 items-center {entry.rank === 1 ? 'bg-amber-900/50' : i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'}">
            <div class="font-medium text-zinc-400">{entry.rank}</div>
            <div class="font-medium">
              <a class="text-amber-400 hover:text-amber-300 transition-colors" href="/players/{entry.slug}">{entry.name}</a>
            </div>
            <div class="text-right">
              {#each Array(entry.count) as _}
                <span class="inline-block w-3.5 h-3.5 bg-amber-600 rounded-full mx-0.5" title="Championship"></span>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div>
      <h2 class="text-2xl font-bold mb-6 text-center">
        <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-3 py-1 rounded-md shadow-md">
          Past Champions
        </span>
      </h2>
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
        <div class="grid grid-cols-4 text-xs uppercase bg-zinc-800 text-zinc-300 p-4 font-semibold">
          <div>Year</div>
          <div>Champion</div>
          <div class="text-right">Score</div>
          <div class="text-right">Field</div>
        </div>
        <div class="max-h-[480px] overflow-y-auto">
          {#each completedWinners as winner, i}
            <div class="grid grid-cols-4 px-4 py-3 border-b border-zinc-800 items-center {winner.highlight ? 'bg-amber-900/50' : i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'}">
              <div class="font-medium text-zinc-100">{winner.year}</div>
              <div>
                {#if winner.slug}
                  <a class="text-amber-400 hover:text-amber-300 transition-colors" href="/players/{winner.slug}">{winner.name}</a>
                {:else}
                  <span class="text-zinc-300">{winner.name || '-'}</span>
                {/if}
              </div>
              <div class="text-right text-zinc-300 font-mono">{winner.winningScore ?? '-'}</div>
              <div class="text-right text-zinc-400">{winner.fieldSize ?? '-'}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  {#if availableYears.length > 0}
    <div class="mb-16">
      <h2 class="text-2xl font-bold mb-6 text-center">
        <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-3 py-1 rounded-md shadow-md">
          Season Leaderboard
        </span>
      </h2>

      <div class="flex justify-center mb-6">
        <select
          bind:value={selectedYear}
          class="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
        >
          {#each availableYears as year}
            <option value={year}>{year} Season ({seasonStandings[year]?.length || 0} entrants)</option>
          {/each}
        </select>
      </div>

      <div class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden max-w-3xl mx-auto">
        <table class="w-full">
          <thead class="bg-zinc-800 text-zinc-300 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left w-16">Rank</th>
              <th class="px-4 py-3 text-left">Name</th>
              <th class="px-4 py-3 text-right w-20">Score</th>
              <th class="px-4 py-3 text-right w-20">Games</th>
            </tr>
          </thead>
          <tbody>
            {#each currentStandings as standing, j}
              <tr class="{standing.rank === 1 ? 'bg-amber-900/40' : j % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'} border-b border-zinc-800">
                <td class="px-4 py-3 text-zinc-400 font-mono">{standing.rank}</td>
                <td class="px-4 py-3">
                  {#if standing.slug}
                    <a class="text-amber-400 hover:text-amber-300 transition-colors" href="/players/{standing.slug}">
                      {standing.name}
                    </a>
                  {:else}
                    <span class="text-zinc-300">{standing.name}</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-right text-zinc-300 font-mono">{standing.totalPoints ?? '-'}</td>
                <td class="px-4 py-3 text-right text-zinc-300 font-mono">{standing.correctGames ?? '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <div>
    <h2 class="text-2xl font-bold mb-6 text-center">
      <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-3 py-1 rounded-md shadow-md">
        Player Directory
      </span>
    </h2>

    <div class="mb-6 max-w-md mx-auto">
      <input
        type="text"
        bind:value={playerSearch}
        placeholder="Search players..."
        class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
      />
    </div>

    <div class="text-sm text-zinc-500 text-center mb-4">
      {filteredPlayers.length} of {playerDirectory.length} players
    </div>

    <div class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-zinc-800 text-zinc-300 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Name</th>
              <th class="px-4 py-3 text-center w-28">Appearances</th>
              <th class="px-4 py-3 text-center w-20">Titles</th>
              <th class="px-4 py-3 text-center w-24">Avg Pctile</th>
              <th class="px-4 py-3 text-center w-24">Best Finish</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredPlayers as player, i}
              <tr class="{player.titles > 0 ? 'bg-amber-900/20' : i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'} border-b border-zinc-800">
                <td class="px-4 py-3">
                  <a class="text-amber-400 hover:text-amber-300 transition-colors font-medium" href="/players/{player.slug}">
                    {player.name}
                  </a>
                </td>
                <td class="px-4 py-3 text-center text-zinc-300">{player.appearances}</td>
                <td class="px-4 py-3 text-center">
                  {#if player.titles > 0}
                    <span class="text-amber-500 font-bold">{player.titles}</span>
                  {:else}
                    <span class="text-zinc-500">0</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-center text-zinc-300">
                  {player.averagePercentile !== null ? `${player.averagePercentile}%` : '-'}
                </td>
                <td class="px-4 py-3 text-center text-zinc-300">
                  {player.bestFinish || '-'}
                </td>
              </tr>
            {/each}
            {#if filteredPlayers.length === 0}
              <tr>
                <td class="px-4 py-6 text-center text-zinc-500" colspan="5">
                  No players match your search.
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
