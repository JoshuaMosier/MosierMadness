import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getTournamentSettings } from '$lib/server/tournament/settings';

export const GET: RequestHandler = async () => {
  try {
    const settings = await getTournamentSettings();
    const entries = await getSubmittedEntries(settings.displaySeasonYear);
    return json({ entries });
  } catch (err) {
    console.error('Error fetching entries:', err);
    return json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
};
