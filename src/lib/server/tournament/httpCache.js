import { RESPONSE_TTL_MS } from '$lib/server/tournament/constants';

const responseCache = new Map();
const inflight = new Map();

export async function fetchJsonWithCache(url, ttlMs = RESPONSE_TTL_MS) {
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
      const error = new Error(`NCAA API responded with status ${response.status} for ${url}`);
      error.status = response.status;
      throw error;
    }

    const value = await response.json();
    responseCache.set(url, {
      value,
      expiresAt: Date.now() + ttlMs,
    });

    return value;
  })().finally(() => inflight.delete(url));

  inflight.set(url, promise);
  return promise;
}
