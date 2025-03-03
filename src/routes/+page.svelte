<script>
  import Leaderboard from '$lib/components/Leaderboard.svelte';
</script>

<div class="container mx-auto px-4 py-8">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold text-mm-blue mb-2">Mosier Madness</h1>
    <p class="text-xl text-mm-gray">NCAA March Madness Bracket Challenge</p>
  </div>
  
  <div class="card mb-8">
    <h2 class="text-2xl font-bold mb-4">Leaderboard</h2>
    <Leaderboard />
  </div>
</div>
