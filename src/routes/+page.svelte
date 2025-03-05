<script>
  import Leaderboard from '$lib/components/Leaderboard.svelte';
</script>

<svelte:head>
  <title>Mosier Madness - Leaderboard</title>
  <meta name="description" content="March Madness bracket challenge leaderboard" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-7xl mx-auto bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-6 backdrop-blur-md">
    <Leaderboard />
  </div>
</div>
