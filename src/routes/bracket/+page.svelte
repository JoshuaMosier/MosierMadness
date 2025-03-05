<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import BracketView from '$lib/components/BracketView.svelte';
  import { fade } from 'svelte/transition';
  import teamColors from '$lib/ncaa_team_colors.json';

  let loading = true;
  let error = null;
  let user = null;
  let bracket = null;
  let saving = false;
  let showResetModal = false;
  let teamSelectionSaving = false; // Separate saving state for team selections
  let bracketActionSaving = false; // Separate saving state for major bracket actions
  let firstRoundTeams = []; // Will be populated dynamically

  // Function to fetch and format teams from NCAA API
  async function fetchBracketTeams() {
    try {
      // Fetch teams from our server endpoint
      const response = await fetch('/api/bracket-teams');
      if (!response.ok) {
        throw new Error(`Error fetching teams: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      firstRoundTeams = data;
      
    } catch (err) {
      console.error('Error fetching bracket teams:', err);
      error = err.message;
      
      // Fallback to using sample data if API fails
      firstRoundTeams = [
        // South Region (1-16)
        { name: "Houston", seed: 1, seoName: "houston" }, 
        { name: "N Kentucky", seed: 16, seoName: "n-kentucky" },
        { name: "Iowa", seed: 8, seoName: "iowa" }, 
        { name: "Auburn", seed: 9, seoName: "auburn" },
        { name: "Miami FL", seed: 5, seoName: "miami-fl" }, 
        { name: "Drake", seed: 12, seoName: "drake" },
        { name: "Indiana", seed: 4, seoName: "indiana" }, 
        { name: "Kent State", seed: 13, seoName: "kent-st" },
        { name: "Iowa State", seed: 6, seoName: "iowa-st" }, 
        { name: "Pittsburgh", seed: 11, seoName: "pittsburgh" },
        { name: "Xavier", seed: 3, seoName: "xavier" }, 
        { name: "Kennesaw St", seed: 14, seoName: "kennesaw-st" },
        { name: "Texas A&M", seed: 7, seoName: "texas-am" }, 
        { name: "Penn State", seed: 10, seoName: "penn-st" },
        { name: "Texas", seed: 2, seoName: "texas" }, 
        { name: "Colgate", seed: 15, seoName: "colgate" },

        // East Region (17-32)
        { name: "Purdue", seed: 1, seoName: "purdue" }, 
        { name: "F Dickinson", seed: 16, seoName: "fairleigh-dickinson" },
        { name: "Memphis", seed: 8, seoName: "memphis" }, 
        { name: "FAU", seed: 9, seoName: "fau" },
        { name: "Duke", seed: 5, seoName: "duke" }, 
        { name: "Oral Roberts", seed: 12, seoName: "oral-roberts" },
        { name: "Tennessee", seed: 4, seoName: "tennessee" }, 
        { name: "Louisiana", seed: 13, seoName: "louisiana" },
        { name: "Kentucky", seed: 6, seoName: "kentucky" }, 
        { name: "Providence", seed: 11, seoName: "providence" },
        { name: "Kansas St", seed: 3, seoName: "kansas-st" }, 
        { name: "Montana St", seed: 14, seoName: "montana-st" },
        { name: "Michigan St", seed: 7, seoName: "michigan-st" }, 
        { name: "USC", seed: 10, seoName: "southern-california" },
        { name: "Marquette", seed: 2, seoName: "marquette" }, 
        { name: "Vermont", seed: 15, seoName: "vermont" },

        // Midwest Region (33-48)
        { name: "Alabama", seed: 1, seoName: "alabama" }, 
        { name: "Texas A&M CC", seed: 16, seoName: "texas-am-cc" },
        { name: "Maryland", seed: 8, seoName: "maryland" }, 
        { name: "West Virginia", seed: 9, seoName: "west-virginia" },
        { name: "San Diego St", seed: 5, seoName: "san-diego-st" }, 
        { name: "Charleston", seed: 12, seoName: "charleston" },
        { name: "Virginia", seed: 4, seoName: "virginia" }, 
        { name: "Furman", seed: 13, seoName: "furman" },
        { name: "Creighton", seed: 6, seoName: "creighton" }, 
        { name: "NC State", seed: 11, seoName: "nc-state" },
        { name: "Baylor", seed: 3, seoName: "baylor" }, 
        { name: "UCSB", seed: 14, seoName: "uc-santa-barbara" },
        { name: "Missouri", seed: 7, seoName: "missouri" }, 
        { name: "Utah State", seed: 10, seoName: "utah-st" },
        { name: "Arizona", seed: 2, seoName: "arizona" }, 
        { name: "Princeton", seed: 15, seoName: "princeton" },

        // West Region (49-64)
        { name: "Kansas", seed: 1, seoName: "kansas" }, 
        { name: "Howard", seed: 16, seoName: "howard" },
        { name: "Arkansas", seed: 8, seoName: "arkansas" }, 
        { name: "Illinois", seed: 9, seoName: "illinois" },
        { name: "Saint Mary's", seed: 5, seoName: "saint-marys-ca" }, 
        { name: "VCU", seed: 12, seoName: "vcu" },
        { name: "UConn", seed: 4, seoName: "connecticut" }, 
        { name: "Iona", seed: 13, seoName: "iona" },
        { name: "TCU", seed: 6, seoName: "tcu" }, 
        { name: "Arizona St", seed: 11, seoName: "arizona-st" },
        { name: "Gonzaga", seed: 3, seoName: "gonzaga" }, 
        { name: "Grand Canyon", seed: 14, seoName: "grand-canyon" },
        { name: "Northwestern", seed: 7, seoName: "northwestern" }, 
        { name: "Boise State", seed: 10, seoName: "boise-st" },
        { name: "UCLA", seed: 2, seoName: "ucla" }, 
        { name: "UNC Asheville", seed: 15, seoName: "unc-asheville" }
      ];
    }
  }

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
    if (teamSelectionSaving || bracket.is_submitted) return;

    const { matchId, teamIndex, team } = event.detail;
    if (!team) return;
    
    try {
      teamSelectionSaving = true;
      
      // Create new selections array
      const newSelections = [...(bracket.selections || new Array(63).fill(null))];
      
      // Get the current match data before making changes
      const currentMatchData = transformBracketData(bracket).matches[matchId];
      
      // If we're selecting the team that's already selected, do nothing
      if (currentMatchData.winner === teamIndex) {
        teamSelectionSaving = false;
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
      teamSelectionSaving = false;
    }
  }

  // Reset bracket selections
  async function resetBracket() {
    if (bracketActionSaving || bracket.is_submitted) return;
    
    try {
      bracketActionSaving = true;
      
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
      bracketActionSaving = false;
      showResetModal = false;
    }
  }

  // Submit bracket
  async function submitBracket() {
    if (bracketActionSaving || bracket.is_submitted) return;

    try {
      bracketActionSaving = true;
      
      // Update the bracket in the database - removed submitted_at
      const { error: updateError } = await supabase
        .from('brackets')
        .update({
          is_submitted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', bracket.id);

      if (updateError) throw updateError;

      // Update local state - removed submitted_at
      bracket = {
        ...bracket,
        is_submitted: true,
        updated_at: new Date().toISOString()
      };
    } catch (err) {
      console.error('Error submitting bracket:', err);
      error = err.message;
    } finally {
      bracketActionSaving = false;
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

  // Add this new function near your other bracket functions
  async function unlockBracket() {
    if (saving) return;
    
    try {
      saving = true;
      
      const { error: updateError } = await supabase
        .from('brackets')
        .update({
          is_submitted: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', bracket.id);

      if (updateError) throw updateError;

      bracket = {
        ...bracket,
        is_submitted: false,
        updated_at: new Date().toISOString()
      };
    } catch (err) {
      console.error('Error unlocking bracket:', err);
      error = err.message;
    } finally {
      saving = false;
    }
  }

  // Modified onMount to fetch teams first
  onMount(async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user = currentUser;

      if (!user) {
        goto('/login');
        return;
      }

      // Fetch teams first
      await fetchBracketTeams();

      // Fetch user's bracket
      const { data, error: bracketError } = await supabase
        .from('brackets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (bracketError && bracketError.code !== 'PGRST116') throw bracketError;
      bracket = data;
    } catch (err) {
      console.error('Error in initialization:', err);
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

{#if showResetModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md mx-4">
      <h3 class="text-xl font-semibold text-zinc-200 mb-2">Reset Bracket?</h3>
      <p class="text-zinc-400 mb-6">
        This will remove all of your selections and cannot be undone. Are you sure you want to continue?
      </p>
      <div class="flex justify-end gap-3">
        <button
          class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all duration-200"
          on:click={() => showResetModal = false}
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all duration-200"
          on:click={resetBracket}
          disabled={bracketActionSaving}
        >
          {bracketActionSaving ? 'Resetting...' : 'Reset Bracket'}
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="max-w-7xl mx-auto px-4 py-8">
  {#if loading}
    <div class="flex justify-center items-center min-h-[600px]" in:fade={{ duration: 100 }}>
      <div class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-amber-600 font-medium">Loading your bracket...</div>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-lg text-center" 
         in:fade={{ duration: 100, delay: 100 }}>
      {error}
    </div>
  {:else if !user}
    <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center"
         in:fade={{ duration: 100, delay: 100 }}>
      <p class="text-zinc-300 mb-4">Please log in to view or submit your bracket.</p>
      <a 
        href="/login" 
        class="inline-block px-6 py-2 bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-500 transition-all duration-200"
      >
        Login
      </a>
    </div>
  {:else if bracket}
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
         in:fade={{ duration: 300, delay: 100 }}>
      <!-- Header Section -->
      <div class="border-b border-zinc-800 bg-zinc-900/50">
        <div class="p-6">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 class="text-2xl font-semibold text-zinc-200">
                {bracket.is_submitted ? 'Submitted Bracket' : 'Draft Bracket'}
              </h2>
              <div class="flex items-center gap-4 mt-1">
                <p class="text-sm text-zinc-400">
                  Last updated: {new Date(bracket.updated_at).toLocaleString()}
                </p>
                {#if bracket.is_submitted}
                  <div class="flex items-center gap-2">
                    <div class="bg-green-500/20 p-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <span class="text-sm text-green-500">Bracket Submitted</span>
                  </div>
                {:else}
                  <div class="flex items-center gap-2">
                    <div class="bg-amber-500/20 p-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <span class="text-sm text-amber-500">Selected Teams: {bracket.selections.filter(Boolean).length} / 63</span>
                  </div>
                {/if}
              </div>
            </div>
            <div class="flex items-center gap-3">
              {#if bracket.is_submitted}
                <button 
                  class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all duration-200 disabled:opacity-50 text-sm"
                  on:click={unlockBracket}
                  disabled={bracketActionSaving}
                >
                  {bracketActionSaving ? 'Unlocking...' : 'Unlock for Edits'}
                </button>
              {:else}
                <button 
                  class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all duration-200 disabled:opacity-50 text-sm"
                  on:click={() => showResetModal = true}
                  disabled={bracketActionSaving}
                >
                  Reset Selections
                </button>
                <div class="relative group">
                  <button 
                    class="px-6 py-2 bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                           {bracket.selections.filter(Boolean).length < 63 ? 'hover:from-amber-700 hover:to-amber-600' : 'hover:from-amber-600 hover:to-amber-500'}"
                    on:click={submitBracket}
                    disabled={bracketActionSaving || bracket.selections.filter(Boolean).length < 63}
                  >
                    {bracketActionSaving ? 'Submitting...' : 'Submit Bracket'}
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Bracket View -->
      <div class="p-6">
        <BracketView
          mode={bracket.is_submitted ? 'view' : 'select'}
          bracketData={transformBracketData(bracket)}
          isLocked={bracket.is_submitted}
          showScores={false}
          on:teamSelect={handleTeamSelect}
        />
      </div>
    </div>
  {:else}
    <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center"
         in:fade={{ duration: 100, delay: 100 }}>
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