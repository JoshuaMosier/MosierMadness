<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { FADE_DELAYED, FADE_QUICK } from '$lib/constants/transitions';
  import Alert from '$lib/components/Alert.svelte';
  import GeneratedScenariosPage from '$lib/components/scenarios/GeneratedScenariosPage.svelte';
  import MatchSelector from '$lib/components/scenarios/MatchSelector.svelte';
  import type {
    Entry,
    GeneratedScenarioArtifact,
    LiveBracketData,
    ScenarioWeightingModel,
    SimulationConfig,
  } from '$lib/types';
  import { areEquivalentSelections, getTeamNameFromSelection } from '$lib/utils/bracketUtils';
  import { buildBrowserScenarioArtifact } from '$lib/utils/browserScenarioArtifact';
  import { getTeamsForGame, runSimulation } from '$lib/utils/scenarioEngine';
  import { resolveTeamSeoName } from '$lib/utils/teamColorUtils';

  export let data: any;

  const scenarioMode = data.mode ?? 'browser-exact';
  const browserExactMode = scenarioMode === 'browser-exact';
  const browserExactSimulationReady: boolean = data.browserExactSimulationReady ?? browserExactMode;
  const scenarioPreviewAssumption: string | null = data.scenarioPreviewAssumption ?? null;
  const scenarioPreviewDate: string | null = data.scenarioPreviewDate ?? null;
  const scenariosAvailable: boolean = data.scenariosAvailable ?? false;

  let entries: Entry[] = data.scenario?.entries || [];
  let liveBracketData: LiveBracketData = data.scenario?.liveBracketData || { matches: {}, champion: null };
  let masterBracket: string[] = data.scenario?.masterBracket || [];
  let teamSeoMap: Record<string, string> = data.scenario?.teamSeoMap || {};
  let scenarioWeighting: ScenarioWeightingModel | null = data.scenario?.weighting ?? null;
  let browserExactArtifact: GeneratedScenarioArtifact | null = null;
  let loading = true;
  let error: string | null = null;
  let scenariosCalculated = false;
  let selectedWinners: Record<number, string> = {};
  let effectiveMasterBracket: string[] = [...masterBracket];
  let filteredRemainingGames: number[] = [];
  let matchSimulationDetails: Array<{
    name: string;
    games: Array<{
      gameId: number;
      teamA: string | null;
      teamB: string | null;
      teamASeoName: string;
      teamBSeoName: string;
      selected: string | null;
    }>;
  }> = [];

  const SCENARIO_GAME_START = 48;
  const SCENARIO_GAME_END = 62;
  const SCENARIO_ROUND_ORDER = ['Sweet 16', 'Elite 8', 'Final Four', 'Championship'] as const;

  onMount(() => {
    try {
      if (!browserExactMode || !scenariosAvailable || !browserExactSimulationReady) {
        return;
      }

      syncScenarioSelections(selectedWinners);

      if (entries.length > 0) {
        calculateAllScenarios();
      } else {
        scenariosCalculated = true;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  });

  function getRoundLabel(gameId: number): (typeof SCENARIO_ROUND_ORDER)[number] | null {
    if (gameId >= 48 && gameId < 56) {
      return 'Sweet 16';
    }

    if (gameId >= 56 && gameId < 60) {
      return 'Elite 8';
    }

    if (gameId >= 60 && gameId < 62) {
      return 'Final Four';
    }

    if (gameId === 62) {
      return 'Championship';
    }

    return null;
  }

  function buildScenarioSelectionState(rawSelectedWinners: Record<number, string>) {
    const nextMasterBracket = [...masterBracket];
    const sanitizedSelectedWinners: Record<number, string> = {};
    const unresolvedGames: number[] = [];
    const rounds = Object.fromEntries(
      SCENARIO_ROUND_ORDER.map((roundName) => [roundName, []]),
    ) as Record<(typeof SCENARIO_ROUND_ORDER)[number], typeof matchSimulationDetails[number]['games']>;

    for (let gameId = SCENARIO_GAME_START; gameId <= SCENARIO_GAME_END; gameId += 1) {
      if (masterBracket[gameId]) {
        continue;
      }

      unresolvedGames.push(gameId);
      const roundLabel = getRoundLabel(gameId);
      if (!roundLabel) {
        continue;
      }

      const teams = getTeamsForGame(gameId, nextMasterBracket, liveBracketData);
      const teamA = teams.teamA ?? null;
      const teamB = teams.teamB ?? null;
      if (!teamA && !teamB) {
        continue;
      }

      const requestedSelection = rawSelectedWinners[gameId];
      let appliedSelection: string | null = null;

      if (requestedSelection) {
        if (teamA && areEquivalentSelections(requestedSelection, teamA)) {
          appliedSelection = teamA;
        } else if (teamB && areEquivalentSelections(requestedSelection, teamB)) {
          appliedSelection = teamB;
        }
      }

      if (appliedSelection) {
        sanitizedSelectedWinners[gameId] = appliedSelection;
        nextMasterBracket[gameId] = appliedSelection;
      }

      const teamAName = getTeamNameFromSelection(teamA);
      const teamBName = getTeamNameFromSelection(teamB);

      rounds[roundLabel].push({
        gameId,
        teamA,
        teamB,
        teamASeoName: teamAName ? resolveTeamSeoName(teamAName, teamSeoMap[teamAName]) : '',
        teamBSeoName: teamBName ? resolveTeamSeoName(teamBName, teamSeoMap[teamBName]) : '',
        selected: appliedSelection,
      });
    }

    return {
      effectiveMasterBracket: nextMasterBracket,
      filteredRemainingGames: unresolvedGames.filter((gameId) => !sanitizedSelectedWinners[gameId]),
      matchSimulationDetails: SCENARIO_ROUND_ORDER
        .map((roundName) => ({
          name: roundName,
          games: rounds[roundName],
        }))
        .filter((round) => round.games.length > 0),
      sanitizedSelectedWinners,
    };
  }

  function syncScenarioSelections(nextSelectedWinners: Record<number, string>): void {
    const selectionState = buildScenarioSelectionState(nextSelectedWinners);
    selectedWinners = selectionState.sanitizedSelectedWinners;
    effectiveMasterBracket = selectionState.effectiveMasterBracket;
    filteredRemainingGames = selectionState.filteredRemainingGames;
    matchSimulationDetails = selectionState.matchSimulationDetails;
  }

  function handleSimulationResult(result: import('$lib/types').SimulationResult): void {
    browserExactArtifact = buildBrowserScenarioArtifact({
      entries,
      liveBracketData,
      masterBracket: effectiveMasterBracket,
      result,
      teamSeoMap,
      weighting: scenarioWeighting,
    });
    scenariosCalculated = true;
  }

  function calculateAllScenarios(): void {
    const config: SimulationConfig = {
      masterBracket,
      entries,
      filteredRemainingGames,
      selectedWinners,
      liveBracketData,
      teamSeoMap,
      weighting: scenarioWeighting,
    };

    try {
      handleSimulationResult(runSimulation(config));
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  function handleSelectWinner({ gameId, team }: { gameId: number; team: string }): void {
    const nextSelectedWinners = { ...selectedWinners };

    if (areEquivalentSelections(nextSelectedWinners[gameId], team)) {
      delete nextSelectedWinners[gameId];
    } else {
      nextSelectedWinners[gameId] = team;
    }

    syncScenarioSelections(nextSelectedWinners);

    if (entries.length > 0) {
      calculateAllScenarios();
    }
  }

  function resetSelections(): void {
    syncScenarioSelections({});

    if (entries.length > 0) {
      calculateAllScenarios();
    }
  }
</script>

<svelte:head>
  <title>Mosier Madness - Scenarios</title>
  <meta
    name="description"
    content="Explore rooting guide, title odds, and standings scenarios for Mosier Madness."
  />
</svelte:head>

<div class="mm-page scenario-page">
  {#if loading}
    <div class="scenario-state scenario-loading" in:fade={FADE_QUICK}>
      <div class="scenario-spinner"></div>
      <div class="scenario-loading-copy">Loading bracket data...</div>
    </div>
  {:else if !scenariosAvailable}
    <div class="scenario-state scenario-empty mm-shell">
      <h2 class="scenario-empty-title">Scenarios are not active yet</h2>
      <p class="scenario-empty-copy">
        Scenario analysis becomes available once the live tournament reaches the Sweet Sixteen.
      </p>
    </div>
  {:else if error}
    <div class="scenario-alert" in:fade={FADE_DELAYED}>
      <Alert message={error} center class="mb-4" />
    </div>
  {:else}
    {#if browserExactMode && scenarioPreviewDate}
      <div class="scenario-preview-note mm-control-shell">
        Local preview date override active for {scenarioPreviewDate}.
        {#if scenarioPreviewAssumption === 'higher-seed'}
          Unfinished Round of 32 games are being previewed as higher-seed wins.
        {/if}
        Remove
        <code>?scenarioDate={scenarioPreviewDate}{scenarioPreviewAssumption === 'higher-seed' ? '&scenarioAssumeRound2=higher-seed' : ''}</code>
        to return to the live tournament gate.
      </div>
    {/if}

    {#if scenarioMode === 'generated-snapshot'}
      <GeneratedScenariosPage artifact={data.generatedScenario} />
    {:else if !browserExactSimulationReady}
      <div class="scenario-state scenario-empty mm-shell">
        <h2 class="scenario-empty-title">Exact browser scenarios are almost ready</h2>
        <p class="scenario-empty-copy">
          The round-of-32 scenarios view stays active until every Sweet Sixteen matchup is set. Exact client-side
          scenarios will take over as soon as the live field is fully known.
        </p>
      </div>
    {:else if browserExactArtifact}
      <GeneratedScenariosPage artifact={browserExactArtifact}>
        <svelte:fragment slot="post-toolbar">
          {#if matchSimulationDetails.length > 0}
            <div class="scenario-filter-block hidden md:block mm-control-shell">
              <MatchSelector
                {matchSimulationDetails}
                onSelectWinner={handleSelectWinner}
                onReset={resetSelections}
              />
            </div>
          {/if}
        </svelte:fragment>
        <svelte:fragment slot="rooting-post-toolbar">
          {#if matchSimulationDetails.length > 0}
            <div class="scenario-filter-block hidden md:block mm-control-shell">
              <MatchSelector
                {matchSimulationDetails}
                onSelectWinner={handleSelectWinner}
                onReset={resetSelections}
              />
            </div>
          {/if}
        </svelte:fragment>
      </GeneratedScenariosPage>
    {:else}
      <div class="scenario-state scenario-empty mm-shell">
        <h2 class="scenario-empty-title">No exact scenario tree is available</h2>
        <p class="scenario-empty-copy">
          The browser simulation finished without producing a scenario artifact for this bracket state.
        </p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .scenario-page {
    display: grid;
    gap: 1rem;
  }

  .scenario-state {
    min-height: 24rem;
    display: grid;
    place-items: center;
    gap: 0.85rem;
    text-align: center;
  }

  .scenario-loading {
    width: min(100%, 84rem);
    margin: 0 auto;
  }

  .scenario-empty {
    padding: 2.2rem 1.5rem;
  }

  .scenario-spinner {
    width: 2.8rem;
    height: 2.8rem;
    border: 4px solid rgba(245, 158, 11, 0.3);
    border-top-color: #d97706;
    border-radius: 999px;
    animation: scenario-spin 0.8s linear infinite;
  }

  .scenario-loading-copy {
    color: #d97706;
    font-weight: 600;
  }

  .scenario-empty-title {
    margin: 0;
    color: var(--mm-text);
    font-size: clamp(1.55rem, 3vw, 2rem);
    font-weight: 700;
  }

  .scenario-empty-copy {
    margin: 0.75rem auto 0;
    max-width: 34rem;
    color: var(--mm-muted);
    line-height: 1.6;
  }

  .scenario-alert {
    width: min(100%, 84rem);
    margin: 0 auto;
  }

  .scenario-filter-block {
    width: min(100%, 84rem);
    margin: 0 auto;
  }

  .scenario-preview-note {
    color: var(--mm-muted);
    line-height: 1.55;
  }

  .scenario-preview-note code {
    font-size: 0.84em;
  }

  @keyframes scenario-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>
