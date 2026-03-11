import { redirect } from '@sveltejs/kit';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getAdminHealthChecks } from '$lib/server/admin/healthChecks';
import { loadTeamColors, getAllTeamColors } from '$lib/server/tournament/teamColors';

export async function load({ locals: { supabase }, url }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) throw redirect(303, '/');

  const tournamentSettings = await getTournamentSettings();
  await loadTeamColors();

  const teamColorMap = {};
  for (const [seoName, colors] of getAllTeamColors()) {
    teamColorMap[seoName] = colors;
  }

  let healthChecks = null;
  try {
    healthChecks = await getAdminHealthChecks(tournamentSettings);
  } catch (err) {
    healthChecks = { checkedAt: new Date().toISOString(), error: err.message };
  }

  return {
    tournamentSettings,
    healthChecks,
    teamColors: teamColorMap,
  };
}
