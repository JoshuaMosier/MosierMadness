<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  
  onMount(() => {
    // Check if user is logged in on page load
    user.checkSession();
  });
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
  <Navbar />
  
  <main class="flex-grow">
    <slot />
  </main>
  
  <footer class="bg-white border-t border-gray-200 py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="mb-4 md:mb-0">
          <a href="/" class="flex items-center">
            <img src="/images/ui/MM_logo_small.png" alt="Mosier Madness Logo" class="h-8 w-auto" />
            <span class="ml-2 text-lg font-bold text-mm-blue">Mosier Madness</span>
          </a>
          <p class="text-sm text-mm-gray mt-2">NCAA March Madness Bracket Challenge</p>
        </div>
        
        <div class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6">
          <a href="/about" class="text-mm-gray hover:text-mm-blue text-sm">About</a>
          <a href="/rules" class="text-mm-gray hover:text-mm-blue text-sm">Rules</a>
          <a href="/privacy" class="text-mm-gray hover:text-mm-blue text-sm">Privacy Policy</a>
          <a href="/terms" class="text-mm-gray hover:text-mm-blue text-sm">Terms of Service</a>
        </div>
      </div>
      
      <div class="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-mm-gray">
        <p>&copy; {new Date().getFullYear()} Mosier Madness. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div> 