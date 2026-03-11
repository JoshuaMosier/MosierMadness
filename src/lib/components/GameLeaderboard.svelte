<script>
	import { onMount } from 'svelte';

	export let userId = null;
	export let showTotalPoints = false;
	export let liveScore = 0;

	let scores = [];
	let loading = true;

	async function fetchScores() {
		try {
			const res = await fetch('/api/game-scores?limit=10');
			if (res.ok) {
				scores = await res.json();
			}
		} catch (err) {
			console.error('Failed to fetch game scores:', err);
		} finally {
			loading = false;
		}
	}

	export function refresh() {
		fetchScores();
	}

	onMount(fetchScores);
</script>

<div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
	<h3 class="text-lg font-semibold text-zinc-100 mb-3">High Scores</h3>

	{#if loading}
		<div class="space-y-2">
			{#each Array(5) as _}
				<div class="h-8 bg-zinc-800/50 rounded animate-pulse"></div>
			{/each}
		</div>
	{:else if scores.length === 0}
		<p class="text-sm text-zinc-500">No scores yet. Be the first!</p>
	{:else}
		{#if showTotalPoints}
			<div class="flex items-center gap-2 px-3 pb-1 text-xs text-zinc-500 uppercase tracking-wide">
				<span class="w-6"></span>
				<span class="flex-1">Name</span>
				<span class="w-12 text-right">Best</span>
				<span class="w-12 text-right">Total</span>
			</div>
		{/if}
		<div class="space-y-1">
			{#each scores as entry, i}
				{@const isCurrentUser = userId && entry.user_id === userId}
				<div
					class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm {isCurrentUser
						? 'bg-amber-900/30 border border-amber-700/40'
						: 'hover:bg-zinc-800/50'}"
				>
					<span class="w-6 text-right font-mono text-zinc-500">{i + 1}</span>
					<span class="flex-1 truncate {isCurrentUser ? 'text-amber-200 font-medium' : 'text-zinc-300'}">
						{entry.profiles?.first_name || '?'} {entry.profiles?.last_name || ''}
					</span>
					<span class="w-12 text-right font-mono {isCurrentUser ? 'text-amber-300' : 'text-zinc-400'}">
						{isCurrentUser ? Math.max(entry.high_score, liveScore) : entry.high_score}
					</span>
					{#if showTotalPoints}
						<span class="w-12 text-right font-mono {isCurrentUser ? 'text-amber-300/70' : 'text-zinc-500'}">
							{isCurrentUser ? (entry.total_points ?? 0) + liveScore : entry.total_points ?? 0}
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
	{#if !userId}
		<p class="mt-3 text-xs text-zinc-500 text-center">
			<a href="/login" class="text-amber-500 hover:text-amber-400 underline">Sign in</a> to track your scores
		</p>
	{/if}
</div>
