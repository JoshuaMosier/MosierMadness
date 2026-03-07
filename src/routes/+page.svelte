<script>
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import { fade } from 'svelte/transition';

  export let data;
</script>

<svelte:head>
  <title>Mosier Madness - Leaderboard</title>
  <meta name="description" content="March Madness bracket challenge leaderboard" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
    <div in:fade={{ duration: 300, delay: 100 }}>
      {#if data.tournamentSettings?.stage === 'bracket-open'}
        <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center">
          <h2 class="text-xl font-semibold text-zinc-200 mb-3">Leaderboard Hidden Until Tipoff</h2>
          <p class="text-zinc-300">
            Entries are open, but standings stay hidden until the tournament begins so picks remain private.
          </p>
        </div>
      {:else if !data.leaderboard}
        <div class="bg-red-950/50 border border-red-900 text-red-400 p-8 rounded-xl text-center">
          Leaderboard data is unavailable right now.
        </div>
      {:else}
        <Leaderboard leaderboard={data.leaderboard} />
      {/if}
    </div>
</div>
