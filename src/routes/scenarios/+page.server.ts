import type { PageServerLoad } from './$types';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getScenarioSeedData } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTournamentSettings } from '$lib/server/tournament/settings';

export const load: PageServerLoad = async ({ depends }) => {
  depends('app:tournament');
  const settings = await getTournamentSettings();
  const [snapshot, entries] = await Promise.all([
    getTournamentSnapshot(settings),
    getSubmittedEntries(settings.displaySeasonYear),
  ]);

  return {
    scenario: getScenarioSeedData(entries, snapshot),
    tournamentSettings: settings,
  };
};
