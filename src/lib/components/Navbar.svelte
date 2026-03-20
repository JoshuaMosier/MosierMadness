<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { page } from '$app/stores';
  import { canSubmitBracket, canViewEntries } from '$lib/utils/stageUtils';
  import NavLink from '$lib/components/NavLink.svelte';
  import type { TournamentStage } from '$lib/types';

  export let stage: TournamentStage = 'archive';
  export let scenariosAvailable = false;
  export let serverUser: any = null;

  let isMenuOpen = false;
  let userEntry: any = null;
  let isAdmin = false;
  let isSpinning = false;

  // serverUser comes from the layout server load (cookie-based, updates on every navigation).
  // Logout does a full page reload so serverUser also handles sign-out.
  $: user = serverUser;

  // Get current path for active state
  $: currentPath = $page.url.pathname;

  $: disabledLinks = {
    '/bracket': !canSubmitBracket(stage),
    '/entries': !canViewEntries(stage),
    '/scenarios': !scenariosAvailable,
  };

  $: disabledReasons = {
    '/bracket': stage === 'archive' ? 'Available when brackets open' : 'Brackets are locked',
    '/entries': 'Available when brackets open',
    '/scenarios': 'Available starting Sweet Sixteen',
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

  // Load profile whenever user changes. The layout's onAuthStateChange listener
  // calls invalidate('supabase:auth') which re-runs the server load, updating
  // serverUser → user → this reactive statement. No additional onAuthStateChange
  // listener is needed here (and having one caused deadlocks because Supabase
  // runs the callback inside an auth lock, and the loadProfile query internally
  // calls getSession which tries to re-acquire the same lock).
  $: loadProfile(user);
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
  
  function closeMenu() {
    isMenuOpen = false;
  }

  function handleMenuBackdropKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeMenu();
    }
  }

  function handleLogout(event: Event): void {
    event.preventDefault();
    // Navigate to the server-side /logout route, which calls signOut() on the
    // server Supabase client (no browser auth lock involved), clears the session
    // cookie, and redirects to /. Full page load ensures clean client state.
    window.location.href = '/logout';
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

<nav class="navbar">
  <img
    src="/images/ui/MM_Banner_left.png"
    alt="Left Banner"
    class="navbar-banner navbar-banner--left hidden 2xl:block"
  />
  <img
    src="/images/ui/MM_Banner_right.png"
    alt="Right Banner"
    class="navbar-banner navbar-banner--right hidden 2xl:block"
  />

  <div class="navbar-inner">
    <div class="desktop-nav-shell">
      <div class="desktop-nav-side desktop-nav-side--left">
        <NavLink href="/" label="Leaderboard" active={isActive('/')} />
        <NavLink href="/bracket" label="Submit Entry" active={isActive('/bracket')}
          disabled={disabledLinks['/bracket']} disabledReason={disabledReasons['/bracket']} />
        <NavLink href="/entries" label="Entries" active={isActive('/entries')}
          disabled={disabledLinks['/entries']} disabledReason={disabledReasons['/entries']}
          onClick={handleEntriesClick} />
        <NavLink href="/live-bracket" label="Live Bracket" active={isActive('/live-bracket')} />
      </div>

      <div class="desktop-nav-logo-wrap">
        <a href="/" class="desktop-nav-logo">
          <img src="/images/ui/MM_logo.png" alt="Mosier Madness Logo" class="desktop-nav-logo-image" />
        </a>
        <a href="/easter-egg" class="desktop-easter-egg hover-trigger" on:click={handleEasterEggClick}>
          <img
            src="/images/ui/easter-egg.png"
            alt=""
            class="desktop-easter-egg-image hover-glow {isSpinning ? 'spin' : ''}"
          />
        </a>
      </div>

      <div class="desktop-nav-side desktop-nav-side--right">
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

    <div class="mobile-nav-bar">
      <button type="button" class="mobile-nav-toggle" on:click={toggleMenu} aria-label="Toggle navigation menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {#if isMenuOpen}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          {/if}
        </svg>
      </button>

      <a href="/" class="mobile-nav-logo">
        <img src="/images/ui/MM_logo.png" alt="Mosier Madness Logo" class="mobile-nav-logo-image" />
      </a>

      <span class="mobile-nav-spacer" aria-hidden="true"></span>
    </div>

    {#if isMenuOpen}
      <div
        class="mobile-menu-backdrop"
        role="button"
        tabindex="0"
        aria-label="Close navigation menu"
        on:click|self={closeMenu}
        on:keydown={handleMenuBackdropKeydown}
      >
        <div class="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div class="mobile-menu-section">
            <div class="mobile-menu-label">Main</div>
            <div class="mobile-menu-group">
              <NavLink mobile href="/" label="Leaderboard" active={isActive('/')} on:click={closeMenu} />
              <NavLink mobile href="/bracket" label="Submit Entry" active={isActive('/bracket')}
                disabled={disabledLinks['/bracket']} disabledReason={disabledReasons['/bracket']} on:click={closeMenu} />
              <NavLink mobile href="/entries" label="Entries" active={isActive('/entries')}
                disabled={disabledLinks['/entries']} disabledReason={disabledReasons['/entries']}
                onClick={handleEntriesClick} />
              <NavLink mobile href="/live-bracket" label="Live Bracket" active={isActive('/live-bracket')} on:click={closeMenu} />
            </div>
          </div>

          <div class="mobile-menu-section">
            <div class="mobile-menu-label">More</div>
            <div class="mobile-menu-group">
              <NavLink mobile href="/past-winners" label="Past Winners" active={isActive('/past-winners')} on:click={closeMenu} />
              <NavLink mobile href="/stats" label="Statistics" active={isActive('/stats')} on:click={closeMenu} />
              <NavLink mobile href="/scenarios" label="Scenarios" active={isActive('/scenarios')}
                disabled={disabledLinks['/scenarios']} disabledReason={disabledReasons['/scenarios']} on:click={closeMenu} />
            </div>
          </div>

          <div class="mobile-menu-section">
            <div class="mobile-menu-label">Account</div>
            <div class="mobile-menu-group">
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
        </div>
      </div>
    {/if}
  </div>
</nav>

<style>
  .navbar {
    position: relative;
    width: 100%;
    padding: 0.25rem 1rem 0;
    overflow: visible;
  }

  .navbar-banner {
    position: absolute;
    top: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.92;
  }

  .navbar-banner--left {
    left: 0;
  }

  .navbar-banner--right {
    right: 0;
  }

  .navbar-inner {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 72rem;
    margin: 0 auto;
  }

  .mobile-menu-panel {
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(8, 9, 11, 0.88);
    box-shadow: 0 24px 46px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .mobile-menu-panel::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.24), transparent);
    pointer-events: none;
  }

  .desktop-nav-shell {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 0.15rem 0;
  }

  .desktop-nav-side {
    display: flex;
    flex: 0 0 33.3333%;
    width: 33.3333%;
    align-items: center;
    min-width: 0;
    gap: 0.15rem;
  }

  .desktop-nav-side--left {
    justify-content: flex-end;
  }

  .desktop-nav-side--right {
    justify-content: flex-start;
  }

  .desktop-nav-logo-wrap {
    position: relative;
    display: flex;
    justify-content: center;
    width: 33.3333%;
    flex: 0 0 33.3333%;
    padding: 0;
  }

  .desktop-nav-logo {
    display: block;
  }

  .desktop-nav-logo-image {
    height: 10rem;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.24));
  }

  .desktop-easter-egg {
    position: absolute;
    top: 32%;
    left: 12%;
    transform: translate(-50%, -50%);
  }

  .desktop-easter-egg-image {
    width: 3.5rem;
    height: 3.5rem;
    cursor: pointer;
  }

  .mobile-nav-bar {
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.2rem 0.1rem 0.1rem;
  }

  .mobile-nav-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.85rem;
    height: 2.85rem;
    flex: 0 0 2.85rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-text);
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      color 160ms ease;
  }

  .mobile-nav-toggle:hover {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.08);
  }

  .mobile-nav-logo {
    display: flex;
    flex: 1 1 auto;
    justify-content: center;
  }

  .mobile-nav-logo-image {
    height: 10rem;
    width: 15rem;
    max-width: 100%;
    object-fit: contain;
  }

  .mobile-nav-spacer {
    width: 2.85rem;
    flex: 0 0 2.85rem;
  }

  .mobile-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0, 0, 0, 0.58);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 6.1rem 1rem 1rem;
  }

  .mobile-menu-panel {
    width: min(100%, 32rem);
    margin: 0 auto;
    border-radius: 28px;
    background: rgba(8, 9, 11, 0.96);
    padding: 1.2rem;
  }

  .mobile-menu-section + .mobile-menu-section {
    margin-top: 1.15rem;
    padding-top: 1.15rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .mobile-menu-label {
    margin-bottom: 0.7rem;
    color: var(--mm-subtle);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .mobile-menu-group {
    display: grid;
    gap: 0.65rem;
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

  @media (min-width: 1280px) {
    .desktop-nav-shell {
      display: flex;
    }

    .mobile-nav-bar,
    .mobile-menu-backdrop {
      display: none;
    }
  }
</style>
