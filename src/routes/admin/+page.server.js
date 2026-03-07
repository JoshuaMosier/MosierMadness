import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getAdminHealthChecks } from '$lib/server/admin/healthChecks';

export async function load() {
  const tournamentSettings = await getTournamentSettings();

  return {
    tournamentSettings,
    healthChecks: await getAdminHealthChecks(tournamentSettings),
  };
}
