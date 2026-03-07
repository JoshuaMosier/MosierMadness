import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getAdminHealthChecks } from '$lib/server/admin/healthChecks';
import { loadTeamColors, getAllTeamColors } from '$lib/server/tournament/teamColors';

export async function load() {
  const tournamentSettings = await getTournamentSettings();
  await loadTeamColors();

  const teamColorMap = {};
  for (const [seoName, colors] of getAllTeamColors()) {
    teamColorMap[seoName] = colors;
  }

  return {
    tournamentSettings,
    healthChecks: await getAdminHealthChecks(tournamentSettings),
    teamColors: teamColorMap,
  };
}
