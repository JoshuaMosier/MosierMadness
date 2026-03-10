import { json } from '@sveltejs/kit';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';

/**
 * GET handler for /api/bracket-teams endpoint
 */
export async function GET() {
  try {
    const snapshot = await getTournamentSnapshot();
    const teams = snapshot.firstRoundTeams.filter(Boolean);
    
    // If we don't have enough teams, throw an error
    if (teams.length < 64) {
      throw new Error('Could not fetch all teams from the NCAA API');
    }
    
    return json(teams);
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
} 