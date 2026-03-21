<script lang="ts">
  export let data: any;

  const { categories, summary } = data;

  const bestAveragePercentileTitle = 'Best Average Percentile (3+ Years)';
  const bestAveragePlacementTitle = 'Best Average Placement (3+ Years)';

  const roundCategories = categories.filter((category: any) =>
    category.category.startsWith('Most Games ')
  );
  const bestAveragePercentileCategory =
    categories.find((category: any) => category.category === bestAveragePercentileTitle) || null;
  const bestAveragePlacementCategory =
    categories.find((category: any) => category.category === bestAveragePlacementTitle) || null;

  let selectedTab: 'overview' | 'rounds' = 'overview';

  function getPlayerHref(slug: string | null): string {
    return slug ? `/players/${slug}` : '#';
  }

  const mostGamesRecord = summary.mostGamesCorrect || null;
  const highestScoreRecord = summary.highestScore || null;
  const bestAveragePercentileRecord = bestAveragePercentileCategory?.records?.[0] || null;
</script>

<svelte:head>
  <title>Mosier Madness - Statistics</title>
  <meta
    name="description"
    content="Mosier Madness record book with round records, best average percentile, and best average placement leaders."
  />
</svelte:head>

<div class="mm-page stats-page">
  <div class="stats-shell mm-shell">
    <section class="stats-hero">
      <div class="stats-hero-copy">
        <p class="stats-kicker">Statistics</p>
        <h1 class="stats-title">Tournament Record Book</h1>
        <p class="stats-subtitle">
          Browse round-by-round records and percentile-based finish leaders from every Mosier Madness archive season.
        </p>
      </div>

      <div class="stats-summary-grid">
        <div class="stats-stat-card">
          <span class="stats-stat-label">Completed Tournaments</span>
          <strong class="stats-stat-value">{summary.completedTournamentCount}</strong>
        </div>

        <div class="stats-stat-card">
          <span class="stats-stat-label">Most Games Correct</span>
          <strong class="stats-stat-value">{mostGamesRecord?.stat || 'N/A'}</strong>
          {#if mostGamesRecord}
            <a class="stats-name-pill stats-name-pill--summary" href={getPlayerHref(mostGamesRecord.slug)}>
              {mostGamesRecord.participant}
            </a>
          {/if}
        </div>

        <div class="stats-stat-card">
          <span class="stats-stat-label">Highest Score</span>
          <strong class="stats-stat-value">{highestScoreRecord?.stat || 'N/A'}</strong>
          {#if highestScoreRecord}
            <a class="stats-name-pill stats-name-pill--summary" href={getPlayerHref(highestScoreRecord.slug)}>
              {highestScoreRecord.participant}
            </a>
          {/if}
        </div>

        <div class="stats-stat-card">
          <span class="stats-stat-label">Best Avg %</span>
          <strong class="stats-stat-value">{bestAveragePercentileRecord?.stat || 'N/A'}</strong>
          {#if bestAveragePercentileRecord}
            <a class="stats-name-pill stats-name-pill--summary" href={getPlayerHref(bestAveragePercentileRecord.slug)}>
              {bestAveragePercentileRecord.participant}
            </a>
          {/if}
        </div>
      </div>
    </section>

    <section class="stats-tab-row" aria-label="Stats view">
      <button
        type="button"
        class:stats-tab={true}
        class:is-active={selectedTab === 'overview'}
        on:click={() => (selectedTab = 'overview')}
      >
        Overview
      </button>
      <button
        type="button"
        class:stats-tab={true}
        class:is-active={selectedTab === 'rounds'}
        on:click={() => (selectedTab = 'rounds')}
      >
        Round Records
      </button>
    </section>

    {#if selectedTab === 'overview'}
      <div class="stats-overview-grid">
        <section class="stats-panel">
          <div class="stats-section-header">
            <div>
              <p class="stats-section-kicker">Consistency</p>
              <h2 class="stats-section-title">Best Average Percentile</h2>
            </div>
            <span class="stats-section-tag">3+ seasons</span>
          </div>

          <section class="stats-mini-board">
            <div class="stats-list">
              {#if !bestAveragePercentileCategory || bestAveragePercentileCategory.records.length === 0}
                <p class="stats-empty-copy">No records available.</p>
              {:else}
                {#each bestAveragePercentileCategory.records.slice(0, 5) as record, index}
                  <div class:stats-list-row={true} class:is-top={index === 0}>
                    <span class="stats-rank-pill">{index + 1}</span>
                    <a class="stats-name-pill" href={getPlayerHref(record.slug)}>{record.participant}</a>
                    <span class="stats-record-value">{record.stat}</span>
                  </div>
                {/each}
              {/if}
            </div>
          </section>
        </section>

        <section class="stats-panel">
          <div class="stats-section-header">
            <div>
              <p class="stats-section-kicker">Consistency</p>
              <h2 class="stats-section-title">Best Average Placement</h2>
            </div>
            <span class="stats-section-tag">3+ seasons</span>
          </div>

          <section class="stats-mini-board">
            <div class="stats-list">
              {#if !bestAveragePlacementCategory || bestAveragePlacementCategory.records.length === 0}
                <p class="stats-empty-copy">No records available.</p>
              {:else}
                {#each bestAveragePlacementCategory.records.slice(0, 5) as record, index}
                  <div class:stats-list-row={true} class:is-top={index === 0}>
                    <span class="stats-rank-pill">{index + 1}</span>
                    <a class="stats-name-pill" href={getPlayerHref(record.slug)}>{record.participant}</a>
                    <span class="stats-record-value">{record.stat}</span>
                  </div>
                {/each}
              {/if}
            </div>
          </section>
        </section>
      </div>
    {:else}
      <div class="stats-module-grid">
        {#each roundCategories as category}
          <section class="stats-panel">
            <div class="stats-section-header">
              <div>
                <p class="stats-section-kicker">Round Record</p>
                <h2 class="stats-section-title stats-section-title--compact">{category.category}</h2>
              </div>
              <span class="stats-section-tag">{category.records.length} entries</span>
            </div>

            <div class="stats-list">
              {#if category.records.length === 0}
                <p class="stats-empty-copy">No records available.</p>
              {:else}
                {#each category.records as record, index}
                  <div class:stats-list-row={true} class:is-top={index === 0}>
                    <span class="stats-rank-pill">{index + 1}</span>
                    <a class="stats-name-pill" href={getPlayerHref(record.slug)}>{record.participant}</a>
                    <span class="stats-record-value">{record.stat}</span>
                  </div>
                {/each}
              {/if}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .stats-shell {
    display: grid;
    gap: 1.15rem;
    padding: 1.25rem;
    overflow: hidden;
    background: rgba(10, 10, 11, 0.96);
  }

  .stats-hero {
    display: grid;
    gap: 1.35rem;
    padding: 0.15rem 0 0.1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .stats-hero-copy {
    max-width: 42rem;
  }

  .stats-kicker,
  .stats-section-kicker {
    margin: 0;
    color: var(--mm-subtle);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .stats-title {
    margin: 0.4rem 0 0;
    color: var(--mm-text);
    font-size: clamp(1.95rem, 3.5vw, 3rem);
    font-weight: 700;
    line-height: 1;
  }

  .stats-subtitle {
    margin: 0.55rem 0 0;
    color: var(--mm-muted);
    font-size: 0.98rem;
    line-height: 1.55;
  }

  .stats-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .stats-stat-card,
  .stats-panel,
  .stats-mini-board {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(14, 14, 15, 0.9);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .stats-stat-card {
    display: grid;
    gap: 0.45rem;
    padding: 1rem 1.1rem;
    border-radius: 1rem;
    align-content: start;
  }

  .stats-stat-label {
    color: var(--mm-muted);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .stats-stat-value {
    color: var(--mm-text);
    font-size: clamp(1.7rem, 4vw, 2.45rem);
    font-weight: 700;
    line-height: 1;
  }

  .stats-tab-row {
    display: flex;
    gap: 0.55rem;
    overflow-x: auto;
  }

  .stats-tab {
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

  .stats-tab:hover {
    color: var(--mm-text);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.16);
  }

  .stats-tab.is-active {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(245, 158, 11, 0.08);
  }

  .stats-overview-grid,
  .stats-module-grid {
    display: grid;
    gap: 1rem;
  }

  .stats-overview-grid,
  .stats-module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stats-panel {
    padding: 1.15rem;
    border-radius: 1.35rem;
    overflow: hidden;
  }

  .stats-section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .stats-section-title {
    margin: 0.34rem 0 0;
    color: var(--mm-text);
    font-size: clamp(1.35rem, 2.4vw, 1.82rem);
    font-weight: 700;
    line-height: 1.05;
  }

  .stats-section-title--compact {
    font-size: clamp(1.1rem, 2vw, 1.45rem);
  }

  .stats-section-tag {
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

  .stats-mini-board {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 1rem;
  }

  .stats-list {
    display: grid;
    gap: 0.55rem;
  }

  .stats-list-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.65rem;
    padding: 0.7rem 0.75rem;
    border-radius: 0.95rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
  }

  .stats-list-row.is-top {
    border-color: rgba(245, 158, 11, 0.18);
    background: rgba(245, 158, 11, 0.08);
  }

  .stats-rank-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.15rem;
    height: 2.15rem;
    padding: 0 0.55rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 700;
    line-height: 1;
  }

  .stats-name-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    max-width: 100%;
    min-height: 2.15rem;
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

  .stats-name-pill:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .stats-name-pill--summary {
    width: fit-content;
    max-width: 100%;
  }

  .stats-record-value {
    color: var(--mm-text);
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.2;
    text-align: right;
  }

  .stats-empty-copy {
    margin: 0;
    color: var(--mm-muted);
    font-size: 0.95rem;
    line-height: 1.45;
  }

  @media (max-width: 1080px) {
    .stats-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .stats-overview-grid,
    .stats-module-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .stats-shell {
      padding: 1rem;
      gap: 1rem;
    }

    .stats-tab-row {
      flex-direction: column;
    }

    .stats-tab {
      width: 100%;
    }
  }

  @media (max-width: 560px) {
    .stats-page {
      padding-top: 1rem;
    }

    .stats-shell {
      padding: 0.95rem;
      border-radius: 24px;
    }

    .stats-summary-grid {
      grid-template-columns: 1fr;
    }

    .stats-panel,
    .stats-mini-board {
      padding: 0.95rem;
    }

    .stats-list-row {
      padding: 0.65rem;
      grid-template-columns: auto minmax(0, 1fr);
    }

    .stats-record-value {
      justify-self: end;
    }
  }
</style>
