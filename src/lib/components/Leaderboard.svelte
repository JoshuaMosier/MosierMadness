<script>
  import { onMount } from 'svelte';
  import { getLeaderboard } from '$lib/services/scoring';
  import { user } from '$lib/stores/user';
  
  let leaderboard = [];
  let isLoading = true;
  let error = null;
  
  onMount(async () => {
    try {
      leaderboard = await getLeaderboard();
      isLoading = false;
    } catch (err) {
      error = err.message;
      isLoading = false;
    }
  });
</script>

<div class="leaderboard">
  {#if isLoading}
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
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline"> {error}</span>
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
          {#each leaderboard as entry, i}
            <tr class={$user && entry.userId === $user.id ? 'bg-yellow-700' : 'hover:bg-gray-800'}>
              <td class="px-4 py-2 text-center">{entry.rank}</td>
              <td class="px-4 py-2 text-center font-bold">{entry.totalScore}</td>
              <td class="px-4 py-2">
                <a 
                  href="/entries/{entry.userId}" 
                  class="button -regular nav-center entries-btn-hover color-8 block text-center"
                >
                  {entry.firstName} {entry.lastName}
                </a>
              </td>
              <td class="px-4 py-2 text-center">{entry.r64Score}</td>
              <td class="px-4 py-2 text-center">{entry.r32Score}</td>
              <td class="px-4 py-2 text-center">{entry.s16Score}</td>
              <td class="px-4 py-2 text-center">{entry.e8Score}</td>
              <td class="px-4 py-2 text-center">{entry.f4Score}</td>
              <td class="px-4 py-2 text-center">{entry.ncgScore}</td>
              <td class="px-4 py-2 text-center">{entry.potential}</td>
              <td class="px-4 py-2">
                <div class="flex justify-center items-center space-x-1">
                  {#each entry.finalFour as team}
                    <div class="relative">
                      <img 
                        src="/static/team_images/2024/pngs/{team.name}.png" 
                        alt={team.name}
                        class="h-8 w-8 object-contain"
                        title={team.name}
                      />
                      {#if team.isWinner}
                        <img src="/static/winner.png" class="absolute top-0 left-0 h-full w-full" alt="Winner" />
                      {:else if team.isEliminated}
                        <img src="/static/loser.png" class="absolute top-0 left-0 h-full w-full" alt="Eliminated" />
                      {/if}
                    </div>
                  {/each}
                </div>
              </td>
              <td class="px-4 py-2">
                <div class="flex justify-center items-center space-x-1">
                  {#each entry.finals as team}
                    <div class="relative">
                      <img 
                        src="/static/team_images/2024/pngs/{team.name}.png" 
                        alt={team.name}
                        class="h-8 w-8 object-contain"
                        title={team.name}
                      />
                      {#if team.isWinner}
                        <img src="/static/winner.png" class="absolute top-0 left-0 h-full w-full" alt="Winner" />
                      {:else if team.isEliminated}
                        <img src="/static/loser.png" class="absolute top-0 left-0 h-full w-full" alt="Eliminated" />
                      {/if}
                    </div>
                  {/each}
                </div>
              </td>
              <td class="px-4 py-2">
                <div class="flex justify-center items-center">
                  <div class="relative">
                    <img 
                      src="/static/team_images/2024/pngs/{entry.champion.name}.png" 
                      alt={entry.champion.name}
                      class="h-8 w-8 object-contain champ-center"
                      title={entry.champion.name}
                    />
                    {#if entry.champion.isWinner}
                      <img src="/static/winner.png" class="absolute top-0 left-0 h-full w-full" alt="Winner" />
                    {:else if entry.champion.isEliminated}
                      <img src="/static/loser.png" class="absolute top-0 left-0 h-full w-full" alt="Eliminated" />
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

<style>
  .entries-btn-hover {
    @apply hover:bg-gray-700 transition-colors duration-200 py-1 px-2 rounded;
  }
  
  .champ-center {
    margin: 0 auto;
  }
  
  :global(.color-8) {
    @apply text-white;
  }
  
  :global(.color-9) {
    @apply text-yellow-300;
  }
</style> 