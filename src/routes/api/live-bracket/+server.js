import { json } from '@sveltejs/kit';
import { getLiveBracketProjection } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';

export async function GET() {
  try {
    const snapshot = await getTournamentSnapshot();
    return json(getLiveBracketProjection(snapshot));
  } catch (error) {
    console.error('Error creating bracket data:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
