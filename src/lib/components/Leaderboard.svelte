<script>
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { calculateScores, calculatePotential, getEliminatedTeams } from '$lib/utils/scoringUtils';

  export let entries = [];
  export let loading = false;
  export let error = null;

  let masterBracket = [];
  let eliminatedTeams = [];
  let scores = [];
  let potentials = [];
  let loadingLeaderboard = true;
  let sortField = 'total';
  let sortDirection = 'desc';

  $: sortedScores = [...scores].sort((a, b) => {
    const multiplier = sortDirection === 'desc' ? -1 : 1;
    
    // Primary sort by sortField
    if (a[sortField] < b[sortField]) return -1 * multiplier;
    if (a[sortField] > b[sortField]) return 1 * multiplier;
    
    // Secondary sort by potential if totals are equal (only when sorting by total)
    if (sortField === 'total') {
      if (a.potential < b.potential) return -1 * multiplier;
      if (a.potential > b.potential) return 1 * multiplier;
    }
    
    return 0;
  });
  
  // Generate golf-style ranks
  $: ranks = sortedScores.reduce((acc, score, index) => {
    if (index === 0) {
      acc.push(1); // First entry is always rank 1
    } else {
      // If current score equals previous score (on the sort field), use the same rank
      const prevScore = sortedScores[index - 1];
      const prevRank = acc[index - 1];
      
      if (score[sortField] === prevScore[sortField]) {
        acc.push(prevRank); // Same rank for tied scores
      } else {
        acc.push(index + 1); // Rank is the position + 1 (skipping tied positions)
      }
    }
    return acc;
  }, []);

  function getRankLabel(rank) {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  }

  function toggleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    } else {
      sortField = field;
      sortDirection = 'desc';
    }
  }

  onMount(async () => {
    try {
      // Fetch master bracket data
      const masterResponse = await fetch('/api/master-bracket');
      if (!masterResponse.ok) {
        throw new Error(`Error fetching master bracket: ${masterResponse.statusText}`);
      }
      
      const masterData = await masterResponse.json();
      if (masterData.error) {
        throw new Error(masterData.error);
      }
      
      masterBracket = masterData.masterBracket;
      
      // Fetch live bracket data for eliminated teams
      const liveResponse = await fetch('/api/live-bracket');
      if (!liveResponse.ok) {
        throw new Error(`Error fetching live bracket: ${liveResponse.statusText}`);
      }
      
      const liveData = await liveResponse.json();
      if (liveData.error) {
        throw new Error(liveData.error);
      }
      
      eliminatedTeams = getEliminatedTeams(liveData);
      
      // Calculate scores and potentials
      scores = calculateScores(masterBracket, entries);
      potentials = calculatePotential(masterBracket, eliminatedTeams, entries);
      
      // Merge potential data into scores
      scores = scores.map(score => {
        const potential = potentials.find(p => p.entryId === score.entryId)?.potential || 0;
        return { ...score, potential };
      });
      
      loadingLeaderboard = false;
    } catch (err) {
      console.error('Error loading leaderboard data:', err);
      error = err.message;
      loadingLeaderboard = false;
    }
  });
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  {#if loading || loadingLeaderboard}
    <div class="flex justify-center items-center min-h-[400px]" in:fade={{ duration: 100 }}>
      <div class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-amber-600 font-medium">Calculating scores...</div>
      </div>
    </div>
  {:else if error}
    <div 
      class="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-lg text-center mb-4" 
      in:fade={{ duration: 100, delay: 100 }}
    >
      {error}
    </div>
  {:else}
    <div 
      class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
      in:fade={{ duration: 300, delay: 100 }}
    >
      
      <div class="border-b border-zinc-800 bg-zinc-900/50 p-6">
        <h2 class="text-2xl font-bold text-amber-500 text-center">Leaderboard</h2>
      </div>
      
      <!-- Mobile View -->
      <div class="md:hidden">
        {#each sortedScores as score, index}
          <div 
            class="border-b border-zinc-800 p-4 {index % 2 === 0 ? 'bg-zinc-800/30' : ''}"
            in:fade={{ duration: 100, delay: index * 50 }}
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <span class="text-amber-500 font-bold">{getRankLabel(ranks[index])}</span>
                <span class="text-xl font-semibold">{score.firstName} {score.lastName}</span>
              </div>
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div class="text-zinc-400 text-lg">Total: <span class="text-amber-400 font-bold">{score.total}</span></div>
              <div class="text-zinc-400 text-lg">Potential: <span class="text-emerald-400">{score.potential}</span></div>
              <div class="text-zinc-400">Round 1: <span class="text-white">{score.round1}</span></div>
              <div class="text-zinc-400">Round 2: <span class="text-white">{score.round2}</span></div>
              <div class="text-zinc-400">Sweet 16: <span class="text-white">{score.round3}</span></div>
              <div class="text-zinc-400">Elite 8: <span class="text-white">{score.round4}</span></div>
              <div class="text-zinc-400">Final 4: <span class="text-white">{score.round5}</span></div>
              <div class="text-zinc-400">Championship: <span class="text-white">{score.round6}</span></div>
              <div class="text-zinc-400">Correct Games: <span class="text-white">{score.correctGames}</span></div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Desktop View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full divide-y divide-zinc-800">
          <thead>
            <tr class="bg-zinc-900/50">
              <th class="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-12">#</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center" on:click={() => toggleSort('firstName')}>
                  Name
                  {#if sortField === 'firstName'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
              <!-- Total column moved to beginning -->
              <th class="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center justify-center mx-auto" on:click={() => toggleSort('total')}>
                  Total
                  {#if sortField === 'total'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
              <!-- Potential column moved after Total -->
              <th class="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center justify-center mx-auto" on:click={() => toggleSort('potential')}>
                  Potential
                  {#if sortField === 'potential'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
              <th class="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center justify-center mx-auto" on:click={() => toggleSort('round1')}>
                  R1
                  {#if sortField === 'round1'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
              <th class="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center justify-center mx-auto" on:click={() => toggleSort('round2')}>
                  R2
                  {#if sortField === 'round2'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
              <th class="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center justify-center mx-auto" on:click={() => toggleSort('round3')}>
                  S16
                  {#if sortField === 'round3'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
              <th class="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center justify-center mx-auto" on:click={() => toggleSort('round4')}>
                  E8
                  {#if sortField === 'round4'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
              <th class="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center justify-center mx-auto" on:click={() => toggleSort('round5')}>
                  F4
                  {#if sortField === 'round5'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
              <th class="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center justify-center mx-auto" on:click={() => toggleSort('round6')}>
                  CHAMP
                  {#if sortField === 'round6'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
              <th class="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <button class="flex items-center justify-center mx-auto" on:click={() => toggleSort('correctGames')}>
                  Games
                  {#if sortField === 'correctGames'}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {#if sortDirection === 'desc'}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      {:else}
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      {/if}
                    </svg>
                  {/if}
                </button>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800">
            {#each sortedScores as score, index}
              <tr 
                class={index % 2 === 0 ? 'bg-zinc-800/30' : ''}
                in:fade={{ duration: 100, delay: index * 50 }}
              >
                <td class="px-6 py-4 whitespace-nowrap text-amber-500 font-semibold">{getRankLabel(ranks[index])}</td>
                <td class="px-6 py-4 whitespace-nowrap text-white font-medium">{score.firstName} {score.lastName}</td>
                <td class="px-4 py-4 whitespace-nowrap text-center text-amber-400 font-bold text-lg">{score.total}</td>
                <td class="px-4 py-4 whitespace-nowrap text-center text-emerald-400">{score.potential}</td>
                <td class="px-4 py-4 whitespace-nowrap text-center text-white">{score.round1}</td>
                <td class="px-4 py-4 whitespace-nowrap text-center text-white">{score.round2}</td>
                <td class="px-4 py-4 whitespace-nowrap text-center text-white">{score.round3}</td>
                <td class="px-4 py-4 whitespace-nowrap text-center text-white">{score.round4}</td>
                <td class="px-4 py-4 whitespace-nowrap text-center text-white">{score.round5}</td>
                <td class="px-4 py-4 whitespace-nowrap text-center text-white">{score.round6}</td>
                <td class="px-4 py-4 whitespace-nowrap text-center text-white">{score.correctGames}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
