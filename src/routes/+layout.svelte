<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import ScoreTicker from '$lib/components/ScoreTicker.svelte';
  import { supabase } from '$lib/supabase'
  import { invalidate } from '$app/navigation'
  import { onMount } from 'svelte'

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
  
  <div class="container mx-auto px-4 py-2">
    <ScoreTicker />
  </div>
  
  <main class="flex-grow">
    <slot />
  </main>

</div> 