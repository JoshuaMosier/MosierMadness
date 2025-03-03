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

<nav class="bg-white border-b border-gray-200">
  <div class="container mx-auto px-4">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex-shrink-0 flex items-center">
        <a href="/" class="flex items-center">
          <img src="/images/ui/MM_logo_small.png" alt="Mosier Madness Logo" class="h-10 w-auto" />
          <span class="ml-2 text-xl font-bold text-mm-blue">Mosier Madness</span>
        </a>
      </div>
      
      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-4">
        <a href="/" class="text-mm-gray hover:text-mm-blue px-3 py-2 rounded-md font-medium">Leaderboard</a>
        <a href="/bracket" class="text-mm-gray hover:text-mm-blue px-3 py-2 rounded-md font-medium">My Bracket</a>
        <a href="/rules" class="text-mm-gray hover:text-mm-blue px-3 py-2 rounded-md font-medium">Rules</a>
        <a href="/about" class="text-mm-gray hover:text-mm-blue px-3 py-2 rounded-md font-medium">About</a>
        
        {#if $user}
          <div class="relative group ml-4">
            <button class="flex items-center text-mm-gray hover:text-mm-blue px-3 py-2 rounded-md font-medium">
              <span>{$user.firstname || 'User'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <a href="/profile" class="block px-4 py-2 text-sm text-mm-gray hover:bg-gray-100">My Profile</a>
              <button 
                on:click={() => user.signOut()} 
                class="block w-full text-left px-4 py-2 text-sm text-mm-gray hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        {:else}
          <a 
            href="/login" 
            class="ml-4 bg-mm-blue text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
          >
            Sign In
          </a>
          <a 
            href="/register" 
            class="ml-2 bg-mm-gold text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
          >
            Register
          </a>
        {/if}
      </div>
      
      <!-- Mobile menu button -->
      <div class="md:hidden flex items-center">
        <button 
          on:click={toggleMenu}
          class="inline-flex items-center justify-center p-2 rounded-md text-mm-gray hover:text-mm-blue focus:outline-none"
          aria-expanded={isMenuOpen}
        >
          <span class="sr-only">Open main menu</span>
          <!-- Icon when menu is closed -->
          <svg 
            class={isMenuOpen ? 'hidden' : 'block'} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            aria-hidden="true"
            width="24"
            height="24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <!-- Icon when menu is open -->
          <svg 
            class={isMenuOpen ? 'block' : 'hidden'} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            aria-hidden="true"
            width="24"
            height="24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
  
  <!-- Mobile menu -->
  <div class={isMenuOpen ? 'md:hidden' : 'hidden'}>
    <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
      <a href="/" on:click={closeMenu} class="block px-3 py-2 rounded-md text-base font-medium text-mm-gray hover:text-mm-blue">Leaderboard</a>
      <a href="/bracket" on:click={closeMenu} class="block px-3 py-2 rounded-md text-base font-medium text-mm-gray hover:text-mm-blue">My Bracket</a>
      <a href="/rules" on:click={closeMenu} class="block px-3 py-2 rounded-md text-base font-medium text-mm-gray hover:text-mm-blue">Rules</a>
      <a href="/about" on:click={closeMenu} class="block px-3 py-2 rounded-md text-base font-medium text-mm-gray hover:text-mm-blue">About</a>
      
      {#if $user}
        <a href="/profile" on:click={closeMenu} class="block px-3 py-2 rounded-md text-base font-medium text-mm-gray hover:text-mm-blue">My Profile</a>
      {/if}
    </div>
    <div class="pt-4 pb-3 border-t border-gray-200">
      <div class="px-2 space-y-1">
        {#if $user}
          <button 
            on:click={() => { user.signOut(); closeMenu(); }} 
            class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-mm-gray hover:text-mm-blue"
          >
            Sign Out
          </button>
        {:else}
          <a 
            href="/login" 
            on:click={closeMenu}
            class="block px-3 py-2 rounded-md text-base font-medium text-mm-gray hover:text-mm-blue"
          >
            Sign In
          </a>
          <a 
            href="/register" 
            on:click={closeMenu}
            class="block px-3 py-2 rounded-md text-base font-medium text-mm-gray hover:text-mm-blue"
          >
            Register
          </a>
        {/if}
      </div>
    </div>
  </div>
</nav> 