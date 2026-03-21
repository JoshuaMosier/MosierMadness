<script lang="ts">
  import '../app.css';
  import { dev } from '$app/environment';
  import Navbar from '$lib/components/Navbar.svelte';
  import ScoreTicker from '$lib/components/ScoreTicker.svelte';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import { invalidate, beforeNavigate, afterNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { dataRefreshSignal, initRealtimeRefresh } from '$lib/stores/realtimeUpdates';
  import type { SupabaseClient } from '@supabase/supabase-js';
  import type { TournamentStage } from '$lib/types';

  export let data: any;
  injectAnalytics({ mode: dev ? 'development' : 'production' });

  // Define routes where ScoreTicker should be hidden
  const hideScoreTickerRoutes: string[] = [
    '/scores',
  ];

  // Reactive statement to determine if ScoreTicker should be visible
  $: showScoreTicker = !hideScoreTickerRoutes.includes($page.url.pathname);

  // Debounce invalidate to avoid race with navigation (SvelteKit can "eat" clicks when
  // invalidate runs during a nav - see sveltejs/kit#9354, #10876)
  const INVALIDATE_DEBOUNCE_MS = 2000;
  let invalidateTimeout: ReturnType<typeof setTimeout>;
  let isNavigating = false;
  let pendingInvalidate = false;
  let mounted = false;
  let browserSupabase: SupabaseClient | null = null;
  let cleanupRealtime: (() => void) | null = null;
  let cleanupAuthSubscription: (() => void) | null = null;
  let currentRealtimeKey = '';

  const HOT_ROUTE_POLL_MS = 60_000;
  const HOME_ROUTE_POLL_MS = 90_000;
  const STANDARD_ROUTE_POLL_MS = 180_000;
  const BRACKET_OPEN_POLL_MS = 300_000;
  const IDLE_POLL_MS = 600_000;

  $: tournamentStage = (data.tournamentSettings?.stage || 'archive') as TournamentStage;

  function getRefreshScope(pathname: string): string {
    if (pathname.startsWith('/game/')) {
      return 'game';
    }

    if (pathname === '/scores') {
      return 'scores';
    }

    if (pathname === '/live-bracket') {
      return 'live-bracket';
    }

    if (pathname === '/') {
      return 'home';
    }

    return 'default';
  }

  function getFallbackPollMs(pathname: string, stage: TournamentStage): number {
    if (stage === 'tournament-live') {
      if (pathname === '/scores' || pathname === '/live-bracket' || pathname.startsWith('/game/')) {
        return HOT_ROUTE_POLL_MS;
      }

      if (pathname === '/') {
        return HOME_ROUTE_POLL_MS;
      }

      return STANDARD_ROUTE_POLL_MS;
    }

    if (stage === 'bracket-open') {
      return BRACKET_OPEN_POLL_MS;
    }

    return pathname === '/scores' ? BRACKET_OPEN_POLL_MS : IDLE_POLL_MS;
  }

  $: refreshScope = getRefreshScope($page.url.pathname);
  $: fallbackPollMs = getFallbackPollMs($page.url.pathname, tournamentStage);

  function syncRealtimeRefresh(nextKey: string): void {
    if (!mounted || !browserSupabase || nextKey === currentRealtimeKey) {
      return;
    }

    cleanupRealtime?.();
    cleanupRealtime = initRealtimeRefresh(browserSupabase, { fallbackPollMs });
    currentRealtimeKey = nextKey;
  }

  beforeNavigate(() => {
    isNavigating = true;
  });

  afterNavigate(() => {
    isNavigating = false;
    if (pendingInvalidate) {
      pendingInvalidate = false;
      invalidate('app:tournament');
    }
  });

  $: if ($dataRefreshSignal) {
    clearTimeout(invalidateTimeout);
    invalidateTimeout = setTimeout(() => {
      if (isNavigating) {
        pendingInvalidate = true;
      } else {
        invalidate('app:tournament');
      }
    }, INVALIDATE_DEBOUNCE_MS);
  }

  $: syncRealtimeRefresh(`${tournamentStage}:${refreshScope}:${fallbackPollMs}`);

  onMount(() => {
    mounted = true;
    let cancelled = false;

    void (async () => {
      try {
        const { supabase } = await import('$lib/supabase');
        if (cancelled) {
          return;
        }

        browserSupabase = supabase;
        syncRealtimeRefresh(`${tournamentStage}:${refreshScope}:${fallbackPollMs}`);

        const {
          data: { subscription }
        } = supabase.auth.onAuthStateChange(() => {
          invalidate('supabase:auth');
        });

        cleanupAuthSubscription = () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Failed to initialize browser Supabase client', error);
      }
    })();

    return () => {
      cancelled = true;
      mounted = false;
      currentRealtimeKey = '';
      clearTimeout(invalidateTimeout);
      cleanupAuthSubscription?.();
      cleanupAuthSubscription = null;
      cleanupRealtime?.();
      cleanupRealtime = null;
      browserSupabase = null;
    };
  });
</script>

<div class="flex flex-col min-h-screen">
  <Navbar
    stage={data.tournamentSettings?.stage || 'archive'}
    scenariosAvailable={data.scenariosAvailable ?? false}
    serverUser={data.user}
    viewerProfile={data.viewerProfile ?? null}
  />
  <div class="container mx-auto px-4">
    {#if showScoreTicker}
      <ScoreTicker tournamentSettings={data.tournamentSettings} tickerScores={data.tickerScores ?? []} />
    {/if}
  </div>
  <main class="flex-grow">
    <slot />
  </main>

</div>
