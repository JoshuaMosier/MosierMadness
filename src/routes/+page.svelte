<script>
  import Leaderboard from '$lib/components/Leaderboard.svelte';
</script>

<div class="container mx-auto px-4 py-8">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold text-gray-800 mb-2">Mosier Madness</h1>
    <p class="text-xl text-gray-600">NCAA March Madness Bracket Challenge</p>
  </div>
  
  <div class="card bg-white rounded-lg shadow-lg overflow-hidden">
    <div class="p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Leaderboard</h2>
      <Leaderboard />
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f3f4f6;
  }
</style>
