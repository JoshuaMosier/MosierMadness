<script lang="ts">
  import { fade } from 'svelte/transition';
  import { FADE_QUICK, FADE_DELAYED } from '$lib/constants/transitions';
  import Alert from '$lib/components/Alert.svelte';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { resolveTeamSeoName } from '$lib/utils/teamColorUtils';
  import { getTeamNameFromSelection } from '$lib/utils/bracketUtils';
  import { getTeamsForGame, runSimulation, aggregateRootFor } from '$lib/utils/scenarioEngine';
  import MatchSelector from '$lib/components/scenarios/MatchSelector.svelte';
  import FullStandingsTab from '$lib/components/scenarios/FullStandingsTab.svelte';
  import GeneratedScenariosPage from '$lib/components/scenarios/GeneratedScenariosPage.svelte';
  import RootingGuideTab from '$lib/components/scenarios/RootingGuideTab.svelte';
  import type { LiveBracketData, Entry, SimulationResult } from '$lib/types';

  export let data: any;

  const scenarioMode = data.mode ?? 'browser-exact';
  const browserExactMode = scenarioMode === 'browser-exact';
  let entries: Entry[] = data.scenario?.entries || [];
  let loading = true;
  let error: string | null = null;
  const scenariosAvailable: boolean = data.scenariosAvailable ?? false;
  let liveBracketData: LiveBracketData = data.scenario?.liveBracketData || { matches: {}, champion: null };
  let masterBracket: string[] = data.scenario?.masterBracket || [];
  let teamSeoMap: Record<string, string> = data.scenario?.teamSeoMap || {};
  let remainingGames: number[] = [];
  let simulationInProgress = false;
  let scenariosCalculated = false;
  let totalScenarios = 0;
  let selectedTab = 'standings';
  let displayMode = 'percent';
  let currentUser: any = null;

  // Match selections
  let selectedWinners: Record<number, string> = {};
  let matchSimulationDetails: any[] = [];
  let hasSelections = false;

  // Results tracking
  let userWinCounts: any[] = [];
  let positionProbabilities: any[] = [];

  // Root For tab
  let selectedUser: string | null = null;
  let teamWinContributions: Record<number, any> = {};
  let targetPosition = 1;
  let bestPossibleFinish = 1;
  let currentUserEntryId: string | null = null;

  // Engine state for Root For aggregation
  let storedScenarioPositions: Uint8Array | null = null;
  let storedFilteredGames: number[] = [];
  let entryIdToIndex: Map<string, number> = new Map();

  onMount(async () => {
    try {
      if (!browserExactMode || !scenariosAvailable) return;

      for (let i = 0; i < entries.length; i++) {
        entryIdToIndex.set(entries[i].entryId, i);
      }

      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;

      initializeScenarioState();

      if (!scenariosCalculated && entries.length > 0) {
        calculateAllScenarios();
      }

      if (currentUser) {
        const userEntry = entries.find(entry => entry.user_id === currentUser.id);
        if (userEntry) {
          currentUserEntryId = userEntry.entryId;
          selectedUser = userEntry.entryId;
          calculateTeamContributions(selectedUser);
          selectedTab = 'root';
        }
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });

  function initializeScenarioState() {
    remainingGames = [];
    for (let i = 48; i < 63; i++) {
      if (!masterBracket[i]) remainingGames.push(i);
    }

    prepareMatchDetails();

    userWinCounts = entries.map(entry => ({
      entryId: entry.entryId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      winCount: 0,
      winProbability: 0
    }));

    positionProbabilities = entries.map(entry => {
      const positions = {};
      for (let i = 1; i <= entries.length; i++) positions[i] = 0;
      return {
        entryId: entry.entryId,
        firstName: entry.firstName,
        lastName: entry.lastName,
        positions,
        positionProbabilities: {}
      };
    });
  }

  function prepareMatchDetails() {
    matchSimulationDetails = [];

    const rounds = {
      "Sweet 16": [],
      "Elite 8": [],
      "Final Four": [],
      "Championship": []
    };

    const bracketWithSelections = [...masterBracket];
    for (const [gId, winner] of Object.entries(selectedWinners)) {
      bracketWithSelections[parseInt(gId)] = winner;
    }

    for (const gameId of remainingGames) {
      let round;
      if (gameId >= 48 && gameId < 56) round = "Sweet 16";
      else if (gameId >= 56 && gameId < 60) round = "Elite 8";
      else if (gameId >= 60 && gameId < 62) round = "Final Four";
      else if (gameId === 62) round = "Championship";
      if (!round) continue;

      const teams = getTeamsForGame(gameId, bracketWithSelections, liveBracketData);
      if (!teams.teamA && !teams.teamB) continue;

      const teamAName = teams.teamA ? getTeamNameFromSelection(teams.teamA) : null;
      const teamBName = teams.teamB ? getTeamNameFromSelection(teams.teamB) : null;

      rounds[round].push({
        gameId,
        teamA: teams.teamA,
        teamB: teams.teamB,
        teamASeoName: teamAName ? resolveTeamSeoName(teamAName, teamSeoMap[teamAName]) : '',
        teamBSeoName: teamBName ? resolveTeamSeoName(teamBName, teamSeoMap[teamBName]) : '',
        selected: selectedWinners[gameId] || null
      });
    }

    for (const [roundName, games] of Object.entries(rounds)) {
      if (games.length > 0) {
        matchSimulationDetails.push({ name: roundName, games });
      }
    }
  }

  function selectWinner(gameId: number, team: string): void {
    if (selectedWinners[gameId] === team) {
      delete selectedWinners[gameId];
    } else {
      selectedWinners[gameId] = team;
    }

    selectedWinners = {...selectedWinners};
    hasSelections = Object.keys(selectedWinners).length > 0;
    prepareMatchDetails();

    if (scenariosCalculated) calculateAllScenarios();
  }

  function resetSelections() {
    selectedWinners = {};
    hasSelections = false;
    prepareMatchDetails();
    if (scenariosCalculated) calculateAllScenarios();
  }

  function calculateAllScenarios() {
    simulationInProgress = true;
    scenariosCalculated = false;

    const filteredGames = remainingGames.filter(
      gameId => !selectedWinners.hasOwnProperty(gameId)
    );

    const result = runSimulation({
      masterBracket,
      entries,
      filteredRemainingGames: filteredGames,
      selectedWinners,
      liveBracketData
    });

    totalScenarios = result.totalScenarios;
    storedScenarioPositions = result.scenarioPositions;
    storedFilteredGames = filteredGames;

    userWinCounts = entries.map(entry => {
      const winCount = result.winCounts.get(entry.entryId) || 0;
      return {
        entryId: entry.entryId,
        firstName: entry.firstName,
        lastName: entry.lastName,
        winCount,
        winProbability: (winCount / totalScenarios) * 100
      };
    });
    userWinCounts.sort((a, b) => b.winProbability - a.winProbability);

    positionProbabilities = entries.map(entry => {
      const positions = result.positionCounts.get(entry.entryId) || {};
      const positionPercentages = {};
      for (const [position, count] of Object.entries(positions)) {
        positionPercentages[position] = (count / totalScenarios) * 100;
      }
      return {
        entryId: entry.entryId,
        firstName: entry.firstName,
        lastName: entry.lastName,
        positions,
        positionProbabilities: positionPercentages
      };
    });

    if (selectedUser) calculateTeamContributions(selectedUser);

    simulationInProgress = false;
    scenariosCalculated = true;
  }

  function calculateTeamContributions(userId: string): void {
    if (!scenariosCalculated || !userId || !storedScenarioPositions) return;

    teamWinContributions = {};

    const userPositionData = positionProbabilities.find(p => p.entryId === userId);
    if (!userPositionData) return;

    bestPossibleFinish = 1;
    if (!(userPositionData.positionProbabilities[1] > 0)) {
      for (let i = 2; i <= entries.length; i++) {
        if (userPositionData.positionProbabilities[i] > 0) {
          bestPossibleFinish = i;
          break;
        }
      }
    }
    targetPosition = bestPossibleFinish;

    const eIdx = entryIdToIndex.get(userId);
    if (eIdx === undefined) return;

    const rootForResults = aggregateRootFor({
      filteredRemainingGames: storedFilteredGames,
      scenarioPositions: storedScenarioPositions,
      numEntries: entries.length,
      totalScenarios,
      entryIndex: eIdx,
      targetPosition
    });

    for (const round of matchSimulationDetails) {
      for (const game of round.games) {
        if (selectedWinners[game.gameId]) continue;

        const agg = rootForResults.get(game.gameId);
        if (!agg) continue;

        const pctWithA = agg.totalA > 0 ? (agg.countIfA / agg.totalA) * 100 : 0;
        const pctWithB = agg.totalB > 0 ? (agg.countIfB / agg.totalB) * 100 : 0;
        const delta = pctWithA - pctWithB;

        teamWinContributions[game.gameId] = {
          teamA: { team: game.teamA, wins: agg.countIfA, winPct: pctWithA, totalScenarios: agg.totalA },
          teamB: { team: game.teamB, wins: agg.countIfB, winPct: pctWithB, totalScenarios: agg.totalB },
          delta,
          favoredTeam: delta > 0 ? 'A' : delta < 0 ? 'B' : null,
          deltaText: `${delta >= 0 ? agg.countIfA : agg.countIfB}`
        };
      }
    }
  }

  function handleSelectWinner({ gameId, team }: { gameId: number; team: string }): void {
    selectWinner(gameId, team);
  }

  function handleUserChange(userId: string): void {
    selectedUser = userId;
    calculateTeamContributions(userId);
  }
</script>

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
    {#if scenarioMode === 'generated-snapshot'}
      <GeneratedScenariosPage artifact={data.generatedScenario} />
    {:else}
      <div class="scenario-shell mm-shell">
        <div class="scenario-shell-header">
          <div class="scenario-shell-copy">
            <p class="scenario-kicker">Scenarios</p>
            <h2 class="scenario-title">Tournament Outcome Probabilities</h2>
            <p class="scenario-subtitle">
              Use Standings for title odds, finish ranges, and the full matrix view, and Rooting Guide to see which remaining outcomes help a bracket most. Use the game selector to preview specific paths.
            </p>
          </div>
        </div>

        <div class="scenario-shell-body">
          {#if remainingGames.length > 12}
            <div class="scenario-warning">
              Warning: There are {remainingGames.length} games remaining, which means {Math.pow(2, remainingGames.length).toLocaleString()} possible scenarios.
              Calculation may take a long time or crash your browser.
            </div>
          {/if}

          {#if scenariosCalculated}
            <div class="scenario-tab-row">
              <button
                class={`scenario-tab ${selectedTab === 'standings' ? 'is-active' : ''}`}
                on:click={() => selectedTab = 'standings'}
              >
                Standings
              </button>
              <button
                class={`scenario-tab ${selectedTab === 'root' ? 'is-active' : ''}`}
                on:click={() => selectedTab = 'root'}
              >
                Rooting Guide
              </button>
            </div>

            <div class="scenario-panel">
              {#if selectedTab === 'standings'}
                <div class="scenario-filter-block">
                  <MatchSelector
                    {matchSimulationDetails}
                    onSelectWinner={handleSelectWinner}
                    onReset={resetSelections}
                  />
                </div>
                <FullStandingsTab
                  {positionProbabilities}
                  {totalScenarios}
                  numEntries={entries.length}
                  bind:displayMode
                  {currentUserEntryId}
                />
              {:else if selectedTab === 'root'}
                <RootingGuideTab
                  {entries}
                  {currentUser}
                  bind:selectedUser
                  {selectedWinners}
                  {matchSimulationDetails}
                  {teamWinContributions}
                  {positionProbabilities}
                  {userWinCounts}
                  {totalScenarios}
                  {targetPosition}
                  {scenariosCalculated}
                  onUserChange={handleUserChange}
                />
              {/if}
            </div>
          {:else}
            <div class="scenario-state scenario-calculating">
              <div class="scenario-spinner"></div>
              <p class="scenario-calculating-copy">Calculating tournament scenarios automatically...</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .scenario-page {
    max-width: 88rem;
  }

  .scenario-state,
  .scenario-shell {
    width: min(100%, 84rem);
    margin: 0 auto;
  }

  .scenario-loading,
  .scenario-calculating {
    min-height: 24rem;
    display: grid;
    place-items: center;
    gap: 0.85rem;
    text-align: center;
  }

  .scenario-empty {
    padding: 2.2rem 1.5rem;
    text-align: center;
  }

  .scenario-spinner {
    width: 2.8rem;
    height: 2.8rem;
    border: 4px solid rgba(245, 158, 11, 0.3);
    border-top-color: #d97706;
    border-radius: 999px;
    animation: scenario-spin 0.8s linear infinite;
  }

  .scenario-loading-copy,
  .scenario-calculating-copy {
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
  }

  .scenario-alert {
    width: min(100%, 84rem);
    margin: 0 auto;
  }

  .scenario-shell {
    overflow: hidden;
    background: rgba(10, 10, 11, 0.96);
  }

  .scenario-shell-header {
    padding: 1.5rem 1.5rem 1.15rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(14, 14, 15, 0.92);
  }

  .scenario-kicker {
    margin: 0;
    color: var(--mm-subtle);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .scenario-title {
    margin: 0.38rem 0 0;
    color: var(--mm-text);
    font-size: clamp(1.7rem, 3.3vw, 2.35rem);
    font-weight: 700;
    line-height: 1.02;
  }

  .scenario-subtitle {
    margin: 0.5rem 0 0;
    color: var(--mm-muted);
    font-size: 0.96rem;
  }

  .scenario-shell-body {
    padding: 1.3rem 1.5rem 1.5rem;
  }

  .scenario-warning {
    margin-bottom: 1rem;
    padding: 0.9rem 1rem;
    border: 1px solid rgba(180, 83, 9, 0.4);
    border-radius: 1rem;
    background: rgba(120, 53, 15, 0.16);
    color: #fbbf24;
    font-size: 0.92rem;
  }

  .scenario-filter-block {
    margin-bottom: 1.15rem;
  }

  .scenario-tab-row {
    display: flex;
    gap: 0.55rem;
    margin-bottom: 1rem;
    padding-bottom: 0.15rem;
    overflow-x: auto;
  }

  .scenario-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.35rem;
    padding: 0.45rem 0.95rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: var(--mm-muted);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
  }

  .scenario-tab:hover {
    color: var(--mm-text);
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.05);
  }

  .scenario-tab.is-active {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(245, 158, 11, 0.08);
  }

  .scenario-panel {
    min-width: 0;
  }

  @keyframes scenario-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 767px) {
    .scenario-shell-header {
      padding: 1.2rem 1rem 1rem;
    }

    .scenario-kicker,
    .scenario-subtitle {
      display: none;
    }

    .scenario-title {
      margin-top: 0;
      font-size: 1.55rem;
    }

    .scenario-shell-body {
      padding: 1rem;
    }

    .scenario-empty {
      padding: 1.8rem 1rem;
    }

    .scenario-tab-row {
      flex-direction: column;
      overflow: visible;
    }

    .scenario-tab {
      width: 100%;
    }
  }
</style>
