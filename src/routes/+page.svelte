<script>
  import Leaderboard from '$lib/components/Leaderboard.svelte';
</script>

<div class="container mx-auto px-4 py-8">
  <div class="leaderboard bg-white/90 rounded-lg shadow-lg p-6">
    <Leaderboard />
  </div>
</div>

<style>
  .leaderboard {
    max-width: 800px;
    margin: 0 auto;
  }
</style>