import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { isRoundOf32FieldReady } from '$lib/server/scenarios/browserExact';
import { getGeneratedScenarioArtifact } from '$lib/server/scenarios/generated';
import { getScenarioWeightingModel } from '$lib/server/scenarios/weighting';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getNcaaBasketballBoxscore } from '$lib/server/tournament/gameStats';
import { getGameDetailProjection, getScenarioSeedData, resolveGame } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTodayEtDateString, getTournamentSettings } from '$lib/server/tournament/settings';
import { canViewGameDetails, canViewScenarios } from '$lib/utils/stageUtils';

export const load: PageServerLoad = async ({ params, depends, fetch }) => {
  depends('app:tournament');
  const settings = await getTournamentSettings();
  if (!canViewGameDetails(settings.stage)) {
    throw redirect(303, '/scores');
  }

  const [snapshot, entries] = await Promise.all([
    getTournamentSnapshot(settings),
    getSubmittedEntries(settings.displaySeasonYear),
  ]);

  const game = resolveGame(snapshot, params.id);
  if (!game) {
    throw error(404, 'Game not found');
  }

  const isFinal = String(game.statusLabel || game.status || '').toUpperCase() === 'FINAL';

  const postgameStats = isFinal
    ? await getNcaaBasketballBoxscore(game.contestId)
    : null;

  const browserExactReady =
    !isFinal &&
    canViewScenarios(settings, getTodayEtDateString()) &&
    isRoundOf32FieldReady(snapshot);

  let scenarioSeedData = null;
  let generatedScenarioArtifact = null;

  if (browserExactReady) {
    const weighting = await getScenarioWeightingModel(snapshot, settings.displaySeasonYear);
    scenarioSeedData = getScenarioSeedData(entries, snapshot, weighting);
  } else if (!isFinal) {
    generatedScenarioArtifact = await getGeneratedScenarioArtifact(fetch);
  }

  return {
    gameDetail: getGameDetailProjection(game, entries, snapshot),
    postgameStats,
    scenarioSeedData,
    generatedScenarioArtifact,
    tournamentSettings: settings,
  };
};
