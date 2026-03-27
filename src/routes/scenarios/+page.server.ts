import type { PageServerLoad } from './$types';
import {
  applyScenarioPreviewAssumption,
  getScenarioPreviewAssumption,
  getScenarioPreviewDate,
  isRoundOf32FieldReady,
} from '$lib/server/scenarios/browserExact';
import { getGeneratedScenarioArtifact } from '$lib/server/scenarios/generated';
import { getScenarioWeightingModel } from '$lib/server/scenarios/weighting';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { getScenarioSeedData } from '$lib/server/tournament/projections';
import { getTodayEtDateString } from '$lib/server/tournament/settings';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { canViewScenarios } from '$lib/utils/stageUtils';
import type { TournamentSnapshot } from '$lib/types';

export const load: PageServerLoad = async ({ depends, parent, fetch, url }) => {
  depends('app:tournament');
  const { tournamentSettings, scenariosAvailable } = await parent();
  const scenarioPreviewDate = getScenarioPreviewDate(url);
  const scenarioPreviewAssumption = getScenarioPreviewAssumption(url);
  const browserExactPreviewActive =
    Boolean(scenarioPreviewDate) && tournamentSettings.stage === 'tournament-live';
  const browserExactUnlockedByActualDate =
    canViewScenarios(tournamentSettings, getTodayEtDateString());

  if (!scenariosAvailable) {
    return {
      browserExactSimulationReady: false,
      mode: 'unavailable',
      scenario: null,
      scenarioPreviewAssumption,
      scenarioPreviewDate,
      scenariosAvailable,
      tournamentSettings,
    };
  }

  let snapshot: TournamentSnapshot | null = null;
  let browserExactSimulationReady = browserExactUnlockedByActualDate;

  if (tournamentSettings.stage === 'tournament-live') {
    if (!browserExactUnlockedByActualDate || Boolean(scenarioPreviewAssumption)) {
      snapshot = applyScenarioPreviewAssumption(
        await getTournamentSnapshot(tournamentSettings),
        scenarioPreviewAssumption,
      );
    }

    const readinessSnapshot = snapshot ?? await getTournamentSnapshot(tournamentSettings);
    snapshot = readinessSnapshot;
    browserExactSimulationReady = isRoundOf32FieldReady(readinessSnapshot);
  }

  const useBrowserExact = browserExactPreviewActive || browserExactSimulationReady;

  if (!useBrowserExact) {
    const generatedScenario = await getGeneratedScenarioArtifact(fetch);

    return {
      mode: generatedScenario ? 'generated-snapshot' : 'unavailable',
      browserExactSimulationReady: false,
      generatedScenario,
      scenario: null,
      scenarioPreviewAssumption,
      scenarioPreviewDate,
      scenariosAvailable,
      tournamentSettings,
    };
  }

  const [resolvedSnapshot, entries] = await Promise.all([
    snapshot ? Promise.resolve(snapshot) : getTournamentSnapshot(tournamentSettings),
    getSubmittedEntries(tournamentSettings.displaySeasonYear),
  ]);
  const scenarioWeighting = await getScenarioWeightingModel(
    resolvedSnapshot,
    tournamentSettings.displaySeasonYear,
  );

  return {
    mode: 'browser-exact',
    browserExactSimulationReady,
    scenario: getScenarioSeedData(entries, resolvedSnapshot, scenarioWeighting),
    generatedScenario: null,
    scenarioPreviewAssumption,
    scenarioPreviewDate,
    scenariosAvailable,
    tournamentSettings,
  };
};
