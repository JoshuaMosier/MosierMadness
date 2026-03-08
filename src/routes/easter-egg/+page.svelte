<script>
	import BasketballGame from '$lib/components/BasketballGame.svelte';
	import { supabase } from '$lib/supabase';

	async function handleGameOver({ score, madeShots }) {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		try {
			await fetch('/api/game-scores', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ score, madeShots })
			});
		} catch (err) {
			console.error('Failed to submit score:', err);
		}
	}
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
	<BasketballGame onGameOver={handleGameOver} />
</div>
