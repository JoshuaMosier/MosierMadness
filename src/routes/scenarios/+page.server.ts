import type { PageServerLoad } from './$types';
import { getGeneratedScenarioArtifact } from '$lib/server/scenarios/generated';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getScenarioSeedData } from '$lib/server/tournament/projections';
import { getTodayEtDateString } from '$lib/server/tournament/settings';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { canViewScenarios } from '$lib/utils/stageUtils';

export const load: PageServerLoad = async ({ depends, parent, fetch }) => {
  depends('app:tournament');
  const { tournamentSettings, scenariosAvailable } = await parent();

  if (!scenariosAvailable) {
    return {
      scenario: null,
      scenariosAvailable,
      tournamentSettings,
    };
  }

  const browserExactAvailable = canViewScenarios(tournamentSettings, getTodayEtDateString());

  if (!browserExactAvailable) {
    const generatedScenario = await getGeneratedScenarioArtifact(fetch);

    return {
      mode: generatedScenario ? 'generated-snapshot' : 'unavailable',
      generatedScenario,
      scenario: null,
      scenariosAvailable,
      tournamentSettings,
    };
  }

  const [snapshot, entries] = await Promise.all([
    getTournamentSnapshot(tournamentSettings),
    getSubmittedEntries(tournamentSettings.displaySeasonYear),
  ]);

  return {
    mode: 'browser-exact',
    scenario: getScenarioSeedData(entries, snapshot),
    generatedScenario: null,
    scenariosAvailable,
    tournamentSettings,
  };
};
