<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let loading = true;
  let error = null;
  let user = null;
  let bracket = null;

  onMount(async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user = currentUser;

      if (!user) {
        goto('/login');
        return;
      }

      // Fetch user's bracket
      const { data, error: bracketError } = await supabase
        .from('brackets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (bracketError) throw bracketError;
      bracket = data;
    } catch (err) {
      console.error('Error fetching bracket:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Mosier Madness - Bracket Entry</title>
  <meta name="description" content="Fill out your March Madness bracket" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold text-amber-600 mb-2">Your Bracket</h1>
    <p class="text-xl text-zinc-400">View and manage your March Madness bracket</p>
  </div>

  {#if loading}
    <div class="flex justify-center items-center min-h-[200px]">
      <div class="text-amber-600">Loading your bracket...</div>
    </div>
  {:else if error}
    <div class="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-lg text-center">
      {error}
    </div>
  {:else if !user}
    <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center">
      <p class="text-zinc-300 mb-4">Please log in to view or submit your bracket.</p>
      <a 
        href="/login" 
        class="inline-block px-6 py-2 bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-500 transition-all duration-200"
      >
        Login
      </a>
    </div>
  {:else if bracket}
    <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold text-zinc-200">
          {bracket.is_submitted ? 'Submitted Bracket' : 'Draft Bracket'}
        </h2>
        <div class="text-sm text-zinc-400">
          Last updated: {new Date(bracket.updated_at).toLocaleDateString()}
        </div>
      </div>

      {#if bracket.is_submitted}
        <div class="bg-green-950/50 border border-green-900 text-green-500 p-4 rounded-lg mb-6">
          Your bracket has been submitted! Good luck! 🍀
        </div>
      {:else}
        <div class="bg-amber-950/50 border border-amber-900 text-amber-500 p-4 rounded-lg mb-6">
          Your bracket is still in draft mode. Don't forget to submit before the tournament starts!
        </div>
      {/if}

      <!-- TODO: Add bracket visualization component here -->
      <div class="text-zinc-300">
        <p class="mb-4">Selected Teams: {bracket.selections.filter(Boolean).length} / 63</p>
      </div>
    </div>
  {:else}
    <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center">
      <p class="text-zinc-300 mb-4">You haven't created a bracket yet.</p>
      <button 
        class="px-6 py-2 bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-500 transition-all duration-200"
      >
        Create New Bracket
      </button>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
</style> 