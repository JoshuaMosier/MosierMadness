<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  import { goto } from '$app/navigation';
  
  onMount(async () => {
    try {
      const { error } = await user.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
    } finally {
      // Redirect to home page after logout attempt (successful or not)
      goto('/');
    }
  });
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