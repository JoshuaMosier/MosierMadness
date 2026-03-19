import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { autoSubmitCompleteDraftBrackets } from '$lib/server/tournament/entries';
import { checkAndResolveFirstFour } from '$lib/server/tournament/firstFour';
import { getTournamentSettings, invalidateSettingsCache } from '$lib/server/tournament/settings';

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

  let autoSubmittedCount = 0;
  try {
    const settings = await getTournamentSettings();
    if (settings.stage === 'tournament-live') {
      autoSubmittedCount = await autoSubmitCompleteDraftBrackets(settings.entrySeasonYear);
      await checkAndResolveFirstFour(settings, { force: true });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: `Settings cache invalidated, but live-bracket finalization failed: ${message}` }, { status: 500 });
  }

  return json({ ok: true, autoSubmittedCount });
};
