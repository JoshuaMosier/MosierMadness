import type { PageServerLoad } from './$types';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getScenarioSeedData } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';

export const load: PageServerLoad = async ({ depends, parent }) => {
  depends('app:tournament');
  const { tournamentSettings, scenariosAvailable } = await parent();

  if (!scenariosAvailable) {
    return {
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
    scenario: getScenarioSeedData(entries, snapshot),
    scenariosAvailable,
    tournamentSettings,
  };
};
