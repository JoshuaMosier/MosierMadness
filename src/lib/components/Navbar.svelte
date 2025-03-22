<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { page } from '$app/stores';
  
  let isMenuOpen = false;
  let user = null;
  let userEntry = null;
  let isSpinning = false;
  
  // Get current path for active state
  $: currentPath = $page.url.pathname;
  
  onMount(async () => {
    // Get initial auth state
    const { data: { user: initialUser } } = await supabase.auth.getUser();
    user = initialUser;

    if (user) {
      // Fetch the user's entry
      const { data: profiles } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('email', user.email)
        .single();

      if (profiles) {
        userEntry = profiles;
      }
    }
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      user = session?.user || null;
      
      if (user) {
        // Fetch the user's entry on auth state change
        const { data: profiles } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('email', user.email)
          .single();

        if (profiles) {
          userEntry = profiles;
        }
      } else {
        userEntry = null;
      }
    });

    // Cleanup subscription on component destroy
    return () => {
      subscription?.unsubscribe();
    };
  });
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
  
  function closeMenu() {
    isMenuOpen = false;
  }

  async function handleLogout(event) {
    event.preventDefault();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        goto('/');
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
    }
  }

  // Function to handle entries navigation
  function handleEntriesClick() {
    if (user && userEntry) {
      const nameIdentifier = `${userEntry.first_name}|${userEntry.last_name}`;
      goto(`/entries?selected=${nameIdentifier}`);
    } else {
      goto('/entries');
    }
    closeMenu();
  }

  function handleEasterEggClick(event) {
    event.preventDefault();
    if (isSpinning) return; // Prevent multiple simultaneous spins
    
    isSpinning = true;
    const currentPath = window.location.pathname;
    
    setTimeout(() => {
      isSpinning = false; // Reset spinning state after animation
      if (currentPath !== '/easter-egg') {
        goto('/easter-egg');
      }
    }, 1000);
  }

  // Helper function to check if a path is active
  function isActive(path) {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  }
</script>

<nav class="relative w-full pt-1">
  <!-- Add banner images -->
  <img 
    src="/images/ui/MM_Banner_left.png" 
    alt="Left Banner" 
    class="hidden xl:block absolute left-0 top-0 z-0"
  />
  <img 
    src="/images/ui/MM_Banner_right.png" 
    alt="Right Banner" 
    class="hidden xl:block absolute right-0 top-0 z-0"
  />
  
  <div class="max-w-6xl mx-auto px-4 relative z-10">
    <!-- Mobile menu button -->
    <button class="md:hidden absolute top-4 left-4 p-2 z-[30]" on:click={toggleMenu} aria-label="Toggle navigation menu">
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {#if isMenuOpen}
          <!-- X icon for closing -->
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        {:else}
          <!-- Hamburger icon for opening -->
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        {/if}
      </svg>
    </button>

    <!-- Desktop Navigation Layout - Only visible on md screens and up -->
    <div class="hidden md:flex justify-center">
      <div class="flex items-center justify-between w-full">
        <!-- Left Navigation Group -->
        <div class="flex-shrink-0 w-1/3 flex justify-end">
          <div class="flex items-center space-x-3">
            <a href="/" class="nav-link">
              <div class="nav-button {isActive('/') ? 'active' : ''}">Leaderboard</div>
            </a>
            <a href="/bracket" class="nav-link">
              <div class="nav-button {isActive('/bracket') ? 'active' : ''}">Submit Entry</div>
            </a>
            <button on:click={handleEntriesClick} class="nav-link">
              <div class="nav-button {isActive('/entries') ? 'active' : ''}">Entries</div>
            </button>
            <a href="/live-bracket" class="nav-link">
              <div class="nav-button {isActive('/live-bracket') ? 'active' : ''}">Live Bracket</div>
            </a>
          </div>
        </div>

        <!-- Center Logo -->
        <div class="flex-shrink-0 w-1/3 flex justify-center relative">
          <a href="/" class="block">
            <img src="/images/ui/MM_logo.png" alt="Mosier Madness Logo" class="h-40 w-100 object-contain" />
          </a>
          <!-- Easter Egg Link -->
          <a href="/easter-egg" 
             class="hidden md:block absolute hover-trigger" 
             style="top: 32%; left: 12%; transform: translate(-50%, -50%);"
             on:click={handleEasterEggClick}>
            <img src="/images/ui/easter-egg.png" 
                 alt="" 
                 class="w-14 h-14 cursor-pointer hover-glow {isSpinning ? 'spin' : ''}" />
          </a>
        </div>

        <!-- Right Navigation Group -->
        <div class="flex-shrink-0 w-1/3 flex justify-start">
          <div class="flex items-center space-x-3">
            <a href="/past-winners" class="nav-link">
              <div class="nav-button {isActive('/past-winners') ? 'active' : ''}">Past Winners</div>
            </a>
            <a href="/stats" class="nav-link">
              <div class="nav-button {isActive('/stats') ? 'active' : ''}">Statistics</div>
            </a>
            <a href="/scenarios" class="nav-link">
              <div class="nav-button {isActive('/scenarios') ? 'active' : ''}">Scenarios</div>
            </a>
            {#if user}
              <button on:click={handleLogout} class="nav-link">
                <div class="nav-button">Logout</div>
              </button>
            {:else}
              <a href="/login" class="nav-link">
                <div class="nav-button {isActive('/login') ? 'active' : ''}">Login</div>
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Logo - Only visible on small screens -->
    <div class="md:hidden flex justify-center py-2">
      <a href="/" class="block">
        <img src="/images/ui/MM_logo.png" alt="Mosier Madness Logo" class="h-40 w-60 object-contain" />
      </a>
    </div>

    <!-- Mobile Navigation Menu -->
    {#if isMenuOpen}
      <div class="md:hidden fixed inset-0 bg-black z-[20] pt-16">
        <div class="px-4 pt-2 pb-3 space-y-3">
          <a href="/" class="mobile-nav-button {isActive('/') ? 'active' : ''}" on:click={closeMenu}>Leaderboard</a>
          <a href="/bracket" class="mobile-nav-button {isActive('/bracket') ? 'active' : ''}" on:click={closeMenu}>Submit Bracket</a>
          <button on:click={handleEntriesClick} class="mobile-nav-button w-full {isActive('/entries') ? 'active' : ''}">Entries</button>
          <a href="/live-bracket" class="mobile-nav-button" on:click={closeMenu}>Live Bracket</a>
          <a href="/past-winners" class="mobile-nav-button" on:click={closeMenu}>Past Winners</a>
          <a href="/stats" class="mobile-nav-button" on:click={closeMenu}>Statistics</a>
          <a href="/scenarios" class="mobile-nav-button" on:click={closeMenu}>Scenarios</a>
          {#if user}
            <button on:click={handleLogout} class="mobile-nav-button w-full">Logout</button>
          {:else}
            <a href="/login" class="mobile-nav-button" on:click={closeMenu}>Login</a>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</nav>

<style>
  .nav-link {
    @apply flex-shrink-0;
    width: 132px;
  }

  .nav-button {
    @apply flex items-center justify-center relative px-4;
    height: 48px;
    width: 100%;
    font-size: 15px;
    font-weight: 500;
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 22px;
    transition: all 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-button:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .nav-button:active {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(0);
  }

  .mobile-nav-button {
    @apply block w-full px-4 py-3 rounded-md text-white text-center;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-nav-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 1280px) {
    .nav-link {
      width: 160px;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .spin {
    animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    pointer-events: none;
  }

  .hover-glow {
    transition: filter 0.3s ease, transform 0.3s ease;
  }

  .hover-trigger:hover .hover-glow {
    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.4));
    transform: scale(1.05);
  }

  .nav-button.active {
    @apply bg-amber-400/20 border-amber-400/30;
  }

  .nav-button.active:hover {
    @apply bg-amber-400/30 border-amber-400/40;
  }

  .mobile-nav-button.active {
    @apply bg-amber-400/20 border-amber-400/30;
  }

  .mobile-nav-button.active:hover {
    @apply bg-amber-400/30;
  }
</style> 