<script lang="ts">
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import ScoreTicker from '$lib/components/ScoreTicker.svelte';
  import { supabase } from '$lib/supabase'
  import { invalidate, beforeNavigate, afterNavigate } from '$app/navigation'
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { dataRefreshSignal, initRealtimeRefresh } from '$lib/stores/realtimeUpdates'

  export let data: any;
  // Define routes where ScoreTicker should be hidden
  const hideScoreTickerRoutes: string[] = [
    '/scores',
  ];

  // Reactive statement to determine if ScoreTicker should be visible
  $: showScoreTicker = !hideScoreTickerRoutes.includes($page.url.pathname);

  // Debounce invalidate to avoid race with navigation (SvelteKit can "eat" clicks when
  // invalidate runs during a nav - see sveltejs/kit#9354, #10876)
  const INVALIDATE_DEBOUNCE_MS = 2000;
  let invalidateTimeout: ReturnType<typeof setTimeout>;
  let isNavigating = false;
  let pendingInvalidate = false;

  beforeNavigate(() => {
    isNavigating = true;
  });

  afterNavigate(() => {
    isNavigating = false;
    if (pendingInvalidate) {
      pendingInvalidate = false;
      invalidate('app:tournament');
    }
  });

  $: if ($dataRefreshSignal) {
    clearTimeout(invalidateTimeout);
    invalidateTimeout = setTimeout(() => {
      if (isNavigating) {
        pendingInvalidate = true;
      } else {
        invalidate('app:tournament');
      }
    }, INVALIDATE_DEBOUNCE_MS);
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
  <Navbar stage={data.tournamentSettings?.stage || 'archive'} />
  <div class="container mx-auto px-4">
    {#if showScoreTicker}
      <ScoreTicker tournamentSettings={data.tournamentSettings} tickerScores={data.tickerScores ?? []} />
    {/if}
  </div>
  <main class="flex-grow">
    <slot />
  </main>

</div>
