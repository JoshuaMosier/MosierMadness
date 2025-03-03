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
  
  <footer class="py-8">
    <div class="mt-8 pt-6 text-center text-sm text-black">
      <p>&copy; {new Date().getFullYear()} Mosier Madness. All rights reserved.</p>
    </div>
  </footer>
</div> 