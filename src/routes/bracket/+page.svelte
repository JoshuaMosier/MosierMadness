<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import BracketView from '$lib/components/BracketView.svelte';

  let loading = true;
  let error = null;
  let user = null;
  let bracket = null;
  let saving = false;

  // Function to transform bracket data into the format expected by BracketView
  function transformBracketData(bracketData) {
    if (!bracketData) return null;

    const matches = {};
    const selections = bracketData.selections || [];
    
    // Initialize matches with teams from the database
    // This would need to be updated with actual team data from your database
    // For now, we'll use placeholder data
    for (let i = 0; i < 63; i++) {
      matches[i + 1] = {
        teamA: selections[i * 2] ? { name: selections[i * 2], seed: 1 } : null,
        teamB: selections[i * 2 + 1] ? { name: selections[i * 2 + 1], seed: 2 } : null,
        winner: null // You'll need to determine this based on your data structure
      };
    }

    return {
      matches,
      champion: bracketData.champion ? { name: bracketData.champion, seed: 1 } : null
    };
  }

  // Handle team selection
  async function handleTeamSelect(event) {
    if (saving || bracket.is_submitted) return;

    const { matchId, teamIndex, team } = event.detail;
    
    // Update the bracket data
    // This is a simplified example - you'll need to adjust based on your data structure
    const newSelections = [...bracket.selections];
    newSelections[matchId * 2 + (teamIndex === 'A' ? 0 : 1)] = team.name;

    try {
      saving = true;
      
      // Update the bracket in the database
      const { error: updateError } = await supabase
        .from('brackets')
        .update({
          selections: newSelections,
          updated_at: new Date().toISOString()
        })
        .eq('id', bracket.id);

      if (updateError) throw updateError;

      // Update local state
      bracket = {
        ...bracket,
        selections: newSelections,
        updated_at: new Date().toISOString()
      };
    } catch (err) {
      console.error('Error updating bracket:', err);
      error = err.message;
    } finally {
      saving = false;
    }
  }

  // Submit bracket
  async function submitBracket() {
    if (saving || bracket.is_submitted) return;

    try {
      saving = true;
      
      // Update the bracket in the database
      const { error: updateError } = await supabase
        .from('brackets')
        .update({
          is_submitted: true,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bracket.id);

      if (updateError) throw updateError;

      // Update local state
      bracket = {
        ...bracket,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (err) {
      console.error('Error submitting bracket:', err);
      error = err.message;
    } finally {
      saving = false;
    }
  }

  // Create new bracket
  async function createBracket() {
    if (saving) return;

    try {
      saving = true;
      
      // Create a new bracket in the database
      const { data, error: createError } = await supabase
        .from('brackets')
        .insert({
          user_id: user.id,
          selections: new Array(126).fill(null), // Space for 63 matches * 2 teams
          is_submitted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      // Update local state
      bracket = data;
    } catch (err) {
      console.error('Error creating bracket:', err);
      error = err.message;
    } finally {
      saving = false;
    }
  }

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

      if (bracketError && bracketError.code !== 'PGRST116') throw bracketError;
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
          <div class="flex justify-between items-center">
            <p>Your bracket is still in draft mode. Don't forget to submit before the tournament starts!</p>
            <button 
              class="px-6 py-2 bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-500 transition-all duration-200 disabled:opacity-50"
              on:click={submitBracket}
              disabled={saving || bracket.selections.filter(Boolean).length < 63}
            >
              {saving ? 'Submitting...' : 'Submit Bracket'}
            </button>
          </div>
        </div>
      {/if}

      <div class="text-zinc-300 mb-4">
        <p>Selected Teams: {bracket.selections.filter(Boolean).length} / 63</p>
      </div>

      <!-- Bracket View Component -->
      <BracketView
        mode={bracket.is_submitted ? 'view' : 'select'}
        bracketData={transformBracketData(bracket)}
        isLocked={bracket.is_submitted}
        showScores={false}
        on:teamSelect={handleTeamSelect}
      />
    </div>
  {:else}
    <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center">
      <p class="text-zinc-300 mb-4">You haven't created a bracket yet.</p>
      <button 
        class="px-6 py-2 bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-500 transition-all duration-200 disabled:opacity-50"
        on:click={createBracket}
        disabled={saving}
      >
        {saving ? 'Creating...' : 'Create New Bracket'}
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