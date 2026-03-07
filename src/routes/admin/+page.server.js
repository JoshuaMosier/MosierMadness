import { getTournamentSettings } from '$lib/server/tournament/settings';

export async function load() {
  return {
    tournamentSettings: await getTournamentSettings(),
  };
}
