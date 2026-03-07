<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import ScoreTicker from '$lib/components/ScoreTicker.svelte';
  import { supabase } from '$lib/supabase'
  import { invalidate, invalidateAll } from '$app/navigation'
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { dataRefreshSignal, initRealtimeRefresh } from '$lib/stores/realtimeUpdates'

  export let data;
  // Define routes where ScoreTicker should be hidden
  const hideScoreTickerRoutes = [
    '/scores',
  ];

  // Reactive statement to determine if ScoreTicker should be visible
  $: showScoreTicker = !hideScoreTickerRoutes.includes($page.url.pathname);

  $: if ($dataRefreshSignal) {
    invalidateAll();
  }

  onMount(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      invalidate('supabase:auth')
    })

    const cleanupRealtime = initRealtimeRefresh(supabase);

    return () => {
      subscription.unsubscribe();
      cleanupRealtime();
    }
  })
</script>

<div class="flex flex-col min-h-screen">
  <Navbar />
  <div class="container mx-auto px-4">
    {#if showScoreTicker}
      <ScoreTicker tournamentSettings={data.tournamentSettings} tickerScores={data.tickerScores ?? []} />
    {/if}
  </div>
  <main class="flex-grow">
    <slot />
  </main>

</div>
