import type { LayoutServerLoad } from './$types';
import { getTodayEtDateString, getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';
import { hasGeneratedScenarioArtifact } from '$lib/server/scenarios/generated';
import { canViewScenarios } from '$lib/utils/stageUtils';
import type { ViewerProfile } from '$lib/types';

export const load: LayoutServerLoad = async ({ depends, locals, fetch }) => {
  depends('app:tournament');
  depends('supabase:auth');

  const [tournamentSettings, generatedScenarioAvailable, { data: { user } }] = await Promise.all([
    getTournamentSettings(),
    hasGeneratedScenarioArtifact(fetch),
    locals.supabase.auth.getUser(),
  ]);

  const profilePromise = user?.email
    ? locals.supabase
        .from('profiles')
        .select('first_name, last_name, is_admin')
        .eq('email', user.email)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [tickerScores, profileResult] = await Promise.all([
    getTickerScores(tournamentSettings),
    profilePromise,
  ]);

  if (profileResult.error) {
    console.warn(`Failed to load viewer profile: ${profileResult.error.message}`);
  }

  const scenariosAvailable =
    canViewScenarios(tournamentSettings, getTodayEtDateString()) || generatedScenarioAvailable;
  const viewerProfile: ViewerProfile | null = profileResult.data
    ? {
        firstName: profileResult.data.first_name,
        lastName: profileResult.data.last_name,
        isAdmin: profileResult.data.is_admin === true,
      }
    : null;

  return {
    tournamentSettings,
    scenariosAvailable,
    tickerScores,
    user,
    viewerProfile,
  };
};
