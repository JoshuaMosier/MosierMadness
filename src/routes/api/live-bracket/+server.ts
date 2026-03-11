import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getLiveBracketProjection } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';

export const GET: RequestHandler = async () => {
  try {
    const snapshot = await getTournamentSnapshot();
    return json(getLiveBracketProjection(snapshot));
  } catch (err) {
    console.error('Error creating bracket data:', err);
    return json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
};
