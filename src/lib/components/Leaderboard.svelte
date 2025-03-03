<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  
  let leaderboardData = [];
  let error = null;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard data');
      leaderboardData = await response.json();
    } catch (e) {
      error = e.message;
      console.error('Error fetching leaderboard data:', e);
    }
  });

  function getTeamImagePath(teamName) {
    return `/images/team_images/2024/pngs/${teamName}.png`;
  }
</script>

<div class="leaderboard">
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline"> {error}</span>
    </div>
  {:else if leaderboardData.length === 0}
    <div class="flex justify-center py-8">
      <div class="animate-pulse flex space-x-4">
        <div class="flex-1 space-y-4 py-1">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full table-auto bg-gray-900 text-white">
        <thead>
          <tr class="bg-gray-800">
            <th class="px-4 py-2 text-center">Rank</th>
            <th class="px-4 py-2 text-center">Score</th>
            <th class="px-4 py-2 text-center">Username</th>
            <th title="Round of 64" class="px-4 py-2 text-center">R64</th>
            <th title="Round of 32" class="px-4 py-2 text-center">R32</th>
            <th title="Sweet Sixteen" class="px-4 py-2 text-center">S16</th>
            <th title="Elite Eight" class="px-4 py-2 text-center">E8</th>
            <th title="Final Four" class="px-4 py-2 text-center">F4</th>
            <th title="National Championship Game" class="px-4 py-2 text-center">NCG</th>
            <th title="Potential Remaining Score" class="px-4 py-2 text-center">Pot.</th>
            <th class="px-4 py-2 text-center">Final Four</th>
            <th class="px-4 py-2 text-center">Finals</th>
            <th class="px-4 py-2 text-center">Champ</th>
            <th title="Total Correct Games" class="px-4 py-2 text-center">Games</th>
          </tr>
        </thead>
        <tbody>
          {#each leaderboardData as entry, i}
            <tr class={entry.isCurrentUser ? 'bg-yellow-600 bg-opacity-20' : 'hover:bg-gray-800'}>
              <td class="px-4 py-2 text-center">{entry.rank}</td>
              <td class="px-4 py-2 text-center font-bold">{entry.score}</td>
              <td class="px-4 py-2">
                <a 
                  href="/entries/{entry.id}" 
                  class="button -regular nav-center entries-btn-hover {entry.isCurrentUser ? 'color-9' : 'color-8'} block text-center"
                >
                  {entry.firstName} {entry.lastName}
                </a>
              </td>
              <td class="px-4 py-2 text-center">{entry.rounds.r64}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.r32}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.s16}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.e8}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.f4}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.ncg}</td>
              <td class="px-4 py-2 text-center">{entry.potential}</td>
              <td class="px-4 py-2">
                <div class="flex justify-center items-center space-x-1">
                  {#each entry.finalFour as team, index}
                    <div class="relative inline-block">
                      <img 
                        title={team.name}
                        src={getTeamImagePath(team.name)}
                        alt={team.name}
                        class="images float-left"
                      />
                      {#if team.isWinner}
                        <img src="/images/winner.png" class="overlay{index + 1} float-left" alt="Winner" />
                      {:else if team.isEliminated}
                        <img src="/images/loser.png" class="overlay{index + 1} float-left" alt="Eliminated" />
                      {/if}
                    </div>
                  {/each}
                </div>
              </td>
              <td class="px-4 py-2">
                <div class="flex justify-center items-center space-x-1">
                  {#each entry.finals as team, index}
                    <div class="relative inline-block">
                      <img 
                        title={team.name}
                        src={getTeamImagePath(team.name)}
                        alt={team.name}
                        class="images float-left"
                      />
                      {#if team.isWinner}
                        <img src="/images/winner.png" class="overlay{index + 1} float-left" alt="Winner" />
                      {:else if team.isEliminated}
                        <img src="/images/loser.png" class="overlay{index + 1} float-left" alt="Eliminated" />
                      {/if}
                    </div>
                  {/each}
                </div>
              </td>
              <td class="px-4 py-2">
                <div class="flex justify-center items-center">
                  <div class="relative inline-block">
                    <img 
                      title={entry.champion.name}
                      src={getTeamImagePath(entry.champion.name)}
                      alt={entry.champion.name}
                      class="images float-left champ-center"
                    />
                    {#if entry.champion.isWinner}
                      <img src="/images/winner.png" class="overlay1 float-left champ-center" alt="Winner" />
                    {:else if entry.champion.isEliminated}
                      <img src="/images/loser.png" class="overlay1 float-left champ-center" alt="Eliminated" />
                    {/if}
                  </div>
                </div>
              </td>
              <td class="px-4 py-2 text-center">{entry.correctGames}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>