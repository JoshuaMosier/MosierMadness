<!-- LiveBracket.svelte -->
<script>
    import BracketView from '$lib/components/BracketView.svelte';
    import { onDestroy, onMount } from 'svelte';
    
    export let data;

    let bracketData = data.bracketData;
    let isLoading = false;
    let error = null;
    let refreshInterval;
    const tournamentStage = data.tournamentSettings?.stage || 'archive';
    const isLiveBracketAvailable = tournamentStage === 'tournament-live' || tournamentStage === 'complete';
    
    async function fetchBracketData() {
        try {
            error = null;
            
            const liveRes = await fetch('/api/live-bracket');
            if (!liveRes.ok) {
                throw new Error(`Error fetching live bracket data: ${liveRes.statusText}`);
            }

            bracketData = await liveRes.json();
            
        } catch (err) {
            console.error('Error fetching bracket data:', err);
            error = err.message;
        } finally {
            isLoading = false;
        }
    }
    
    onMount(() => {
        if (isLiveBracketAvailable) {
            refreshInterval = setInterval(fetchBracketData, 30000);
        }
    });

    onDestroy(() => {
        if (refreshInterval) clearInterval(refreshInterval);
    });
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div class="p-6">
            {#if !isLiveBracketAvailable}
                <div class="text-center py-10">
                    <h2 class="text-2xl font-semibold text-zinc-100">Live bracket unavailable</h2>
                    <p class="mt-3 text-zinc-400">
                        The live bracket becomes available once the tournament is underway.
                    </p>
                </div>
            {:else if isLoading}
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
                    showScores={true}
                />
            {/if}
        </div>
    </div>
</div>