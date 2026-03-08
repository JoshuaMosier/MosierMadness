import { json } from '@sveltejs/kit';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { archiveSeason } from '$lib/server/admin/archiveSeason';

export async function POST({ locals }) {
  try {
    // Verify admin access
    const { data: { user } } = await locals.supabase.auth.getUser();
    if (!user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return json({ error: 'Not authorized' }, { status: 403 });
    }

    const settings = await getTournamentSettings();
    const result = await archiveSeason(locals.supabase, settings);

    return json({ success: true, ...result });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
