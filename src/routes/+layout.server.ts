import type { LayoutServerLoad } from './$types';
import { getTodayEtDateString, getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';
import { canViewScenarios } from '$lib/utils/stageUtils';

export const load: LayoutServerLoad = async ({ depends, url, locals }) => {
  depends('app:tournament');
  depends('supabase:auth');

  const [tournamentSettings, { data: { user } }] = await Promise.all([
    getTournamentSettings(),
    locals.supabase.auth.getUser(),
  ]);

  const tickerScores = url.pathname === '/scores' ? [] : await getTickerScores(tournamentSettings);
  const scenariosAvailable = canViewScenarios(tournamentSettings, getTodayEtDateString());

  return {
    tournamentSettings,
    scenariosAvailable,
    tickerScores,
    user,
  };
};
