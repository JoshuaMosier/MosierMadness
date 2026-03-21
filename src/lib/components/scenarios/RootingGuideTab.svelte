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

<div class="rooting-guide">
  <div class="rooting-guide-toolbar">
    <div class="rooting-guide-toolbar-row">
      <label for="userSelect" class="rooting-guide-kicker">
        {#if currentUser && selectedUser && entries.find(entry => entry.entryId === selectedUser && entry.user_id === currentUser.id)}
          Your Bracket
        {:else}
          Bracket Focus
        {/if}
      </label>

      <select
        id="userSelect"
        class="rooting-guide-select"
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
          <div class="rooting-guide-baseline">
            <span class="rooting-guide-baseline-label">1st-place chance</span>
            <span class="rooting-guide-baseline-pill">
              {(userWinCounts.find(u => u.entryId === selectedUser)?.winCount || 0).toLocaleString()} of {totalScenarios.toLocaleString()}
            </span>
            <span class="rooting-guide-baseline-value">
              {(positionProbabilities.find(p => p.entryId === selectedUser)?.positionProbabilities[1] || 0).toFixed(1)}%
            </span>
          </div>
        {:else}
          <div class="rooting-guide-baseline is-muted">
            <span class="rooting-guide-baseline-label">Best live path</span>
            <span class="rooting-guide-baseline-pill is-muted">No 1st-place chance</span>
            <span class="rooting-guide-baseline-value">
              {targetPosition}{getOrdinalSuffix(targetPosition)}
            </span>
          </div>
        {/if}
      {/if}
    </div>
  </div>

  {#if selectedUser && Object.keys(teamWinContributions).length > 0}
    <div class="rooting-guide-grid">
        {#each matchSimulationDetails as round}
          {#each round.games.filter(game => !selectedWinners[game.gameId] && game.teamA && game.teamB) as game}
            {#if teamWinContributions[game.gameId]}
              <article class="rooting-card">
                <div class="rooting-card-round">
                  {round.name} Match
                </div>

                <div class="rooting-card-body">
                  <div
                    class={`rooting-team-row ${
                      teamWinContributions[game.gameId].favoredTeam === 'A'
                        ? 'is-favored'
                        : teamWinContributions[game.gameId].teamA.wins === 0
                          ? 'is-dead'
                          : 'is-neutral'
                    }`}
                  >
                    <div class="rooting-team-copy">
                      <div class="rooting-team-logo-wrap">
                        <img
                          src={game.teamASeoName ? `/images/team-logos/${game.teamASeoName}.svg` : '/images/placeholder-team.svg'}
                          alt="Team logo"
                          class="rooting-team-logo"
                          on:error={handleImageError}
                        />
                      </div>
                      <div class="rooting-team-text">
                        <div class="rooting-team-name">{game.teamA}</div>
                        <div class="rooting-team-meta">
                          {teamWinContributions[game.gameId].teamA.wins} of {teamWinContributions[game.gameId].teamA.totalScenarios} scenarios ({teamWinContributions[game.gameId].teamA.winPct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    <div class="rooting-team-count">
                      {teamWinContributions[game.gameId].teamA.wins}
                    </div>
                  </div>

                  <div
                    class={`rooting-team-row ${
                      teamWinContributions[game.gameId].favoredTeam === 'B'
                        ? 'is-favored'
                        : teamWinContributions[game.gameId].teamB.wins === 0
                          ? 'is-dead'
                          : 'is-neutral'
                    }`}
                  >
                    <div class="rooting-team-copy">
                      <div class="rooting-team-logo-wrap">
                        <img
                          src={game.teamBSeoName ? `/images/team-logos/${game.teamBSeoName}.svg` : '/images/placeholder-team.svg'}
                          alt="Team logo"
                          class="rooting-team-logo"
                          on:error={handleImageError}
                        />
                      </div>
                      <div class="rooting-team-text">
                        <div class="rooting-team-name">{game.teamB}</div>
                        <div class="rooting-team-meta">
                          {teamWinContributions[game.gameId].teamB.wins} of {teamWinContributions[game.gameId].teamB.totalScenarios} scenarios ({teamWinContributions[game.gameId].teamB.winPct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    <div class="rooting-team-count">
                      {teamWinContributions[game.gameId].teamB.wins}
                    </div>
                  </div>

                  <div class="rooting-card-summary">
                    {#if teamWinContributions[game.gameId].teamA.wins === 0 && teamWinContributions[game.gameId].teamB.wins !== 0}
                      <span class="rooting-summary-text is-must">Must root for <strong>{game.teamB}</strong> - only viable option</span>
                    {:else if teamWinContributions[game.gameId].teamB.wins === 0 && teamWinContributions[game.gameId].teamA.wins !== 0}
                      <span class="rooting-summary-text is-must">Must root for <strong>{game.teamA}</strong> - only viable option</span>
                    {:else if teamWinContributions[game.gameId].favoredTeam === 'A'}
                      <span class="rooting-summary-text is-favored">Root for <strong>{game.teamA}</strong> for best chances</span>
                    {:else if teamWinContributions[game.gameId].favoredTeam === 'B'}
                      <span class="rooting-summary-text is-favored">Root for <strong>{game.teamB}</strong> for best chances</span>
                    {:else}
                      <span class="rooting-summary-text is-neutral">This game has no significant impact</span>
                    {/if}
                  </div>
                </div>
              </article>
            {/if}
          {/each}
        {/each}

        {#if Object.keys(teamWinContributions).filter(gameId => {
          const game = matchSimulationDetails
            .flatMap(round => round.games)
            .find(g => g.gameId.toString() === gameId && g.teamA && g.teamB);
          return game && !selectedWinners[gameId];
        }).length === 0}
          <div class="rooting-empty-state">
            No unassigned games found. All remaining games have already been selected or don't have both teams determined yet.
          </div>
        {/if}
    </div>
  {:else if selectedUser}
    <div class="rooting-guide-message">
      No games found where both teams are determined.
    </div>
  {:else}
    <div class="rooting-guide-message">
      {#if currentUser}
        No bracket found for your account. Please select another user's bracket to see rooting interests.
      {:else}
        Please select a user to see rooting interests. <span class="rooting-guide-accent">Sign in to automatically see your bracket!</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .rooting-guide {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .rooting-guide-toolbar {
    padding: 1rem 1.05rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(12, 12, 13, 0.72);
  }

  .rooting-guide-toolbar-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .rooting-guide-kicker {
    flex: 0 0 auto;
    color: var(--mm-subtle);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .rooting-guide-select {
    min-width: 18rem;
    flex: 1 1 22rem;
    min-height: 2.55rem;
    padding: 0.6rem 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.9rem;
    background: rgba(17, 17, 18, 0.92);
    color: var(--mm-text);
  }

  .rooting-guide-baseline {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.55rem;
    flex-wrap: wrap;
    flex: 1 1 21rem;
    min-width: 15rem;
  }

  .rooting-guide-baseline.is-muted {
    color: var(--mm-muted);
  }

  .rooting-guide-baseline-label {
    color: var(--mm-subtle);
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .rooting-guide-baseline-pill,
  .rooting-guide-baseline-value {
    display: inline-flex;
    align-items: center;
    min-height: 2.2rem;
    padding: 0.45rem 0.8rem;
    border-radius: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 700;
  }

  .rooting-guide-baseline-pill {
    color: #fbbf24;
  }

  .rooting-guide-baseline-pill.is-muted {
    color: var(--mm-muted);
  }

  .rooting-guide-baseline-value {
    border-color: rgba(245, 158, 11, 0.2);
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
  }

  .rooting-guide-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .rooting-card {
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 1.2rem;
    background: linear-gradient(180deg, rgba(20, 20, 21, 0.96), rgba(10, 10, 11, 0.98));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .rooting-card-round {
    padding: 0.7rem 0.9rem;
    border-bottom: 1px solid rgba(245, 158, 11, 0.08);
    background: linear-gradient(90deg, rgba(245, 158, 11, 0.14), rgba(245, 158, 11, 0.02));
    color: #d4d4d8;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .rooting-card-body {
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .rooting-team-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.72rem 0.78rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .rooting-team-row.is-favored {
    border-color: rgba(34, 197, 94, 0.28);
    background:
      linear-gradient(90deg, rgba(22, 101, 52, 0.34), rgba(12, 46, 26, 0.92)),
      rgba(12, 46, 26, 0.92);
  }

  .rooting-team-row.is-dead {
    border-color: rgba(239, 68, 68, 0.28);
    background:
      linear-gradient(90deg, rgba(127, 29, 29, 0.42), rgba(60, 18, 18, 0.92)),
      rgba(60, 18, 18, 0.92);
  }

  .rooting-team-row.is-neutral {
    background:
      linear-gradient(90deg, rgba(120, 53, 15, 0.16), rgba(20, 20, 21, 0.96)),
      rgba(20, 20, 21, 0.96);
  }

  .rooting-team-copy {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .rooting-team-logo-wrap {
    width: 2.5rem;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    padding: 0.3rem;
    border-radius: 0.78rem;
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .rooting-team-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .rooting-team-text {
    min-width: 0;
  }

  .rooting-team-name {
    color: var(--mm-text);
    font-size: 0.98rem;
    font-weight: 700;
    line-height: 1.05;
  }

  .rooting-team-meta {
    margin-top: 0.18rem;
    color: var(--mm-muted);
    font-size: 0.77rem;
  }

  .rooting-team-count {
    flex-shrink: 0;
    min-width: 2.25rem;
    text-align: right;
    color: #fbbf24;
    font-size: 1rem;
    font-weight: 700;
  }

  .rooting-card-summary {
    padding-top: 0.15rem;
    text-align: center;
  }

  .rooting-summary-text {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .rooting-summary-text.is-must {
    color: #f87171;
  }

  .rooting-summary-text.is-favored {
    color: #f59e0b;
  }

  .rooting-summary-text.is-neutral {
    color: var(--mm-muted);
  }

  .rooting-empty-state,
  .rooting-guide-message {
    padding: 1.15rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 1rem;
    background: rgba(16, 16, 17, 0.95);
    color: var(--mm-muted);
    text-align: center;
  }

  .rooting-guide-accent {
    color: #f59e0b;
  }

  @media (min-width: 768px) {
    .rooting-guide-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1280px) {
    .rooting-guide-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 767px) {
    .rooting-guide-toolbar-row {
      align-items: stretch;
    }

    .rooting-guide-select,
    .rooting-guide-baseline {
      min-width: 0;
      width: 100%;
      flex-basis: 100%;
    }

    .rooting-guide-baseline {
      justify-content: flex-start;
    }
  }
</style>
