import { json } from '@sveltejs/kit';
import { getMasterBracketProjection } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';

export async function GET() {
  try {
    const snapshot = await getTournamentSnapshot();
    return json(getMasterBracketProjection(snapshot));
  } catch (error) {
    console.error('Error creating master bracket:', error);
    return json({ error: error.message }, { status: 500 });
  }
} 