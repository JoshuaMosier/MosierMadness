import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';

export const dataRefreshSignal = writable<number>(0);

const DEFAULT_FALLBACK_POLL_MS = 45_000;

interface RealtimeRefreshOptions {
  fallbackPollMs?: number | null;
}

export function initRealtimeRefresh(
  supabaseClient: SupabaseClient,
  options: RealtimeRefreshOptions = {},
): () => void {
  let pendingRefresh = false;
  let fallbackInterval: ReturnType<typeof setInterval> | null = null;
  const fallbackPollMs = options.fallbackPollMs ?? DEFAULT_FALLBACK_POLL_MS;

  function signal(): void {
    dataRefreshSignal.update((n) => n + 1);
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible' && pendingRefresh) {
      pendingRefresh = false;
      signal();
    }
  }

  function handleRealtimeEvent(): void {
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

  if (fallbackPollMs && fallbackPollMs > 0) {
    fallbackInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        signal();
      } else {
        pendingRefresh = true;
      }
    }, fallbackPollMs);
  }

  return function cleanup(): void {
    supabaseClient.removeChannel(channel);
    if (fallbackInterval) {
      clearInterval(fallbackInterval);
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
