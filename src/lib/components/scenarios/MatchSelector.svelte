<script lang="ts">
  import { handleImageError } from '$lib/utils/imageUtils';

  export let matchSimulationDetails: any[] = [];
  export let onSelectWinner: (detail: { gameId: number; team: string }) => void = () => {};
  export let onReset: () => void = () => {};
</script>

<div class="scenario-selector hidden md:block">
  <div class="scenario-selector-header">
    <h3 class="scenario-selector-title">Select Match Winners to Filter Scenarios</h3>
    <button
      class="scenario-selector-reset mm-toggle-button"
      on:click={onReset}
    >
      Reset Selections
    </button>
  </div>

  <div class="scenario-selector-grid">
    {#each matchSimulationDetails as round}
      {#each round.games as game}
        <div class="scenario-selector-card">
          <div class="scenario-selector-round">
            {round.name}
          </div>
          <div class="scenario-selector-card-body">
            <button
              class={`scenario-selector-team ${game.selected === game.teamA && game.teamA ? 'is-selected' : ''}`}
              on:click={() => onSelectWinner({ gameId: game.gameId, team: game.teamA })}
              disabled={!game.teamA}
            >
              {#if game.teamA}
                <div class="scenario-selector-logo-wrap">
                  <img
                    src={game.teamASeoName ? `/images/team-logos/${game.teamASeoName}.svg` : '/images/placeholder-team.svg'}
                    alt="Team logo"
                    class="scenario-selector-logo"
                    style="filter: url(#teamLogoOutline);"
                    on:error={handleImageError}
                  />
                </div>
                <div class="scenario-selector-team-name">{game.teamA}</div>
              {:else}
                <div class="scenario-selector-logo-wrap is-placeholder">
                  <span class="scenario-selector-placeholder">?</span>
                </div>
                <div class="scenario-selector-team-name is-empty">TBD</div>
              {/if}
            </button>

            <button
              class={`scenario-selector-team ${game.selected === game.teamB && game.teamB ? 'is-selected' : ''}`}
              on:click={() => onSelectWinner({ gameId: game.gameId, team: game.teamB })}
              disabled={!game.teamB}
            >
              {#if game.teamB}
                <div class="scenario-selector-logo-wrap">
                  <img
                    src={game.teamBSeoName ? `/images/team-logos/${game.teamBSeoName}.svg` : '/images/placeholder-team.svg'}
                    alt="Team logo"
                    class="scenario-selector-logo"
                    style="filter: url(#teamLogoOutline);"
                    on:error={handleImageError}
                  />
                </div>
                <div class="scenario-selector-team-name">{game.teamB}</div>
              {:else}
                <div class="scenario-selector-logo-wrap is-placeholder">
                  <span class="scenario-selector-placeholder">?</span>
                </div>
                <div class="scenario-selector-team-name is-empty">TBD</div>
              {/if}
            </button>
          </div>
        </div>
      {/each}
    {/each}

    {#if matchSimulationDetails.length === 0}
      <div class="scenario-selector-empty">
        No upcoming games found in the tournament data.
      </div>
    {/if}
  </div>
</div>

<style>
  .scenario-selector {
    margin-bottom: 1.1rem;
  }

  .scenario-selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.7rem;
  }

  .scenario-selector-title {
    margin: 0;
    color: #f59e0b;
    font-size: 0.84rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .scenario-selector-reset {
    flex-shrink: 0;
  }

  .scenario-selector-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem;
  }

  .scenario-selector-card {
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.95rem;
    background: rgba(14, 14, 15, 0.92);
  }

  .scenario-selector-round {
    padding: 0.4rem 0.58rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.03);
    color: var(--mm-muted);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .scenario-selector-card-body {
    padding: 0.3rem;
  }

  .scenario-selector-team {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem;
    border-radius: 0.72rem;
    color: var(--mm-text);
    transition: background-color 160ms ease, border-color 160ms ease;
  }

  .scenario-selector-team + .scenario-selector-team {
    margin-top: 0.22rem;
  }

  .scenario-selector-team:not(.is-selected) {
    background: rgba(255, 255, 255, 0.03);
  }

  .scenario-selector-team:not(.is-selected):hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .scenario-selector-team.is-selected {
    background: rgba(245, 158, 11, 0.18);
    color: white;
  }

  .scenario-selector-team:disabled {
    opacity: 0.68;
  }

  .scenario-selector-logo-wrap {
    width: 1.9rem;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    padding: 0.25rem;
    border-radius: 0.55rem;
    background: rgba(255, 255, 255, 0.04);
  }

  .scenario-selector-logo-wrap.is-placeholder {
    color: var(--mm-subtle);
  }

  .scenario-selector-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .scenario-selector-placeholder {
    font-size: 0.8rem;
    font-weight: 700;
  }

  .scenario-selector-team-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.76rem;
    font-weight: 600;
    text-align: left;
  }

  .scenario-selector-team-name.is-empty {
    color: var(--mm-subtle);
  }

  .scenario-selector-empty {
    grid-column: 1 / -1;
    padding: 1rem;
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 0.95rem;
    color: var(--mm-subtle);
    text-align: center;
    font-style: italic;
  }

  @media (min-width: 1024px) {
    .scenario-selector-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (min-width: 1280px) {
    .scenario-selector-grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }

  @media (min-width: 1536px) {
    .scenario-selector-grid {
      grid-template-columns: repeat(9, minmax(0, 1fr));
    }
  }
</style>
