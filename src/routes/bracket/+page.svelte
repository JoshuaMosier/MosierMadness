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

  // Sample first round teams
  const firstRoundTeams = [
    // South Region (1-16)
    { name: "Houston", seed: 1 }, { name: "N Kentucky", seed: 16 },
    { name: "Iowa", seed: 8 }, { name: "Auburn", seed: 9 },
    { name: "Miami FL", seed: 5 }, { name: "Drake", seed: 12 },
    { name: "Indiana", seed: 4 }, { name: "Kent State", seed: 13 },
    { name: "Iowa State", seed: 6 }, { name: "Pittsburgh", seed: 11 },
    { name: "Xavier", seed: 3 }, { name: "Kennesaw St", seed: 14 },
    { name: "Texas A&M", seed: 7 }, { name: "Penn State", seed: 10 },
    { name: "Texas", seed: 2 }, { name: "Colgate", seed: 15 },

    // East Region (17-32)
    { name: "Purdue", seed: 1 }, { name: "F Dickinson", seed: 16 },
    { name: "Memphis", seed: 8 }, { name: "FAU", seed: 9 },
    { name: "Duke", seed: 5 }, { name: "Oral Roberts", seed: 12 },
    { name: "Tennessee", seed: 4 }, { name: "Louisiana", seed: 13 },
    { name: "Kentucky", seed: 6 }, { name: "Providence", seed: 11 },
    { name: "Kansas St", seed: 3 }, { name: "Montana St", seed: 14 },
    { name: "Michigan St", seed: 7 }, { name: "USC", seed: 10 },
    { name: "Marquette", seed: 2 }, { name: "Vermont", seed: 15 },

    // Midwest Region (33-48)
    { name: "Alabama", seed: 1 }, { name: "Texas A&M CC", seed: 16 },
    { name: "Maryland", seed: 8 }, { name: "West Virginia", seed: 9 },
    { name: "San Diego St", seed: 5 }, { name: "Charleston", seed: 12 },
    { name: "Virginia", seed: 4 }, { name: "Furman", seed: 13 },
    { name: "Creighton", seed: 6 }, { name: "NC State", seed: 11 },
    { name: "Baylor", seed: 3 }, { name: "UCSB", seed: 14 },
    { name: "Missouri", seed: 7 }, { name: "Utah State", seed: 10 },
    { name: "Arizona", seed: 2 }, { name: "Princeton", seed: 15 },

    // West Region (49-64)
    { name: "Kansas", seed: 1 }, { name: "Howard", seed: 16 },
    { name: "Arkansas", seed: 8 }, { name: "Illinois", seed: 9 },
    { name: "Saint Mary's", seed: 5 }, { name: "VCU", seed: 12 },
    { name: "UConn", seed: 4 }, { name: "Iona", seed: 13 },
    { name: "TCU", seed: 6 }, { name: "Arizona St", seed: 11 },
    { name: "Gonzaga", seed: 3 }, { name: "Grand Canyon", seed: 14 },
    { name: "Northwestern", seed: 7 }, { name: "Boise State", seed: 10 },
    { name: "UCLA", seed: 2 }, { name: "UNC Asheville", seed: 15 }
  ];

  // Function to transform bracket data into the format expected by BracketView
  function transformBracketData(bracketData) {
    if (!bracketData) return null;

    const matches = {};
    const selections = bracketData.selections || [];
    
    // Initialize first round matches with actual teams (1-32)
    for (let i = 0; i < 32; i++) {
      matches[i + 1] = {
        teamA: firstRoundTeams[i * 2],
        teamB: firstRoundTeams[i * 2 + 1],
        winner: selections[i] || null
      };
    }

    // Initialize later round matches (33-63)
    for (let i = 32; i < 63; i++) {
      const prevRoundMatchA = Math.floor((i - 32) * 2) + 1;
      const prevRoundMatchB = prevRoundMatchA + 1;
      
      // Get the winning teams from previous matches
      const prevMatchA = matches[prevRoundMatchA];
      const prevMatchB = matches[prevRoundMatchB];
      
      // Get the selected winners from previous matches
      const winnerA = prevMatchA?.winner ? 
        (prevMatchA.winner === 'A' ? prevMatchA.teamA : prevMatchA.teamB) : 
        null;
      
      const winnerB = prevMatchB?.winner ? 
        (prevMatchB.winner === 'A' ? prevMatchB.teamA : prevMatchB.teamB) : 
        null;

      matches[i + 1] = {
        teamA: winnerA,
        teamB: winnerB,
        winner: selections[i] || null
      };
    }

    // Set champion if we have a winner in the final match
    const finalMatch = matches[63];
    const champion = finalMatch?.winner ? 
      (finalMatch.winner === 'A' ? finalMatch.teamA : finalMatch.teamB) : 
      null;

    return {
      matches,
      champion
    };
  }

  // Helper to get the previous round matches for a given match
  function getPreviousMatches(matchId) {
    if (matchId <= 32) return null; // First round matches have no previous matches
    
    const baseMatch = Math.floor((matchId - 33) * 2) + 1;
    return [baseMatch, baseMatch + 1];
  }

  // Handle team selection
  async function handleTeamSelect(event) {
    if (saving || bracket.is_submitted) return;

    const { matchId, teamIndex, team } = event.detail;
    if (!team) return; // Don't handle clicks on empty slots
    
    try {
      saving = true;
      
      // Create new selections array
      const newSelections = [...(bracket.selections || new Array(63).fill(null))];
      
      // Get the current match data before making changes
      const currentMatchData = transformBracketData(bracket).matches[matchId];
      
      // If we're selecting the team that's already selected, do nothing
      if (currentMatchData.winner === teamIndex) {
        saving = false;
        return;
      }
      
      // Update the winner for this match
      newSelections[matchId - 1] = teamIndex;

      // Identify the winning team and losing team
      const winningTeam = teamIndex === 'A' ? currentMatchData.teamA : currentMatchData.teamB;
      const losingTeam = currentMatchData.winner ? 
        (currentMatchData.winner === 'A' ? currentMatchData.teamA : currentMatchData.teamB) :
        (teamIndex === 'A' ? currentMatchData.teamB : currentMatchData.teamA);
      
      // We need to track the path of the losing team and clear only those matches
      // First, create a temporary copy of the bracket with our new selection
      const tempBracket = {
        ...bracket,
        selections: [...newSelections]
      };
      
      // We'll need to simulate the bracket with both the original team winning
      // and the new team winning to identify exactly which matches to clear
      
      // First, let's create a selections array with the original winner
      const originalSelections = [...bracket.selections];
      
      // Then let's run the transform function to see which matches would have the losing team
      const originalBracket = transformBracketData({
        ...bracket,
        selections: originalSelections
      });
      
      // Find the path where the losing team would have appeared
      const matchesWithLosingTeam = new Set();
      
      // Check every match past the current one
      for (let i = matchId + 1; i <= 63; i++) {
        const match = originalBracket.matches[i];
        
        // If this match contains the losing team, add it to our set
        if (match?.teamA?.name === losingTeam?.name || match?.teamB?.name === losingTeam?.name) {
          matchesWithLosingTeam.add(i);
        }
      }
      
      // Now clear only those matches that had the losing team
      matchesWithLosingTeam.forEach(matchId => {
        newSelections[matchId - 1] = null;
      });

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

  // Reset bracket selections
  async function resetBracket() {
    if (saving || bracket.is_submitted) return;
    
    try {
      saving = true;
      
      // Update the bracket in the database with empty selections
      const { error: updateError } = await supabase
        .from('brackets')
        .update({
          selections: new Array(63).fill(null),
          updated_at: new Date().toISOString()
        })
        .eq('id', bracket.id);

      if (updateError) throw updateError;

      // Update local state
      bracket = {
        ...bracket,
        selections: new Array(63).fill(null),
        updated_at: new Date().toISOString()
      };
    } catch (err) {
      console.error('Error resetting bracket:', err);
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

<div class="max-w-7xl mx-auto px-4 py-8">
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
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-semibold text-zinc-200">
            {bracket.is_submitted ? 'Submitted Bracket' : 'Draft Bracket'}
          </h2>
          {#if !bracket.is_submitted}
            <button 
              class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all duration-200 disabled:opacity-50 text-sm"
              on:click={resetBracket}
              disabled={saving}
            >
              Reset Bracket Selections
            </button>
          {/if}
        </div>
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