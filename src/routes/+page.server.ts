import type { PageServerLoad } from './$types';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getLeaderboardProjection } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import {
  getBracketRevealAt,
  getEntryDeadlineAt,
  getTournamentSettings,
} from '$lib/server/tournament/settings';
import { hasLeaderboard } from '$lib/utils/stageUtils';

export const load: PageServerLoad = async ({ depends }) => {
  depends('app:tournament');
  const settings = await getTournamentSettings();
  const frontDoor = {
    bracketRevealAt: getBracketRevealAt(settings.entrySeasonYear),
    entryDeadlineAt: getEntryDeadlineAt(settings.entrySeasonYear),
  };

  if (!hasLeaderboard(settings.stage)) {
    return {
      frontDoor,
      leaderboard: null,
      tournamentSettings: settings,
    };
  }

  const [snapshot, entries] = await Promise.all([
    getTournamentSnapshot(settings),
    getSubmittedEntries(settings.displaySeasonYear),
  ]);

  return {
    frontDoor,
    leaderboard: getLeaderboardProjection(entries, snapshot),
    tournamentSettings: settings,
  };
};
