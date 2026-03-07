import { writable } from 'svelte/store';

export const dataRefreshSignal = writable(0);

const FALLBACK_POLL_MS = 45_000;

export function initRealtimeRefresh(supabaseClient) {
  let pendingRefresh = false;
  let fallbackInterval;

  function signal() {
    dataRefreshSignal.update(n => n + 1);
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible' && pendingRefresh) {
      pendingRefresh = false;
      signal();
    }
  }

  function handleRealtimeEvent() {
    if (document.visibilityState === 'hidden') {
      pendingRefresh = true;
      return;
    }
    signal();
  }

  const channel = supabaseClient
    .channel('tournament-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'realtime_updates',
        filter: 'scope=eq.tournament',
      },
      handleRealtimeEvent,
    )
    .subscribe();

  document.addEventListener('visibilitychange', onVisibilityChange);

  fallbackInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      signal();
    } else {
      pendingRefresh = true;
    }
  }, FALLBACK_POLL_MS);

  return function cleanup() {
    supabaseClient.removeChannel(channel);
    clearInterval(fallbackInterval);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
