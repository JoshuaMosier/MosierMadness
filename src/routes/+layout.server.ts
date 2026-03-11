import type { LayoutServerLoad } from './$types';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';

export const load: LayoutServerLoad = async ({ depends, url, locals }) => {
  depends('app:tournament');
  depends('supabase:auth');

  const [tournamentSettings, { data: { user } }] = await Promise.all([
    getTournamentSettings(),
    locals.supabase.auth.getUser(),
  ]);

  const tickerScores = url.pathname === '/scores' ? [] : await getTickerScores(tournamentSettings);
  return {
    tournamentSettings,
    tickerScores,
    user,
  };
};
