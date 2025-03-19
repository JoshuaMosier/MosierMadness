<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  
  let isMenuOpen = false;
  let user = null;
  
  onMount(async () => {
    // Get initial auth state
    const { data: { user: initialUser } } = await supabase.auth.getUser();
    user = initialUser;
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      user = session?.user || null;
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
    <button class="md:hidden absolute top-4 left-4 p-2 z-20" on:click={toggleMenu} aria-label="Toggle navigation menu">
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <!-- Desktop Navigation Layout - Only visible on md screens and up -->
    <div class="hidden md:flex justify-center">
      <div class="flex items-center justify-between w-full">
        <!-- Left Navigation Group -->
        <div class="flex-shrink-0 w-1/3 flex justify-end">
          <div class="flex items-center space-x-3">
            <a href="/" class="nav-link">
              <div class="nav-button">Leaderboard</div>
            </a>
            <a href="/bracket" class="nav-link">
              <div class="nav-button">Submit Entry</div>
            </a>
            <a href="/entries" class="nav-link">
              <div class="nav-button">Entries</div>
            </a>
          </div>
        </div>

        <!-- Center Logo -->
        <div class="flex-shrink-0 w-1/3 flex justify-center">
          <a href="/" class="block">
            <img src="/images/ui/mmi_madness.png" alt="MMI Madness Logo" class="h-40 w-100 object-contain" />
          </a>
        </div>

        <!-- Right Navigation Group -->
        <div class="flex-shrink-0 w-1/3 flex justify-start">
          <div class="flex items-center space-x-3">
            <a href="/live-bracket" class="nav-link">
              <div class="nav-button">Live Bracket</div>
            </a>
            <a href="/scenarios" class="nav-link">
              <div class="nav-button">Scenarios</div>
            </a>
            {#if user}
              <button on:click={handleLogout} class="nav-link">
                <div class="nav-button">Logout</div>
              </button>
            {:else}
              <a href="/login" class="nav-link">
                <div class="nav-button">Login</div>
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Logo - Only visible on small screens -->
    <div class="md:hidden flex justify-center py-2">
      <a href="/" class="block">
        <img src="/images/ui/mmi_madness.png" alt="MMI Madness Logo" class="h-40 w-60 object-contain" />
      </a>
    </div>

    <!-- Mobile Navigation Menu -->
    {#if isMenuOpen}
      <div class="md:hidden fixed inset-0 bg-black bg-opacity-90 z-10 pt-16">
        <div class="px-4 pt-2 pb-3 space-y-3">
          <a href="/" class="mobile-nav-button" on:click={closeMenu}>Leaderboard</a>
          <a href="/bracket" class="mobile-nav-button" on:click={closeMenu}>Submit Bracket</a>
          <a href="/entries" class="mobile-nav-button" on:click={closeMenu}>Entries</a>
          <a href="/live-bracket" class="mobile-nav-button" on:click={closeMenu}>Live Bracket</a>
          <!-- <a href="/past-winners" class="mobile-nav-button" on:click={closeMenu}>Past Winners</a> -->
          <!-- <a href="/stats" class="mobile-nav-button" on:click={closeMenu}>Statistics</a> -->
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
</style> 