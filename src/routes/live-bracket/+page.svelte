<!-- LiveBracket.svelte -->
<script>
    import BracketView from '$lib/components/BracketView.svelte';
    import { invalidateAll } from '$app/navigation';

    export let data;

    $: bracketData = data.bracketData;
    $: tournamentStage = data.tournamentSettings?.stage || 'archive';
    $: isLiveBracketAvailable = tournamentStage === 'tournament-live' || tournamentStage === 'complete';

    let error = null;

    async function retry() {
        error = null;
        try {
            await invalidateAll();
        } catch (err) {
            error = err.message;
        }
    }
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
            {:else if error}
                <div class="text-center text-red-500">
                    <p class="text-lg">Error: {error}</p>
                    <button
                        class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        on:click={retry}
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
