<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import { user } from '$lib/stores/user';
</script>

<div class="flex flex-col min-h-screen">
  <Navbar />
  
  <main class="flex-grow">
    <slot />
  </main>

</div> 