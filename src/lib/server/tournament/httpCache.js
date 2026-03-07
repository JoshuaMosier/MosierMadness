import { RESPONSE_TTL_MS } from '$lib/server/tournament/constants';

const responseCache = new Map();

export async function fetchJsonWithCache(url, ttlMs = RESPONSE_TTL_MS) {
  const now = Date.now();
  const cached = responseCache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(`NCAA API responded with status ${response.status} for ${url}`);
    error.status = response.status;
    throw error;
  }

  const value = await response.json();
  responseCache.set(url, {
    value,
    expiresAt: now + ttlMs,
  });

  return value;
}
