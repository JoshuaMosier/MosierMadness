<script>
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import Countdown from '$lib/components/Countdown.svelte';
</script>

<svelte:head>
  <title>Mosier Madness - Leaderboard</title>
  <meta name="description" content="March Madness bracket challenge leaderboard" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
    <!-- <Leaderboard /> -->
    <Countdown />
</div>
