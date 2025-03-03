<script>
  import { onMount } from 'svelte';
  import { getLeaderboard } from '$lib/services/scoring';
  import { user } from '$lib/stores/user';
  
  export let highlightUserId = null;
  
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
  
  // Function to determine if a row should be highlighted
  function shouldHighlight(entry) {
    if (highlightUserId) {
      return entry.userId === highlightUserId;
    }
    
    if ($user) {
      return entry.userId === $user.id;
    }
    
    return false;
  }
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
  {:else if leaderboard.length === 0}
    <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
      <span class="block sm:inline">No brackets have been submitted yet.</span>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R64</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R32</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S16</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E8</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F4</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NCG</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potential</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Champion</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each leaderboard as entry}
            <tr class={shouldHighlight(entry) ? 'bg-yellow-100' : ''}>
              <td class="px-4 py-2 whitespace-nowrap">{entry.rank}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                <a href="/entries/{entry.userId}" class="text-mm-blue hover:underline">
                  {entry.firstName} {entry.lastName}
                </a>
              </td>
              <td class="px-4 py-2 whitespace-nowrap font-bold">{entry.totalScore}</td>
              <td class="px-4 py-2 whitespace-nowrap">{entry.r64Score}</td>
              <td class="px-4 py-2 whitespace-nowrap">{entry.r32Score}</td>
              <td class="px-4 py-2 whitespace-nowrap">{entry.s16Score}</td>
              <td class="px-4 py-2 whitespace-nowrap">{entry.e8Score}</td>
              <td class="px-4 py-2 whitespace-nowrap">{entry.f4Score}</td>
              <td class="px-4 py-2 whitespace-nowrap">{entry.ncgScore}</td>
              <td class="px-4 py-2 whitespace-nowrap">{entry.potential}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                {#if entry.champion}
                  <div class="flex items-center">
                    <img 
                      src="/images/team-logos/{entry.champion.split(' ').slice(1).join('-').toLowerCase()}.png" 
                      alt={entry.champion} 
                      class="h-6 w-6 mr-2"
                    />
                    <span>{entry.champion}</span>
                  </div>
                {:else}
                  -
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div> 