import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getScenarioSeedData } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTournamentSettings } from '$lib/server/tournament/settings';

export async function load() {
  const settings = await getTournamentSettings();
  const [snapshot, entries] = await Promise.all([
    getTournamentSnapshot(settings),
    getSubmittedEntries(settings.displaySeasonYear),
  ]);

  return {
    scenario: getScenarioSeedData(entries, snapshot),
  };
}
