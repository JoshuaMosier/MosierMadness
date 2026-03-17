import { createBrowserClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

/**
 * Browser Supabase client. Used for client-side mutations (e.g. bracket updates)
 * and auth UI. Auth state is kept in sync with the server via @supabase/ssr
 * cookie storage; the server client in hooks.server.js uses the same cookies.
 */
export const supabase = createBrowserClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
)
