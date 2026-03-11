<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { page } from '$app/stores';
  import { canSubmitBracket, canViewEntries, canViewScenarios, isBracketOpen } from '$lib/utils/stageUtils';
  import NavLink from '$lib/components/NavLink.svelte';
  import type { TournamentStage } from '$lib/types';

  export let stage: TournamentStage = 'archive';

  let isMenuOpen = false;
  let user: any = null;
  let userEntry: any = null;
  let isAdmin = false;
  let isSpinning = false;

  // Get current path for active state
  $: currentPath = $page.url.pathname;

  $: disabledLinks = {
    '/bracket': !canSubmitBracket(stage),
    '/entries': !canViewEntries(stage),
    '/scenarios': !canViewScenarios(stage),
  };

  $: disabledReasons = {
    '/bracket': stage === 'archive' ? 'Available when brackets open' : 'Brackets are locked',
    '/entries': 'Available when brackets open',
    '/scenarios': 'Available during tournament',
  };
  async function loadProfile(authUser: any): Promise<void> {
    if (!authUser) {
      userEntry = null;
      isAdmin = false;
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, is_admin')
      .eq('email', authUser.email)
      .single();

    if (profile) {
      userEntry = profile;
      isAdmin = profile.is_admin === true;
    }
  }

  onMount(async () => {
    const { data: { user: initialUser } } = await supabase.auth.getUser();
    user = initialUser;
    await loadProfile(user);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      user = session?.user || null;
      await loadProfile(user);
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

  async function handleLogout(event: Event): Promise<void> {
    event.preventDefault();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    // Always redirect with full reload, even if signOut fails —
    // local session cookies are cleared regardless
    window.location.href = '/';
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

  function handleEasterEggClick(event: Event): void {
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
  function isActive(path: string): boolean {
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
            <NavLink href="/" label="Leaderboard" active={isActive('/')} />
            <NavLink href="/bracket" label="Submit Entry" active={isActive('/bracket')}
              disabled={disabledLinks['/bracket']} disabledReason={disabledReasons['/bracket']} />
            <NavLink href="/entries" label="Entries" active={isActive('/entries')}
              disabled={disabledLinks['/entries']} disabledReason={disabledReasons['/entries']}
              onClick={handleEntriesClick} />
            <NavLink href="/live-bracket" label="Live Bracket" active={isActive('/live-bracket')} />
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
            <NavLink href="/past-winners" label="Past Winners" active={isActive('/past-winners')} />
            <NavLink href="/stats" label="Statistics" active={isActive('/stats')} />
            <NavLink href="/scenarios" label="Scenarios" active={isActive('/scenarios')}
              disabled={disabledLinks['/scenarios']} disabledReason={disabledReasons['/scenarios']} />
            {#if isAdmin}
              <NavLink href="/admin" label="Admin" active={isActive('/admin')} />
            {/if}
            {#if user}
              <NavLink href="/" label="Logout" onClick={handleLogout} />
            {:else}
              <NavLink href="/login" label="Login" active={isActive('/login')} />
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
          <NavLink mobile href="/" label="Leaderboard" active={isActive('/')} on:click={closeMenu} />
          <NavLink mobile href="/bracket" label="Submit Entry" active={isActive('/bracket')}
            disabled={disabledLinks['/bracket']} disabledReason={disabledReasons['/bracket']} on:click={closeMenu} />
          <NavLink mobile href="/entries" label="Entries" active={isActive('/entries')}
            disabled={disabledLinks['/entries']} disabledReason={disabledReasons['/entries']}
            onClick={handleEntriesClick} />
          <NavLink mobile href="/live-bracket" label="Live Bracket" active={isActive('/live-bracket')} on:click={closeMenu} />
          <NavLink mobile href="/past-winners" label="Past Winners" active={isActive('/past-winners')} on:click={closeMenu} />
          <NavLink mobile href="/stats" label="Statistics" active={isActive('/stats')} on:click={closeMenu} />
          <NavLink mobile href="/scenarios" label="Scenarios" active={isActive('/scenarios')}
            disabled={disabledLinks['/scenarios']} disabledReason={disabledReasons['/scenarios']} on:click={closeMenu} />
          {#if isAdmin}
            <NavLink mobile href="/admin" label="Admin" active={isActive('/admin')} on:click={closeMenu} />
          {/if}
          {#if user}
            <NavLink mobile href="/" label="Logout" onClick={handleLogout} />
          {:else}
            <NavLink mobile href="/login" label="Login" active={isActive('/login')} on:click={closeMenu} />
          {/if}
        </div>
      </div>
    {/if}
  </div>
</nav>

<style>
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

</style> 