<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  import { getUserBracket } from '$lib/services/bracket';
  import BracketEntry from '$lib/components/BracketEntry.svelte';
  import { goto } from '$app/navigation';
  
  let userBracket = null;
  let isLoading = true;
  let error = null;
  
  onMount(async () => {
    // Check if user is logged in
    if (!$user) {
      goto('/login?redirect=/bracket');
      return;
    }
    
    try {
      // Get the user's bracket if it exists
      const { data, error: bracketError } = await getUserBracket($user.id);
      
      if (bracketError) {
        console.error('Error fetching user bracket:', bracketError);
        error = 'Error loading your bracket. Please try again later.';
      } else {
        userBracket = data;
      }
    } catch (err) {
      console.error('Error in bracket page:', err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold text-mm-blue mb-2">Bracket Entry</h1>
    <p class="text-xl text-mm-gray">Fill out your March Madness bracket</p>
  </div>
  
  {#if isLoading}
    <div class="flex justify-center py-8">
      <div class="animate-pulse flex space-x-4">
        <div class="flex-1 space-y-4 py-1">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline"> {error}</span>
    </div>
  {:else if !$user}
    <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
      <span class="block sm:inline">Please log in to fill out your bracket.</span>
      <div class="mt-4">
        <a href="/login?redirect=/bracket" class="btn-primary">Sign In</a>
      </div>
    </div>
  {:else}
    <div class="card">
      <BracketEntry initialSelections={userBracket?.selections || Array(63).fill('')} />
    </div>
  {/if}
</div> 