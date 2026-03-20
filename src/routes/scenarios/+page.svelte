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
  import WinChancesTab from '$lib/components/scenarios/WinChancesTab.svelte';
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
  let selectedTab = 'win';
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

<div class="max-w-7xl mx-auto px-4 py-8">
  {#if loading}
    <div class="flex justify-center items-center min-h-[400px]" in:fade={FADE_QUICK}>
      <div class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-amber-600 font-medium">Loading bracket data...</div>
      </div>
    </div>
  {:else if !scenariosAvailable}
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
      <h2 class="text-2xl font-semibold text-zinc-100">Scenarios are not active yet</h2>
      <p class="mt-3 text-zinc-400">
        Scenario analysis becomes available once the live tournament reaches the Sweet Sixteen.
      </p>
    </div>
  {:else if error}
    <div in:fade={FADE_DELAYED}>
      <Alert message={error} center class="mb-4" />
    </div>
  {:else}
    {#if scenarioMode === 'generated-snapshot'}
      <GeneratedScenariosPage artifact={data.generatedScenario} />
    {:else}
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div class="border-b border-zinc-800 bg-zinc-900/50">
          <div class="p-6">
            <div class="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h2 class="text-2xl font-semibold text-zinc-100">Tournament Outcome Probabilities</h2>
                <p class="text-sm text-zinc-400 mt-1">
                  {#if hasSelections}
                    Based on {scenariosCalculated ? totalScenarios.toLocaleString() : 'filtered'} tournament outcomes
                    <span class="text-amber-500">(filtered by {Object.keys(selectedWinners).length} selections)</span>
                  {:else}
                    Based on {scenariosCalculated ? totalScenarios.toLocaleString() : 'all possible'} tournament outcomes
                  {/if}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6">
          {#if remainingGames.length > 12}
            <div class="bg-amber-800/20 border border-amber-800/30 text-amber-400 p-3 rounded mb-4 text-sm">
              Warning: There are {remainingGames.length} games remaining, which means {Math.pow(2, remainingGames.length).toLocaleString()} possible scenarios.
              Calculation may take a long time or crash your browser.
            </div>
          {/if}

          {#if scenariosCalculated}
            <MatchSelector
              {matchSimulationDetails}
              onSelectWinner={handleSelectWinner}
              onReset={resetSelections}
            />

            <div class="mb-6">
              <div class="border-b border-zinc-700">
                <div class="flex">
                  <button
                    class={`py-2 px-4 font-medium text-sm ${selectedTab === 'win' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                    on:click={() => selectedTab = 'win'}
                  >
                    Win Chances
                  </button>
                  <button
                    class={`py-2 px-4 font-medium text-sm hidden md:block ${selectedTab === 'full' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                    on:click={() => selectedTab = 'full'}
                  >
                    Full Standings
                  </button>
                  <button
                    class={`py-2 px-4 font-medium text-sm ${selectedTab === 'root' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                    on:click={() => selectedTab = 'root'}
                  >
                    Rooting Guide
                  </button>
                </div>
              </div>
            </div>

            {#if selectedTab === 'win'}
              <WinChancesTab {userWinCounts} />
            {:else if selectedTab === 'full'}
              <FullStandingsTab
                {positionProbabilities}
                {totalScenarios}
                numEntries={entries.length}
                bind:displayMode
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
          {:else}
            <div class="text-center py-12 text-zinc-500">
              <div class="animate-pulse flex flex-col items-center">
                <div class="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p>Calculating tournament scenarios automatically...</p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>
