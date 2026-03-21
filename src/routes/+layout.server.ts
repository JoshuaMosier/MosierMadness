import type { LayoutServerLoad } from './$types';
import { getTodayEtDateString, getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';
import { hasGeneratedScenarioArtifact } from '$lib/server/scenarios/generated';
import { canViewScenarios } from '$lib/utils/stageUtils';

export const load: LayoutServerLoad = async ({ depends, url, locals, fetch }) => {
  depends('app:tournament');
  depends('supabase:auth');

  const [tournamentSettings, generatedScenarioAvailable, { data: { user } }] = await Promise.all([
    getTournamentSettings(),
    hasGeneratedScenarioArtifact(fetch),
    locals.supabase.auth.getUser(),
  ]);

  const tickerScores = url.pathname === '/scores' ? [] : await getTickerScores(tournamentSettings);
  const scenariosAvailable =
    canViewScenarios(tournamentSettings, getTodayEtDateString()) || generatedScenarioAvailable;

  return {
    tournamentSettings,
    scenariosAvailable,
    tickerScores,
    user,
  };
};
