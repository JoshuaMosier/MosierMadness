<!-- LiveBracket.svelte -->
<script lang="ts">
  import BracketFrame from '$lib/components/BracketFrame.svelte';
  import BracketView from '$lib/components/BracketView.svelte';
  import { invalidateAll } from '$app/navigation';

  export let data: any;

  $: bracketData = data.bracketData;
  $: tournamentStage = data.tournamentSettings?.stage || 'archive';
  $: isLiveBracketAvailable = tournamentStage === 'tournament-live' || tournamentStage === 'complete';

  let error: string | null = null;

  async function retry(): Promise<void> {
    error = null;
    try {
      await invalidateAll();
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<svelte:head>
  <title>Mosier Madness - Live Bracket</title>
  <meta name="description" content="Follow the live tournament bracket as results finalize." />
</svelte:head>

<div class="mm-page">
  {#if !isLiveBracketAvailable}
    <div class="mm-empty-state">
      <h2 class="text-2xl font-semibold text-zinc-100">Live bracket unavailable</h2>
      <p class="mx-auto mt-3 max-w-2xl text-zinc-400">
        The live bracket becomes available once the tournament is underway.
      </p>
    </div>
  {:else}
    <BracketFrame>
      {#if error}
        <div class="bracket-message">
          <p class="text-lg font-semibold text-zinc-100">Unable to load the live bracket</p>
          <p class="mx-auto mt-3 max-w-2xl break-words text-zinc-400">{error}</p>
          <button class="mm-button-primary mt-6" on:click={retry}>Retry</button>
        </div>
      {:else}
        <BracketView
          mode="live"
          {bracketData}
          showScores={true}
        />
      {/if}
    </BracketFrame>
  {/if}
</div>

<style>
  .bracket-message {
    padding: 2rem 1.5rem;
    text-align: center;
  }
</style>
