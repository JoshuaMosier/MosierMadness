<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import ScoreTicker from '$lib/components/ScoreTicker.svelte';
  import { supabase } from '$lib/supabase'
  import { invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { injectAnalytics } from '@vercel/analytics/sveltekit'
  
  // Define routes where ScoreTicker should be hidden
  const hideScoreTickerRoutes = [
    '/scores',
  ];

  // Reactive statement to determine if ScoreTicker should be visible
  $: showScoreTicker = !hideScoreTickerRoutes.includes($page.url.pathname);

  onMount(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      invalidate('supabase:auth')
    })

    return () => subscription.unsubscribe()
  })
</script>

<div class="flex flex-col min-h-screen">
  <Navbar />
  <!-- <div class="container mx-auto px-4">
    {#if showScoreTicker}
      <ScoreTicker />
    {/if}
  </div> -->
  <main class="flex-grow">
    <slot />
  </main>

</div> 