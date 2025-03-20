<script>
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import Countdown from '$lib/components/Countdown.svelte';
  import TournamentCountdown from '$lib/components/TournamentCountdown.svelte';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  
  let entries = [];
  let loading = true;
  let error = null;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/entries');
      if (!response.ok) {
        throw new Error(`Error fetching entries: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      entries = data.entries;
      loading = false;
    } catch (err) {
      console.error('Error loading entries:', err);
      error = err.message;
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Mosier Madness - Leaderboard</title>
  <meta name="description" content="March Madness bracket challenge leaderboard" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
    <!-- <Countdown /> -->
    <!-- <TournamentCountdown /> -->
    <div in:fade={{ duration: 300, delay: 100 }}>
      <Leaderboard {entries} {loading} {error} />
    </div>
</div>
