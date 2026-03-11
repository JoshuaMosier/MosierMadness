/**
 * Sanitize a redirect path to prevent open redirect attacks.
 * Rejects protocol-relative URLs (//evil.com), backslash paths (/\evil.com),
 * and absolute URLs (https://evil.com). Returns '/' for invalid inputs.
 *
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function safeRedirectPath(raw) {
  if (!raw || typeof raw !== 'string') return '/';
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  if (path.startsWith('//') || path.startsWith('/\\')) return '/';
  try {
    const url = new URL(path, 'http://localhost');
    if (url.host !== 'localhost') return '/';
  } catch {
    return '/';
  }
  return path;
}
