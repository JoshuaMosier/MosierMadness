<script lang="ts">
  export let data: any;

  const { winners, leaderboard, summary, seasonStandings, playerDirectory } = data;

  const topWinnersText = summary.topWinners.map((winner: any) => winner.name).join(', ');
  const completedWinners = [...winners.filter((winner: any) => winner.isChampionYear)].sort(
    (a: any, b: any) => b.year - a.year
  );

  const availableYears: number[] = Object.keys(seasonStandings)
    .map(Number)
    .sort((a, b) => b - a);

  let selectedTab: 'overview' | 'seasons' | 'players' = 'overview';
  let selectedYear: number | null = availableYears[0] || null;
  let playerSearch = '';
  let showAllPlayers = false;

  function getRankLabel(rank: number): string {
    const lastDigit = rank % 10;
    const lastTwoDigits = rank % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${rank}th`;
    }

    switch (lastDigit) {
      case 1:
        return `${rank}st`;
      case 2:
        return `${rank}nd`;
      case 3:
        return `${rank}rd`;
      default:
        return `${rank}th`;
    }
  }

  function getPlayerHref(slug: string | null): string {
    return slug ? `/players/${slug}` : '#';
  }

  function getPercentileLabel(value: number | null): string {
    return value === null ? '--' : `${value}%`;
  }

  function getBestFinishLabel(value: number | null): string {
    return value ? getRankLabel(value) : '--';
  }

  function getTrophyText(count: number): string {
    return '🏆'.repeat(Math.max(0, count));
  }

  function buildPodiumDisplay(rows: any[]): Array<{ standing: any; slot: 'left' | 'center' | 'right' }> {
    if (rows.length === 0) return [];

    const champion = rows.find((row) => row.rank === 1) || null;

    if (!champion) {
      const fallbackSlots: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
      return rows.slice(0, 3).map((standing, index) => ({
        standing,
        slot: fallbackSlots[index] || 'right'
      }));
    }

    const others = rows
      .filter((row) => row !== champion)
      .sort((a, b) => a.rank - b.rank);

    const display: Array<{ standing: any; slot: 'left' | 'center' | 'right' }> = [];

    if (others[0]) {
      display.push({ standing: others[0], slot: 'left' });
    }

    display.push({ standing: champion, slot: 'center' });

    if (others[1]) {
      display.push({ standing: others[1], slot: 'right' });
    }

    return display;
  }

  function handlePlayerSearchInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    playerSearch = target.value;

    if (!playerSearch.trim()) {
      showAllPlayers = false;
    }
  }

  $: currentStandings = selectedYear ? seasonStandings[selectedYear] || [] : [];
  $: selectedSeasonPodium = currentStandings.slice(0, 3);
  $: selectedSeasonPodiumDisplay = buildPodiumDisplay(selectedSeasonPodium);
  $: filteredPlayers = playerSearch.trim()
    ? playerDirectory.filter((player: any) =>
        player.name.toLowerCase().includes(playerSearch.trim().toLowerCase())
      )
    : playerDirectory;
  $: displayedPlayers =
    playerSearch.trim() || showAllPlayers ? filteredPlayers : filteredPlayers.slice(0, 24);
  $: hiddenPlayerCount = Math.max(filteredPlayers.length - displayedPlayers.length, 0);
</script>

<svelte:head>
  <title>Mosier Madness - Hall of Champions</title>
  <meta
    name="description"
    content="Mosier Madness champions, season archives, and historical player records."
  />
</svelte:head>

<div class="mm-page history-page">
  <div class="history-shell mm-shell">
    <section class="history-hero">
      <div class="history-hero-copy">
        <p class="history-kicker">Past Winners</p>
        <h1 class="history-title">Hall of Champions</h1>
        <p class="history-subtitle">
          Browse title history, revisit season standings, and search the Mosier Madness record book.
        </p>
      </div>

      <div class="history-summary-grid">
        <div class="history-stat-card">
          <span class="history-stat-label">Tournament Years</span>
          <strong class="history-stat-value">{summary.totalSeasons}</strong>
          <span class="history-stat-detail">{summary.completedTournaments} completed</span>
        </div>

        <div class="history-stat-card">
          <span class="history-stat-label">Unique Champions</span>
          <strong class="history-stat-value">{summary.uniqueChampions}</strong>
          <span class="history-stat-detail">Different winners across the archive</span>
        </div>

        <div class="history-stat-card">
          <span class="history-stat-label">Most Titles</span>
          <strong class="history-stat-value">{summary.maxWins}</strong>
          <span class="history-stat-detail">{topWinnersText}</span>
        </div>
      </div>
    </section>

    <div class="history-tab-row">
      <button
        class={`history-tab ${selectedTab === 'overview' ? 'is-active' : ''}`}
        on:click={() => (selectedTab = 'overview')}
      >
        Overview
      </button>
      <button
        class={`history-tab ${selectedTab === 'seasons' ? 'is-active' : ''}`}
        on:click={() => (selectedTab = 'seasons')}
      >
        Season Archive
      </button>
      <button
        class={`history-tab ${selectedTab === 'players' ? 'is-active' : ''}`}
        on:click={() => (selectedTab = 'players')}
      >
        Player Directory
      </button>
    </div>

    {#if selectedTab === 'overview'}
      <div class="history-overview-grid">
        <section class="history-panel">
          <div class="history-section-header">
            <div>
              <p class="history-section-kicker">Titles</p>
              <h2 class="history-section-title">Championship Leaderboard</h2>
            </div>
            <div class="history-section-tag">{leaderboard.length} champions</div>
          </div>

          <div class="history-title-list">
            {#each leaderboard as entry}
              <div class="history-title-row" class:is-top={entry.count === summary.maxWins}>
                <div class="history-title-main">
                  <span class="history-rank-pill">{getRankLabel(entry.rank)}</span>
                  <a class="history-name-pill" href={getPlayerHref(entry.slug)}>{entry.name}</a>
                </div>

                <div class="history-title-trophies" aria-label={`${entry.count} ${entry.count === 1 ? 'title' : 'titles'}`}>
                  <span class="history-title-trophy-icons">{getTrophyText(entry.count)}</span>
                  <span class="history-title-count">{entry.count}</span>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <section class="history-panel">
          <div class="history-section-header">
            <div>
              <p class="history-section-kicker">Champions</p>
              <h2 class="history-section-title">Season Archive</h2>
            </div>
            <div class="history-section-tag">{completedWinners.length} completed seasons</div>
          </div>

          <div class="history-table-shell history-table-shell--archive">
            <div class="history-table-scroll">
              <table class="history-table history-table--archive">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Champion</th>
                    <th>Score</th>
                    <th>Field</th>
                  </tr>
                </thead>
                <tbody>
                  {#each completedWinners as winner}
                    <tr>
                      <td class="history-table-year">
                        <div class="history-table-year-wrap">
                          <span class="history-champion-year">{winner.year}</span>
                        </div>
                      </td>
                      <td class="history-table-name">
                        {#if winner.slug}
                          <a class="history-name-pill history-name-pill--table" href={getPlayerHref(winner.slug)}>
                            {winner.name}
                          </a>
                        {:else}
                          <span class="history-name-pill history-name-pill--table is-static">{winner.name || '--'}</span>
                        {/if}
                      </td>
                      <td class="history-table-value">{winner.winningScore ?? '--'}</td>
                      <td class="history-table-value">{winner.fieldSize ?? '--'}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    {:else if selectedTab === 'seasons'}
      <section class="history-panel">
        <div class="history-section-header history-section-header--season">
          <div>
            <p class="history-section-kicker">Season Archive</p>
            <h2 class="history-section-title">Year-by-Year Standings</h2>
          </div>
        </div>

        <div class="history-season-showcase">
          <div class="history-season-selector-panel">
            <p class="history-section-kicker">Season Selector</p>
            <div class="history-season-year">{selectedYear ?? '--'}</div>
            <p class="history-season-selector-copy">
              Choose a tournament year to update the podium and full standings table.
            </p>

            <label class="history-select-shell history-select-shell--season">
              <span class="history-select-label">Select Season</span>
              <select bind:value={selectedYear} class="history-select">
                {#each availableYears as year}
                  <option value={year}>{year}</option>
                {/each}
              </select>
            </label>

          </div>

          <div class="history-podium-board">
            {#each selectedSeasonPodiumDisplay as item}
              <div class={`history-podium-column history-podium-column--${item.slot}`}>
                {#if item.standing.slug}
                  <a class="history-name-pill history-name-pill--podium" href={getPlayerHref(item.standing.slug)}>
                    {item.standing.name}
                  </a>
                {:else}
                  <span class="history-name-pill history-name-pill--podium is-static">{item.standing.name}</span>
                {/if}

                <div class="history-podium-step">
                  <span class="history-podium-position">{getRankLabel(item.standing.rank)}</span>
                  <div class="history-podium-step-details">
                    <span>{item.standing.totalPoints ?? '--'} pts</span>
                    <span>{item.standing.correctGames ?? '--'} games</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="history-table-shell">
          <div class="history-table-scroll">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Games</th>
                </tr>
              </thead>
              <tbody>
                {#each currentStandings as standing}
                  <tr class:champion-row={standing.rank === 1}>
                    <td>
                      <span class="history-rank-pill history-rank-pill--compact">{getRankLabel(standing.rank)}</span>
                    </td>
                    <td class="history-table-name">
                      {#if standing.slug}
                        <a class="history-name-pill history-name-pill--table" href={getPlayerHref(standing.slug)}>
                          {standing.name}
                        </a>
                      {:else}
                        <span class="history-name-pill history-name-pill--table is-static">{standing.name}</span>
                      {/if}
                    </td>
                    <td class="history-table-value">{standing.totalPoints ?? '--'}</td>
                    <td class="history-table-value">{standing.correctGames ?? '--'}</td>
                  </tr>
                {/each}

                {#if currentStandings.length === 0}
                  <tr>
                    <td class="history-table-empty" colspan="4">No archived standings for this season.</td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    {:else}
      <section class="history-panel">
        <div class="history-section-header history-section-header--players">
          <div>
            <p class="history-section-kicker">Players</p>
            <h2 class="history-section-title">Directory and Record Book</h2>
          </div>

          <div class="history-player-toolbar">
            <label class="history-search-shell">
              <span class="sr-only">Search players</span>
              <input
                type="text"
                value={playerSearch}
                on:input={handlePlayerSearchInput}
                placeholder="Search players"
                class="history-search"
              />
            </label>
            <div class="history-section-tag">{filteredPlayers.length} players</div>
          </div>
        </div>

        <div class="history-table-shell history-table-shell--players">
          <div class="history-table-scroll">
            <table class="history-table history-table--players">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Appearances</th>
                  <th>First Year</th>
                  <th>Most Recent</th>
                  <th>Titles</th>
                  <th>Pct</th>
                  <th>Best</th>
                </tr>
              </thead>
              <tbody>
                {#each displayedPlayers as player}
                  <tr class:champion-row={player.titles > 0}>
                    <td class="history-table-name">
                      <a class="history-name-pill history-name-pill--table" href={getPlayerHref(player.slug)}>
                        {player.name}
                      </a>
                    </td>
                    <td class="history-table-value">{player.appearances}</td>
                    <td class="history-table-value">{player.firstYear ?? '--'}</td>
                    <td class="history-table-value">{player.mostRecentYear ?? '--'}</td>
                    <td class="history-table-value">{player.titles}</td>
                    <td class="history-table-value">{getPercentileLabel(player.averagePercentile)}</td>
                    <td class="history-table-value">{getBestFinishLabel(player.bestFinish)}</td>
                  </tr>
                {/each}

                {#if displayedPlayers.length === 0}
                  <tr>
                    <td class="history-table-empty" colspan="7">No players match that search.</td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        </div>

        {#if hiddenPlayerCount > 0}
          <div class="history-player-actions">
            <button class="history-show-more" on:click={() => (showAllPlayers = true)}>
              Show {hiddenPlayerCount} More Players
            </button>
          </div>
        {/if}
      </section>
    {/if}
  </div>
</div>

<style>
  .history-page {
    width: min(100%, 86rem);
  }

  .history-shell {
    display: grid;
    gap: 1.15rem;
    padding: 1.25rem;
    overflow: hidden;
    background: rgba(10, 10, 11, 0.96);
  }

  .history-hero {
    display: grid;
    gap: 1.4rem;
    padding: 0.15rem 0 0.1rem;
    overflow: hidden;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .history-hero-copy {
    max-width: 42rem;
  }

  .history-kicker,
  .history-section-kicker {
    margin: 0;
    color: var(--mm-subtle);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .history-title {
    margin: 0.4rem 0 0;
    color: var(--mm-text);
    font-size: clamp(1.9rem, 3.4vw, 2.9rem);
    font-weight: 700;
    line-height: 1;
  }

  .history-subtitle {
    margin: 0.55rem 0 0;
    color: var(--mm-muted);
    font-size: 0.98rem;
    line-height: 1.5;
  }

  .history-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .history-stat-card,
  .history-panel,
  .history-season-selector-panel,
  .history-podium-board {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(14, 14, 15, 0.9);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .history-stat-card {
    display: grid;
    gap: 0.25rem;
    padding: 1rem 1.1rem;
    border-radius: 1rem;
  }

  .history-stat-label {
    color: var(--mm-muted);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .history-stat-value {
    color: var(--mm-text);
    font-size: clamp(1.7rem, 4vw, 2.45rem);
    font-weight: 700;
    line-height: 1;
  }

  .history-stat-detail {
    color: var(--mm-subtle);
    font-size: 0.88rem;
  }

  .history-tab-row {
    display: flex;
    gap: 0.55rem;
    padding: 0;
    overflow-x: auto;
  }

  .history-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.4rem;
    padding: 0.45rem 0.95rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.03);
    color: var(--mm-muted);
    font-size: 0.84rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
  }

  .history-tab:hover {
    color: var(--mm-text);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.16);
  }

  .history-tab.is-active {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(245, 158, 11, 0.08);
  }

  .history-overview-grid {
    display: grid;
    grid-template-columns: 0.92fr 1.08fr;
    gap: 1rem;
  }

  .history-panel {
    padding: 1.15rem;
    border-radius: 1.35rem;
    overflow: hidden;
  }

  .history-section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .history-section-title {
    margin: 0.34rem 0 0;
    color: var(--mm-text);
    font-size: clamp(1.35rem, 2.4vw, 1.8rem);
    font-weight: 700;
    line-height: 1.05;
  }

  .history-section-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.42rem 0.78rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-muted);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .history-title-list {
    display: grid;
    gap: 0.82rem;
  }

  .history-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.9rem;
    padding: 0.9rem 0.95rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.018);
  }

  .history-title-row.is-top {
    border-color: rgba(245, 158, 11, 0.22);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.12), rgba(255, 255, 255, 0.02));
  }

  .history-title-main {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-width: 0;
    flex: 1 1 auto;
  }

  .history-rank-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 4rem;
    padding: 0.38rem 0.78rem;
    border-radius: 999px;
    border: 1px solid rgba(245, 158, 11, 0.22);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.16), rgba(180, 83, 9, 0.08));
    color: #fcd34d;
    font-size: 0.92rem;
    font-weight: 700;
    line-height: 1;
  }

  .history-rank-pill--compact {
    min-width: 3.45rem;
    padding: 0.32rem 0.58rem;
    font-size: 0.8rem;
  }

  .history-name-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    max-width: 100%;
    padding: 0.38rem 0.9rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-text);
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
  }

  .history-name-pill:hover {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.05);
  }

  .history-name-pill.is-static {
    cursor: default;
  }

  .history-name-pill--wide,
  .history-name-pill--feature,
  .history-name-pill--table {
    width: min(100%, 100%);
  }

  .history-name-pill--feature {
    justify-content: flex-start;
    padding: 0.58rem 1rem;
    font-size: 1.08rem;
  }

  .history-name-pill--table {
    justify-content: center;
  }

  .history-title-trophies {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.7rem;
    flex: 0 0 auto;
  }

  .history-title-trophy-icons {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.18rem;
    max-width: 14rem;
    color: #fcd34d;
    font-size: 1.02rem;
    line-height: 1;
    text-align: right;
  }

  .history-title-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.15rem;
    min-height: 2.15rem;
    padding: 0 0.55rem;
    border-radius: 999px;
    border: 1px solid rgba(245, 158, 11, 0.18);
    background: rgba(245, 158, 11, 0.1);
    color: var(--mm-text);
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .history-table-year-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .history-champion-year {
    color: var(--mm-text);
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1;
  }

  .history-section-header--season,
  .history-section-header--players {
    margin-bottom: 1.2rem;
  }

  .history-select-shell,
  .history-search-shell {
    display: grid;
    gap: 0.32rem;
  }

  .history-select-shell {
    min-width: 13rem;
    padding: 0.7rem;
    border: 1px solid rgba(245, 158, 11, 0.18);
    border-radius: 1rem;
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.12), rgba(255, 255, 255, 0.03));
  }

  .history-select-label {
    color: #fcd34d;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .history-select,
  .history-search {
    min-height: 2.8rem;
    padding: 0.7rem 0.95rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.95rem;
    background: rgba(255, 255, 255, 0.035);
    color: var(--mm-text);
    font-size: 0.95rem;
  }

  .history-select {
    min-height: 3.05rem;
    border-color: rgba(245, 158, 11, 0.18);
    background: rgba(10, 10, 11, 0.92);
    font-weight: 700;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
    cursor: pointer;
  }

  .history-select option {
    background: #101114;
    color: #f5f7fb;
  }

  .history-select:focus-visible,
  .history-search:focus-visible {
    outline: none;
    border-color: rgba(245, 158, 11, 0.28);
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
  }

  .history-season-showcase {
    display: grid;
    grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.28fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .history-season-selector-panel,
  .history-podium-board {
    padding: 1rem;
    border-radius: 1rem;
  }

  .history-season-selector-panel {
    display: grid;
    align-content: start;
    gap: 0.9rem;
  }

  .history-season-year {
    color: var(--mm-text);
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 700;
    line-height: 1;
  }

  .history-season-selector-copy {
    margin: 0;
    color: var(--mm-muted);
    font-size: 0.92rem;
    line-height: 1.45;
  }

  .history-select-shell--season {
    border-color: rgba(245, 158, 11, 0.28);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.16), rgba(255, 255, 255, 0.04));
  }

  .history-select-shell--season .history-select {
    min-height: 3.25rem;
    padding-right: 1.2rem;
    font-size: 1.02rem;
  }

  .history-podium-board {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
    gap: 0.75rem;
  }

  .history-name-pill--podium {
    width: 100%;
    min-height: 3rem;
    padding-inline: 0.7rem;
    font-size: 0.92rem;
  }

  .history-podium-column {
    display: grid;
    align-content: end;
    gap: 0.55rem;
  }

  .history-podium-column--center {
    order: 2;
  }

  .history-podium-column--left {
    order: 1;
  }

  .history-podium-column--right {
    order: 3;
  }

  .history-podium-step {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 0.55rem;
    padding: 0.8rem 0.65rem;
    border-radius: 1rem 1rem 0.8rem 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    text-align: center;
  }

  .history-podium-column--center .history-podium-step {
    min-height: 10rem;
    border-color: rgba(245, 158, 11, 0.24);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.2), rgba(180, 83, 9, 0.18));
  }

  .history-podium-column--left .history-podium-step {
    min-height: 8rem;
    border-color: rgba(148, 163, 184, 0.18);
    background: linear-gradient(180deg, rgba(148, 163, 184, 0.18), rgba(71, 85, 105, 0.14));
  }

  .history-podium-column--right .history-podium-step {
    min-height: 6.5rem;
    border-color: rgba(180, 83, 9, 0.2);
    background: linear-gradient(180deg, rgba(180, 83, 9, 0.2), rgba(120, 53, 15, 0.15));
  }

  .history-podium-position {
    color: var(--mm-text);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .history-podium-step-details {
    display: grid;
    gap: 0.18rem;
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 700;
  }

  .history-table-shell--archive .history-table {
    min-width: 0;
    table-layout: auto;
  }

  .history-table-shell--players .history-table {
    min-width: 48rem;
  }

  .history-table-shell {
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(12, 12, 13, 0.9);
  }

  .history-table-scroll {
    overflow-x: auto;
  }

  .history-table {
    width: 100%;
    min-width: 40rem;
    border-collapse: separate;
    border-spacing: 0;
  }

  .history-table thead th {
    padding: 0.9rem 0.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(20, 20, 21, 0.94);
    color: var(--mm-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-align: center;
    text-transform: uppercase;
  }

  .history-table tbody tr:nth-child(odd) {
    background: rgba(255, 255, 255, 0.018);
  }

  .history-table tbody tr.champion-row,
  .history-table tbody tr.champion-row:nth-child(odd) {
    background: linear-gradient(90deg, rgba(180, 83, 9, 0.24), rgba(245, 158, 11, 0.08) 40%, rgba(255, 255, 255, 0.018));
  }

  .history-table td {
    padding: 0.52rem 0.8rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    vertical-align: middle;
  }

  .history-table td:first-child,
  .history-table th:first-child {
    padding-left: 1rem;
  }

  .history-table td:last-child,
  .history-table th:last-child {
    padding-right: 1rem;
  }

  .history-table-name {
    text-align: center;
    min-width: 15rem;
  }

  .history-table--archive .history-table-name {
    min-width: 0;
    width: 54%;
  }

  .history-table--archive .history-name-pill--table {
    width: 100%;
  }

  .history-table--archive .history-table-year {
    width: 6.5rem;
  }

  .history-table--archive th:nth-child(3),
  .history-table--archive td:nth-child(3),
  .history-table--archive th:nth-child(4),
  .history-table--archive td:nth-child(4) {
    width: 5.25rem;
  }

  .history-table-year {
    min-width: 8rem;
    text-align: center;
  }

  .history-table-value {
    color: var(--mm-text);
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
  }

  .history-table-empty {
    padding: 1.2rem;
    color: var(--mm-subtle);
    text-align: center;
  }

  .history-player-toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .history-search-shell {
    min-width: min(22rem, 100%);
  }

  .history-player-actions {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }

  .history-show-more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.6rem;
    padding: 0.55rem 1rem;
    border-radius: 999px;
    border: 1px solid rgba(245, 158, 11, 0.22);
    background: rgba(245, 158, 11, 0.08);
    color: #fcd34d;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 1100px) {
    .history-overview-grid,
    .history-season-showcase {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 767px) {
    .history-page {
      gap: 1rem;
    }

    .history-shell,
    .history-panel {
      padding: 1rem;
    }

    .history-hero {
      padding: 0;
    }

    .history-subtitle {
      font-size: 0.93rem;
    }

    .history-summary-grid,
    .history-tab-row {
      flex-direction: column;
      overflow: visible;
      padding: 0;
    }

    .history-tab {
      width: 100%;
    }

    .history-section-header,
    .history-player-toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .history-title-row {
      align-items: flex-start;
      flex-direction: column;
    }

    .history-title-main {
      width: 100%;
    }

    .history-rank-pill {
      width: fit-content;
    }

    .history-title-trophies {
      width: 100%;
      justify-content: space-between;
    }

    .history-title-trophy-icons {
      max-width: none;
      justify-content: flex-start;
      text-align: left;
    }

    .history-title-count {
      font-size: 0.8rem;
    }

    .history-podium-board {
      gap: 0.5rem;
      padding: 0.8rem 0.7rem;
    }

    .history-name-pill--podium {
      min-height: 2.55rem;
      font-size: 0.82rem;
      padding-inline: 0.45rem;
    }

    .history-podium-column--center .history-podium-step {
      min-height: 7.8rem;
    }

    .history-podium-column--left .history-podium-step {
      min-height: 6.2rem;
    }

    .history-podium-column--right .history-podium-step {
      min-height: 5.1rem;
    }

    .history-podium-step {
      padding: 0.65rem 0.45rem;
    }

    .history-podium-position {
      font-size: 0.8rem;
    }

    .history-podium-step-details {
      font-size: 0.75rem;
    }

    .history-table {
      min-width: 33rem;
    }

    .history-table-name {
      min-width: 12rem;
    }

    .history-search-shell {
      min-width: 100%;
    }
  }
</style>
