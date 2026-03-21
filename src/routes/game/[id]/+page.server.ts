import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getGeneratedScenarioArtifact } from '$lib/server/scenarios/generated';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getGameDetailProjection, resolveGame } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { canViewGameDetails } from '$lib/utils/stageUtils';

export const load: PageServerLoad = async ({ params, depends }) => {
  depends('app:tournament');
  const settings = await getTournamentSettings();
  if (!canViewGameDetails(settings.stage)) {
    throw redirect(303, '/scores');
  }

  const [snapshot, entries, generatedScenarioArtifact] = await Promise.all([
    getTournamentSnapshot(settings),
    getSubmittedEntries(settings.displaySeasonYear),
    getGeneratedScenarioArtifact(),
  ]);

  const game = resolveGame(snapshot, params.id);
  if (!game) {
    throw error(404, 'Game not found');
  }

  return {
    gameDetail: getGameDetailProjection(game, entries, snapshot, generatedScenarioArtifact),
    tournamentSettings: settings,
  };
};
