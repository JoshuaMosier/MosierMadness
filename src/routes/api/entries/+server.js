import { json } from '@sveltejs/kit';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getTournamentSettings } from '$lib/server/tournament/settings';

export async function GET() {
  try {
    const settings = await getTournamentSettings();
    const entries = await getSubmittedEntries(settings.displaySeasonYear);
    return json({ entries });
  } catch (err) {
    console.error('Error fetching entries:', err);
    return json({ error: err.message }, { status: 500 });
  }
} 