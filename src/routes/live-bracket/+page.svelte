<!-- LiveBracket.svelte -->
<script>
    import BracketView from '$lib/components/BracketView.svelte';
    import { onMount } from 'svelte';
    
    let bracketData = {
        matches: {},
        champion: null
    };
    let isLoading = true;
    let error = null;
    
    async function fetchBracketData() {
        try {
            isLoading = true;
            error = null;
            
            // Fetch live results
            const liveRes = await fetch('/api/live-bracket');
            const { matches } = await liveRes.json();
            
            // Find champion if match 63 is completed
            const championMatch = matches[63];
            const champion = championMatch?.teamA || null;
            
            bracketData = {
                matches,
                champion
            };
            
            console.log('Bracket data loaded:', {
                totalMatches: Object.keys(matches).length,
                firstRoundSample: matches[1],
                champion
            });
            
        } catch (err) {
            console.error('Error fetching bracket data:', err);
            error = err.message;
        } finally {
            isLoading = false;
        }
    }
    
    onMount(() => {
        fetchBracketData();
    });
</script>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-8">Live Tournament Bracket</h1>
    
    {#if isLoading}
        <div class="text-center">
            <p class="text-lg">Loading bracket data...</p>
        </div>
    {:else if error}
        <div class="text-center text-red-500">
            <p class="text-lg">Error: {error}</p>
            <button 
                class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                on:click={fetchBracketData}
            >
                Retry
            </button>
        </div>
    {:else}
        <BracketView
            mode="live"
            {bracketData}
            highlightWinners={true}
            showScores={true}
        />
    {/if}
</div>