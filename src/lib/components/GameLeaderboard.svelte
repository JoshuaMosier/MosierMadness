<script>
	import { onMount } from 'svelte';

	export let userId = null;

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
					<span class="font-mono {isCurrentUser ? 'text-amber-300' : 'text-zinc-400'}">
						{entry.high_score}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
