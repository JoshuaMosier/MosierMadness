<script lang="ts">
  // The server load (+page.server.ts) calls signOut() and redirects to /.
  // This page only renders as a brief flash if the redirect hasn't completed yet.
  // No client-side signOut() call needed — the server handles session cleanup,
  // avoiding browser auth lock issues entirely.
</script>

<div class="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
  <div class="w-full max-w-md mx-auto px-4 sm:px-0">
    <div class="bg-zinc-900 bg-opacity-90 border border-zinc-800 rounded-lg shadow-xl overflow-hidden text-zinc-100 p-8 text-center">
      <div class="animate-pulse">
        <h1 class="text-2xl font-bold text-amber-600 mb-4">Logging out...</h1>
        <p class="text-zinc-400">Please wait while we sign you out.</p>
      </div>
    </div>
  </div>
</div> 