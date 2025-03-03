<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  
  let isMenuOpen = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
  
  function closeMenu() {
    isMenuOpen = false;
  }
</script>

<img id="left-banner" src="/images/ui/MM_Banner_left.png" width="156" height="166" style="position:absolute;z-index:2" alt="Left Banner"/>

<nav class="mb-4 relative">
  <div class="container mx-auto px-4 flex justify-between items-center">
    <!-- Left Navigation -->
    <div class="hidden md:flex items-center space-x-4">
      <a href="/">
        <div class="button nav-center btn-hover text-mm-gray hover:text-mm-blue px-4 py-2 rounded-md font-medium">
          Leaderboard
        </div>
      </a>
      <a href="/bracket">
        <div class="button nav-center btn-hover text-mm-gray hover:text-mm-blue px-4 py-2 rounded-md font-medium">
          Submit Bracket
        </div>
      </a>
      <a href="/entries">
        <div class="button nav-center btn-hover text-mm-gray hover:text-mm-blue px-4 py-2 rounded-md font-medium">
          Entries
        </div>
      </a>
      <a href="/master">
        <div class="button nav-center btn-hover text-mm-gray hover:text-mm-blue px-4 py-2 rounded-md font-medium">
          Master Bracket
        </div>
      </a>
    </div>

    <!-- Center Logo -->
    <div class="flex items-center justify-center">
      <a href="/" class="flex items-center">
        <img src="/images/ui/MM_logo_small.png" alt="Mosier Madness Logo" class="h-16 w-auto" />
      </a>
    </div>

    <!-- Right Navigation -->
    <div class="hidden md:flex items-center space-x-4">
      <a href="/past-winners">
        <div class="button nav-center btn-hover text-mm-gray hover:text-mm-blue px-4 py-2 rounded-md font-medium">
          Past Winners
        </div>
      </a>
      <a href="/stats">
        <div class="button nav-center btn-hover text-mm-gray hover:text-mm-blue px-4 py-2 rounded-md font-medium">
          Statistics
        </div>
      </a>
      <a href="/possibilities">
        <div class="button nav-center btn-hover text-mm-gray hover:text-mm-blue px-4 py-2 rounded-md font-medium">
          Possibilities
        </div>
      </a>
      {#if $user}
        <a href="/logout">
          <div class="button nav-center btn-hover text-mm-gray hover:text-mm-blue px-4 py-2 rounded-md font-medium">
            Logout
          </div>
        </a>
      {:else}
        <a href="/login">
          <div class="button nav-center btn-hover text-mm-gray hover:text-mm-blue px-4 py-2 rounded-md font-medium">
            Login
          </div>
        </a>
      {/if}
    </div>

    <!-- Mobile menu button -->
    <div class="md:hidden">
      <button 
        on:click={toggleMenu}
        class="inline-flex items-center justify-center p-2 rounded-md text-mm-gray hover:text-mm-blue"
      >
        <span class="sr-only">Open main menu</span>
        <svg 
          class={isMenuOpen ? 'hidden' : 'block'} 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          width="24"
          height="24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg 
          class={isMenuOpen ? 'block' : 'hidden'} 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          width="24"
          height="24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Mobile menu -->
  <div class={isMenuOpen ? 'md:hidden' : 'hidden'}>
    <div class="px-2 pt-2 pb-3 space-y-1">
      <a href="/" class="block px-3 py-2 text-mm-gray hover:text-mm-blue">Leaderboard</a>
      <a href="/bracket" class="block px-3 py-2 text-mm-gray hover:text-mm-blue">Submit Bracket</a>
      <a href="/entries" class="block px-3 py-2 text-mm-gray hover:text-mm-blue">Entries</a>
      <a href="/master" class="block px-3 py-2 text-mm-gray hover:text-mm-blue">Master Bracket</a>
      <a href="/past-winners" class="block px-3 py-2 text-mm-gray hover:text-mm-blue">Past Winners</a>
      <a href="/stats" class="block px-3 py-2 text-mm-gray hover:text-mm-blue">Statistics</a>
      <a href="/possibilities" class="block px-3 py-2 text-mm-gray hover:text-mm-blue">Possibilities</a>
      {#if $user}
        <a href="/logout" class="block px-3 py-2 text-mm-gray hover:text-mm-blue">Logout</a>
      {:else}
        <a href="/login" class="block px-3 py-2 text-mm-gray hover:text-mm-blue">Login</a>
      {/if}
    </div>
  </div>
</nav>

<img id="right-banner" src="/images/ui/MM_Banner_right.png" width="156" height="166" style="position:absolute;right:0;top:0;z-index:2" alt="Right Banner"/>

<style>
  .button {
    transition: all 0.3s ease;
  }
  
  .btn-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
</style> 