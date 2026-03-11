import { RESPONSE_TTL_MS } from '$lib/server/tournament/constants';
import { HttpError } from '$lib/types';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

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
    const response = await fetch(url);
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
  })().finally(() => inflight.delete(url));

  inflight.set(url, promise);
  return promise;
}
