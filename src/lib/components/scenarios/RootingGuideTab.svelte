<script lang="ts">
  import { getOrdinalSuffix } from '$lib/utils/scenarioEngine';
  import { handleImageError } from '$lib/utils/imageUtils';
  import type { Entry } from '$lib/types';

  export let entries: Entry[] = [];
  export let currentUser: any = null;
  export let selectedUser: string | null = null;
  export let selectedWinners: Record<number, string> = {};
  export let matchSimulationDetails: any[] = [];
  export let teamWinContributions: Record<number, any> = {};
  export let positionProbabilities: any[] = [];
  export let userWinCounts: any[] = [];
  export let totalScenarios: number = 0;
  export let targetPosition: number = 1;
  export let scenariosCalculated: boolean = false;
  export let onUserChange: (userId: string) => void = () => {};

  function handleUserChange() {
    onUserChange(selectedUser);
  }
</script>

<div class="mb-6">
  <div class="mb-4">
    <div class="flex flex-col md:flex-row items-start gap-4">
      <div class="w-full md:w-auto">
        <label for="userSelect" class="block text-sm font-medium text-zinc-300 mb-1">
          {#if currentUser && selectedUser && entries.find(entry => entry.entryId === selectedUser && entry.user_id === currentUser.id)}
            Your bracket is automatically selected:
          {:else}
            Select a bracket:
          {/if}
        </label>
        <div class="flex flex-wrap items-center gap-3">
          <select
            id="userSelect"
            class="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-zinc-200 w-full md:w-64"
            bind:value={selectedUser}
            on:change={handleUserChange}
          >
            <option value={null} disabled selected={!selectedUser}>Select a user...</option>
            {#each entries.slice().sort((a, b) => {
              const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
              const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
              return nameA.localeCompare(nameB);
            }) as entry}
              <option value={entry.entryId}>{entry.firstName} {entry.lastName}{entry.user_id === currentUser?.id ? ' (You)' : ''}</option>
            {/each}
          </select>

          {#if selectedUser && scenariosCalculated}
            {#if targetPosition === 1}
              <div class="bg-zinc-800 border border-amber-600 rounded-lg p-2 flex items-center gap-2 flex-wrap">
                <span class="text-zinc-200 text-sm">Chances for 1st:</span>
                <span class="bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded text-sm font-semibold">
                  {(userWinCounts.find(u => u.entryId === selectedUser)?.winCount || 0).toLocaleString()} of {totalScenarios.toLocaleString()}
                </span>
                <span class="text-base font-bold text-amber-500">{(positionProbabilities.find(p => p.entryId === selectedUser)?.positionProbabilities[1] || 0).toFixed(1)}%</span>
              </div>
            {:else}
              <div class="bg-zinc-800 border border-amber-800/50 rounded-lg p-2 flex items-center gap-2 flex-wrap">
                <span class="bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded text-sm font-medium">No 1st place chance</span>
                <span class="text-sm text-white">Best finish: <strong class="text-amber-500">{targetPosition}{getOrdinalSuffix(targetPosition)}</strong></span>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if selectedUser && Object.keys(teamWinContributions).length > 0}
    <div class="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4 mb-4">
      <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {#each matchSimulationDetails as round}
          {#each round.games.filter(game => !selectedWinners[game.gameId] && game.teamA && game.teamB) as game}
            {#if teamWinContributions[game.gameId]}
              <div class="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                <div class="bg-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300">
                  {round.name} Match
                </div>

                <div class="p-3">
                  <!-- Team A -->
                  <div class="flex items-center justify-between mb-2 p-2 rounded
                            {teamWinContributions[game.gameId].favoredTeam === 'A'
                              ? 'bg-green-900/30 border border-green-900'
                              : teamWinContributions[game.gameId].teamA.wins === 0
                                ? 'bg-red-900/30 border border-red-900'
                                : 'bg-zinc-700/30'}"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1">
                        <img
                          src={game.teamASeoName ? `/images/team-logos/${game.teamASeoName}.svg` : '/images/placeholder-team.svg'}
                          alt="Team logo"
                          class="w-full h-full object-contain"
                          on:error={handleImageError}
                        />
                      </div>
                      <div>
                        <div class="text-zinc-200 font-medium">{game.teamA}</div>
                        <div class="text-xs text-zinc-400">
                          {teamWinContributions[game.gameId].teamA.wins} of {teamWinContributions[game.gameId].teamA.totalScenarios} scenarios ({teamWinContributions[game.gameId].teamA.winPct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    <div class="{teamWinContributions[game.gameId].favoredTeam === 'A' ? 'text-green-400' : teamWinContributions[game.gameId].teamA.wins === 0 ? 'text-red-400' : 'text-amber-400'} font-medium text-sm">
                      {teamWinContributions[game.gameId].teamA.wins}
                    </div>
                  </div>

                  <!-- Team B -->
                  <div class="flex items-center justify-between p-2 rounded
                            {teamWinContributions[game.gameId].favoredTeam === 'B'
                              ? 'bg-green-900/30 border border-green-900'
                              : teamWinContributions[game.gameId].teamB.wins === 0
                                ? 'bg-red-900/30 border border-red-900'
                                : 'bg-zinc-700/30'}"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1">
                        <img
                          src={game.teamBSeoName ? `/images/team-logos/${game.teamBSeoName}.svg` : '/images/placeholder-team.svg'}
                          alt="Team logo"
                          class="w-full h-full object-contain"
                          on:error={handleImageError}
                        />
                      </div>
                      <div>
                        <div class="text-zinc-200 font-medium">{game.teamB}</div>
                        <div class="text-xs text-zinc-400">
                          {teamWinContributions[game.gameId].teamB.wins} of {teamWinContributions[game.gameId].teamB.totalScenarios} scenarios ({teamWinContributions[game.gameId].teamB.winPct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    <div class="{teamWinContributions[game.gameId].favoredTeam === 'B' ? 'text-green-400' : teamWinContributions[game.gameId].teamB.wins === 0 ? 'text-red-400' : 'text-amber-400'} font-medium text-sm">
                      {teamWinContributions[game.gameId].teamB.wins}
                    </div>
                  </div>

                  <!-- Root for summary -->
                  <div class="mt-2 text-center text-xs">
                    {#if teamWinContributions[game.gameId].teamA.wins === 0 && teamWinContributions[game.gameId].teamB.wins !== 0}
                      <span class="text-red-400 font-semibold">Must root for <strong>{game.teamB}</strong> - only viable option</span>
                    {:else if teamWinContributions[game.gameId].teamB.wins === 0 && teamWinContributions[game.gameId].teamA.wins !== 0}
                      <span class="text-red-400 font-semibold">Must root for <strong>{game.teamA}</strong> - only viable option</span>
                    {:else if teamWinContributions[game.gameId].favoredTeam === 'A'}
                      <span class="text-amber-500">Root for <strong>{game.teamA}</strong> for best chances</span>
                    {:else if teamWinContributions[game.gameId].favoredTeam === 'B'}
                      <span class="text-amber-500">Root for <strong>{game.teamB}</strong> for best chances</span>
                    {:else}
                      <span class="text-zinc-400">This game has no significant impact</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        {/each}

        {#if Object.keys(teamWinContributions).filter(gameId => {
          const game = matchSimulationDetails
            .flatMap(round => round.games)
            .find(g => g.gameId.toString() === gameId && g.teamA && g.teamB);
          return game && !selectedWinners[gameId];
        }).length === 0}
          <div class="col-span-full bg-zinc-800 p-4 text-center text-zinc-400 rounded-lg border border-zinc-700">
            No unassigned games found. All remaining games have already been selected or don't have both teams determined yet.
          </div>
        {/if}
      </div>
    </div>
  {:else if selectedUser}
    <div class="text-center py-8 text-zinc-500">
      No games found where both teams are determined.
    </div>
  {:else}
    <div class="text-center py-8 text-zinc-500">
      {#if currentUser}
        No bracket found for your account. Please select another user's bracket to see rooting interests.
      {:else}
        Please select a user to see rooting interests. <span class="text-amber-500">Sign in to automatically see your bracket!</span>
      {/if}
    </div>
  {/if}
</div>
