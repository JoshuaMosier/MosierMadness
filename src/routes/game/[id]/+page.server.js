import { error } from '@sveltejs/kit';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getGameDetailProjection, resolveGame } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTournamentSettings } from '$lib/server/tournament/settings';

export async function load({ params }) {
  const settings = await getTournamentSettings();
  const [snapshot, entries] = await Promise.all([
    getTournamentSnapshot(settings),
    getSubmittedEntries(settings.displaySeasonYear),
  ]);

  const game = resolveGame(snapshot, params.id);
  if (!game) {
    throw error(404, 'Game not found');
  }

  return {
    gameDetail: getGameDetailProjection(game, entries, snapshot),
  };
}
