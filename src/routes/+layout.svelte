<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
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
  
  <main class="flex-grow">
    <slot />
  </main>

</div> 