import { redirect } from '@sveltejs/kit';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';

export async function load({ locals, url }) {
  const tournamentSettings = await getTournamentSettings();
  const entrySeasonYear = tournamentSettings.entrySeasonYear;

  const supabase = locals.supabase;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    throw redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  const snapshot = await getTournamentSnapshot(tournamentSettings);
  const rawTeams = (snapshot.firstRoundTeams || []).filter(Boolean);
  const firstRoundTeams = rawTeams.length >= 64 ? rawTeams : [];
  const bracketTeamsError =
    rawTeams.length > 0 && rawTeams.length < 64 ? 'Could not fetch all teams from the NCAA API' : null;

  const { data: bracket, error: bracketError } = await supabase
    .from('brackets')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', entrySeasonYear)
    .maybeSingle();

  if (bracketError) {
    return {
      tournamentSettings,
      firstRoundTeams,
      bracket: null,
      user: { id: user.id, email: user.email },
      bracketTeamsError,
      loadError: bracketError.message
    };
  }

  return {
    tournamentSettings,
    firstRoundTeams,
    bracket,
    user: { id: user.id, email: user.email },
    bracketTeamsError
  };
}
