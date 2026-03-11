import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';

export const GET: RequestHandler = async () => {
  try {
    const snapshot = await getTournamentSnapshot();
    const teams = snapshot.firstRoundTeams.filter(Boolean);

    if (teams.length < 64) {
      throw new Error('Could not fetch all teams from the NCAA API');
    }

    return json(teams);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
};
