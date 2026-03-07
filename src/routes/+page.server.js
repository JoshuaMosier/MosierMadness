import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getLeaderboardProjection } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTournamentSettings } from '$lib/server/tournament/settings';

export async function load() {
  const settings = await getTournamentSettings();

  if (settings.stage === 'bracket-open') {
    return {
      leaderboard: null,
      tournamentSettings: settings,
    };
  }

  const [snapshot, entries] = await Promise.all([
    getTournamentSnapshot(settings),
    getSubmittedEntries(settings.displaySeasonYear),
  ]);

  return {
    leaderboard: getLeaderboardProjection(entries, snapshot),
    tournamentSettings: settings,
  };
}
