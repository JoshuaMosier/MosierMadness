<script lang="ts">
  import { handleImageError } from '$lib/utils/imageUtils';

  export let matchSimulationDetails: any[] = [];
  export let onSelectWinner: (detail: { gameId: number; team: string }) => void = () => {};
  export let onReset: () => void = () => {};
</script>

<div class="mb-6 hidden md:block">
  <div class="flex justify-between items-center mb-3">
    <h3 class="text-sm font-medium text-amber-500">Select Match Winners to Filter Scenarios</h3>
    <button
      class="px-3 py-1 text-xs rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
      on:click={onReset}
    >
      Reset Selections
    </button>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-9 gap-1">
    {#each matchSimulationDetails as round}
      {#each round.games as game}
        <div class="bg-zinc-800/80 border border-zinc-700 rounded-lg overflow-hidden">
          <div class="bg-zinc-700/50 px-2 py-1 text-xs font-medium text-zinc-300 truncate">
            {round.name}
          </div>
          <div class="p-0.5">
            <!-- Team A -->
            <button
              class="w-full flex items-center gap-1 py-1.5 px-1 rounded mb-1 transition-colors
                     {game.selected === game.teamA && game.teamA
                      ? 'bg-amber-600/80 text-white'
                      : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'}"
              on:click={() => onSelectWinner({ gameId: game.gameId, team: game.teamA })}
              disabled={!game.teamA}
              style={!game.teamA ? 'opacity: 0.7;' : ''}
            >
              {#if game.teamA}
                <div class="w-6 h-6 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1">
                  <img
                    src={game.teamASeoName ? `/images/team-logos/${game.teamASeoName}.svg` : '/images/placeholder-team.svg'}
                    alt="Team logo"
                    class="w-full h-full object-contain"
                    style="filter: url(#teamLogoOutline);"
                    on:error={handleImageError}
                  />
                </div>
                <div class="truncate text-xs">{game.teamA}</div>
              {:else}
                <div class="w-6 h-6 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1 flex items-center justify-center">
                  <span class="text-xs text-zinc-400">?</span>
                </div>
                <div class="truncate text-xs text-zinc-400">TBD</div>
              {/if}
            </button>

            <!-- Team B -->
            <button
              class="w-full flex items-center gap-1 py-1.5 px-1 rounded transition-colors
                     {game.selected === game.teamB && game.teamB
                      ? 'bg-amber-600/80 text-white'
                      : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'}"
              on:click={() => onSelectWinner({ gameId: game.gameId, team: game.teamB })}
              disabled={!game.teamB}
              style={!game.teamB ? 'opacity: 0.7;' : ''}
            >
              {#if game.teamB}
                <div class="w-6 h-6 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1">
                  <img
                    src={game.teamBSeoName ? `/images/team-logos/${game.teamBSeoName}.svg` : '/images/placeholder-team.svg'}
                    alt="Team logo"
                    class="w-full h-full object-contain"
                    style="filter: url(#teamLogoOutline);"
                    on:error={handleImageError}
                  />
                </div>
                <div class="truncate text-xs">{game.teamB}</div>
              {:else}
                <div class="w-6 h-6 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 p-1 flex items-center justify-center">
                  <span class="text-xs text-zinc-400">?</span>
                </div>
                <div class="truncate text-xs text-zinc-400">TBD</div>
              {/if}
            </button>
          </div>
        </div>
      {/each}
    {/each}

    {#if matchSimulationDetails.length === 0}
      <div class="col-span-full text-center py-4 text-zinc-500 italic">
        No upcoming games found in the tournament data.
      </div>
    {/if}
  </div>
</div>
