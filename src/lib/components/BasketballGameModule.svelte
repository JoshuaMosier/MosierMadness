<script lang="ts">
	import BasketballGame from '$lib/components/BasketballGame.svelte';
	import GameLeaderboard from '$lib/components/GameLeaderboard.svelte';

	export let userId: string | null = null;

	let gameLeaderboard: GameLeaderboard;
	let liveScore = 0;

	function handleScore({ score }: { score: number }): void {
		liveScore = score;
	}

	async function handleGameOver({ score, madeShots }: { score: number; madeShots: number }): Promise<void> {
		if (!userId) return;

		try {
			await fetch('/api/game-scores', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ score, madeShots })
			});
			liveScore = 0;
			gameLeaderboard?.refresh();
		} catch (err) {
			console.error('Failed to submit score:', err);
		}
	}
</script>

<div class="flex flex-col xl:flex-row gap-6">
	<div class="flex-1 min-w-0">
		<BasketballGame onGameOver={handleGameOver} onScore={handleScore} />
	</div>
	<div class="xl:w-80 flex-shrink-0">
		<GameLeaderboard {userId} {liveScore} showTotalPoints bind:this={gameLeaderboard} />
	</div>
</div>
