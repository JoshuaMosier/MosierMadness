<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import BracketView from '$lib/components/BracketView.svelte';

  let loading = true;
  let error = null;
  let bracketData = null;

  // Sample teams data - replace with actual data later
  const teams = [
    { name: "UConn", seed: 1, score: 85 },
    { name: "Purdue", seed: 2, score: 75 },
    { name: "Houston", seed: 1, score: 82 },
    { name: "Tennessee", seed: 2, score: 68 },
    { name: "Alabama", seed: 4, score: 72 },
    { name: "Illinois", seed: 3, score: 79 },
    { name: "Duke", seed: 4, score: 78 },
    { name: "Iowa State", seed: 2, score: 73 }
  ];

  // Function to get a random team with a score
  function getRandomTeam(seedRange = [1, 16]) {
    const team = teams[Math.floor(Math.random() * teams.length)];
    return {
      ...team,
      seed: seedRange[0] + Math.floor(Math.random() * (seedRange[1] - seedRange[0] + 1)),
      score: 60 + Math.floor(Math.random() * 30)
    };
  }

  // Function to transform database data into the format expected by BracketView
  function generateSampleBracketData() {
    const matches = {};
    
    // First round - 32 matches (1-32)
    for (let i = 0; i < 32; i++) {
      const seedA = i % 8 + 1;
      const seedB = 16 - seedA;
      const teamA = getRandomTeam([seedA, seedA]);
      const teamB = getRandomTeam([seedB, seedB]);
      matches[i + 1] = {
        teamA,
        teamB,
        winner: teamA.score > teamB.score ? 'A' : 'B'
      };
    }

    // Second round - 16 matches (33-48)
    for (let i = 0; i < 16; i++) {
      const teamA = getRandomTeam([1, 8]);
      const teamB = getRandomTeam([1, 8]);
      matches[i + 33] = {
        teamA,
        teamB,
        winner: teamA.score > teamB.score ? 'A' : 'B'
      };
    }

    // Sweet 16 - 8 matches (49-56)
    for (let i = 0; i < 8; i++) {
      const teamA = getRandomTeam([1, 4]);
      const teamB = getRandomTeam([1, 4]);
      matches[i + 49] = {
        teamA,
        teamB,
        winner: teamA.score > teamB.score ? 'A' : 'B'
      };
    }

    // Elite 8 - 4 matches (57-60)
    for (let i = 0; i < 4; i++) {
      const teamA = getRandomTeam([1, 3]);
      const teamB = getRandomTeam([1, 3]);
      matches[i + 57] = {
        teamA,
        teamB,
        winner: teamA.score > teamB.score ? 'A' : 'B'
      };
    }

    // Final Four - 2 matches (61-62)
    for (let i = 0; i < 2; i++) {
      const teamA = getRandomTeam([1, 2]);
      const teamB = getRandomTeam([1, 2]);
      matches[i + 61] = {
        teamA,
        teamB,
        winner: teamA.score > teamB.score ? 'A' : 'B'
      };
    }

    // Championship - 1 match (63)
    const championshipTeamA = getRandomTeam([1, 1]);
    const championshipTeamB = getRandomTeam([1, 1]);
    matches[63] = {
      teamA: championshipTeamA,
      teamB: championshipTeamB,
      winner: championshipTeamA.score > championshipTeamB.score ? 'A' : 'B'
    };

    return {
      matches,
      champion: championshipTeamA.score > championshipTeamB.score ? championshipTeamA : championshipTeamB
    };
  }

  onMount(() => {
    try {
      // Generate sample data instead of fetching from database
      bracketData = generateSampleBracketData();
    } catch (err) {
      console.error('Error generating sample bracket:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Mosier Madness - Live Tournament Bracket</title>
  <meta name="description" content="View the live March Madness tournament bracket" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold text-amber-600 mb-2">Live Tournament Bracket</h1>
    <p class="text-xl text-zinc-400">Follow the tournament progress in real-time</p>
  </div>

  {#if loading}
    <div class="flex justify-center items-center min-h-[200px]">
      <div class="text-amber-600">Loading tournament bracket...</div>
    </div>
  {:else if error}
    <div class="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-lg text-center">
      {error}
    </div>
  {:else}
    <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
      <!-- Live Bracket View Component -->
      <BracketView
        mode="live"
        bracketData={bracketData}
        isLocked={true}
        highlightWinners={true}
        showScores={true}
      />
    </div>
  {/if}
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
</style>