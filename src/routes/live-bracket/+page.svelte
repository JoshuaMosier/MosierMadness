<script>
  import { onMount } from 'svelte';
  import BracketView from '$lib/components/BracketView.svelte';

  let loading = true;
  let error = null;
  let bracketData = null;
  let lastUpdated = null;
  let debugData = {
    rawApiResponse: null,
    transformedTeams: null,
    matchesCreated: 0,
    apiError: null
  };

  // Function to transform API data into BracketView format
  function transformBracketData(games) {
    console.log('Transforming games:', games);
    debugData.transformedTeams = games;

    if (!games || !Array.isArray(games)) {
      console.warn('Invalid games data:', games);
      return null;
    }

    const matches = {};
    let matchCount = 0;
    
    // Process each game directly
    games.forEach(game => {
      if (!game.game?.bracketId || !game.game?.bracketRegion) {
        console.warn('Game missing bracket information:', game);
        return;
      }

      // Parse bracketId to determine match position
      // bracketId format: first digit is region (1-4), last two digits are position in region (00-15)
      const bracketId = game.game.bracketId;
      const regionNumber = parseInt(bracketId[0]);
      const positionInRegion = parseInt(bracketId.slice(1));
      
      // Calculate the actual matchId based on round and region
      let matchId;
      if (positionInRegion < 8) {
        // First round: matches 1-32 (8 per region)
        matchId = (regionNumber - 1) * 8 + positionInRegion + 1;
      } else if (positionInRegion < 12) {
        // Second round: matches 33-48 (4 per region)
        matchId = 32 + (regionNumber - 1) * 4 + (positionInRegion - 8) + 1;
      } else if (positionInRegion < 14) {
        // Sweet 16: matches 49-56 (2 per region)
        matchId = 48 + (regionNumber - 1) * 2 + (positionInRegion - 12) + 1;
      } else if (positionInRegion < 15) {
        // Elite 8: matches 57-60 (1 per region)
        matchId = 56 + regionNumber;
      } else if (positionInRegion < 16) {
        // Final Four: matches 61-62
        matchId = 60 + Math.floor(regionNumber / 3) + 1;
      } else {
        // Championship: match 63
        matchId = 63;
      }

      console.log(`Processing game in ${game.game.bracketRegion} region, bracketId ${bracketId}, calculated matchId ${matchId}`);

      // Format team data
      const teamA = {
        name: game.game.away.names.short,
        seed: parseInt(game.game.away.seed),
        seoName: game.game.away.names.seo,
        color: game.game.away.color,
        secondaryColor: game.game.away.secondaryColor,
        score: parseInt(game.game.away.score) || null,
        isWinner: game.game.away.winner
      };

      const teamB = {
        name: game.game.home.names.short,
        seed: parseInt(game.game.home.seed),
        seoName: game.game.home.names.seo,
        color: game.game.home.color,
        secondaryColor: game.game.home.secondaryColor,
        score: parseInt(game.game.home.score) || null,
        isWinner: game.game.home.winner
      };

      // Create the match with proper team ordering based on seeds
      matches[matchId] = {
        teamA: teamA.seed < teamB.seed ? teamA : teamB,
        teamB: teamA.seed < teamB.seed ? teamB : teamA,
        winner: teamA.isWinner ? 'A' : (teamB.isWinner ? 'B' : null)
      };
      matchCount++;
    });

    debugData.matchesCreated = matchCount;
    console.log('Created matches:', matches);

    // Find champion (winner of match 63)
    const finalMatch = matches[63];
    const champion = finalMatch?.winner ? 
      (finalMatch.winner === 'A' ? finalMatch.teamA : finalMatch.teamB) : 
      null;

    return {
      matches,
      champion
    };
  }

  async function fetchLiveBracket() {
    try {
      loading = true;
      error = null;
      debugData.apiError = null;

      console.log('Fetching live bracket data...');
      const response = await fetch('/api/live-bracket');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        debugData.apiError = `${response.status}: ${errorText}`;
        throw new Error(`Error fetching live bracket: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      debugData.rawApiResponse = data;

      if (data.error) {
        debugData.apiError = data.error;
        throw new Error(data.error);
      }

      bracketData = transformBracketData(data.games);
      lastUpdated = data.lastUpdated;
      
      console.log('Final bracket data:', bracketData);
    } catch (err) {
      console.error('Error fetching live bracket:', err);
      error = err.message;
      debugData.apiError = err.message;
    } finally {
      loading = false;
    }
  }

  // Fetch data initially and set up auto-refresh
  onMount(() => {
    fetchLiveBracket();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveBracket, 30000);
    
    return () => clearInterval(interval);
  });

  let showDebug = false;
</script>

<svelte:head>
  <title>Live Tournament Bracket</title>
  <meta name="description" content="View the live March Madness tournament bracket" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
  <!-- Debug Panel Toggle -->
  <button
    class="fixed bottom-4 right-4 bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-amber-500 transition-colors"
    on:click={() => showDebug = !showDebug}
  >
    {showDebug ? 'Hide' : 'Show'} Debug Info
  </button>

  <!-- Debug Panel -->
  {#if showDebug}
    <div class="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-x-auto">
      <h3 class="text-lg font-semibold text-zinc-200 mb-4">Debug Information</h3>
      
      <div class="space-y-4">
        <!-- API Status -->
        <div>
          <h4 class="text-sm font-medium text-zinc-400 mb-1">API Status</h4>
          <div class="bg-zinc-800 p-3 rounded">
            <p class="text-sm">
              Loading: <span class="text-amber-400">{loading}</span><br>
              Error: <span class="text-red-400">{debugData.apiError || 'None'}</span><br>
              Last Updated: <span class="text-green-400">{lastUpdated || 'Never'}</span>
            </p>
          </div>
        </div>

        <!-- Raw API Response -->
        <div>
          <h4 class="text-sm font-medium text-zinc-400 mb-1">Raw API Response</h4>
          <pre class="bg-zinc-800 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(debugData.rawApiResponse, null, 2)}
          </pre>
        </div>

        <!-- Transformed Teams -->
        <div>
          <h4 class="text-sm font-medium text-zinc-400 mb-1">
            Transformed Teams (Count: {debugData.transformedTeams?.length || 0})
          </h4>
          <pre class="bg-zinc-800 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(debugData.transformedTeams, null, 2)}
          </pre>
        </div>

        <!-- Matches Created -->
        <div>
          <h4 class="text-sm font-medium text-zinc-400 mb-1">Matches Created</h4>
          <div class="bg-zinc-800 p-3 rounded">
            <p class="text-sm">Total Matches: <span class="text-amber-400">{debugData.matchesCreated}</span></p>
          </div>
        </div>

        <!-- Final Bracket Data -->
        <div>
          <h4 class="text-sm font-medium text-zinc-400 mb-1">Final Bracket Data</h4>
          <pre class="bg-zinc-800 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(bracketData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  {/if}

  {#if loading && !bracketData}
    <div class="flex justify-center items-center min-h-[600px]">
      <div class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-amber-600 font-medium">Loading tournament bracket...</div>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-lg text-center">
      {error}
    </div>
  {:else}
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <!-- Header Section -->
      <div class="border-b border-zinc-800 bg-zinc-900/50 p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-semibold text-zinc-200">Live Tournament Bracket</h2>
            {#if lastUpdated}
              <p class="text-sm text-zinc-400 mt-1">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            {/if}
          </div>
          {#if loading}
            <div class="flex items-center gap-2 text-amber-600">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm">Updating...</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Bracket View -->
      <div class="p-6">
        <BracketView
          mode="live"
          bracketData={bracketData}
          isLocked={true}
          highlightWinners={true}
          showScores={true}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
</style>