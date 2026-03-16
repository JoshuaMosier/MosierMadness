import { HTTP_FETCH_TIMEOUT_MS, RESPONSE_TTL_MS, getErrorMessage } from '$lib/server/tournament/constants';
import { HttpError } from '$lib/types';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error: unknown) {
    if (controller.signal.aborted) {
      throw new Error(`Timed out fetching NCAA API after ${timeoutMs}ms: ${url}`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchJsonWithCache(url: string, ttlMs: number = RESPONSE_TTL_MS): Promise<any> {
  const now = Date.now();
  const cached = responseCache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  if (inflight.has(url)) {
    return inflight.get(url);
  }

  const promise = (async () => {
    try {
      const response = await fetchWithTimeout(url, HTTP_FETCH_TIMEOUT_MS);
      if (!response.ok) {
        const error = new HttpError(`NCAA API responded with status ${response.status} for ${url}`, response.status);
        throw error;
      }

      const value: unknown = await response.json();
      responseCache.set(url, {
        value,
        expiresAt: Date.now() + ttlMs,
      });

      return value;
    } catch (error: unknown) {
      if (cached) {
        console.warn(`Using stale NCAA API cache for ${url}: ${getErrorMessage(error)}`);
        return cached.value;
      }

      throw error;
    }
  })().finally(() => inflight.delete(url));

  inflight.set(url, promise);
  return promise;
}

/**
 * Fetch casablanca scoreboard JSON. Returns { games: [] } on 404 instead of throwing.
 * Use for tournament snapshot dates where the API may not have data (rest days, future dates).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchScoreboardOrEmpty(url: string, ttlMs: number = RESPONSE_TTL_MS): Promise<{ games: any[] }> {
  try {
    return await fetchJsonWithCache(url, ttlMs);
  } catch (error: unknown) {
    if (error instanceof HttpError && error.status === 404) {
      return { games: [] };
    }
    throw error;
  }
}
