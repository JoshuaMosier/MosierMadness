import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invalidateSettingsCache } from '$lib/server/tournament/settings';

export const POST: RequestHandler = async ({ locals }) => {
  const { data: { user } } = await locals.supabase.auth.getUser();
  if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.is_admin) return json({ error: 'Not authorized' }, { status: 403 });

  invalidateSettingsCache();
  return json({ ok: true });
};
