<script lang="ts">
	import BasketballGameModule from '$lib/components/BasketballGameModule.svelte';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let userId: string | null = null;

	onMount(async () => {
		const { data: { user } } = await supabase.auth.getUser();
		userId = user?.id || null;
	});
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
	<BasketballGameModule {userId} />
</div>
