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
  <div class="stats-shell mm-shell mm-page-shell">
    <section class="stats-hero mm-page-hero">
      <div class="stats-hero-copy mm-page-hero-copy">
        <h1 class="stats-title mm-page-title">Tournament Record Book</h1>
      </div>

      <div class="stats-summary-grid">
        <div class="stats-stat-card mm-stat-card">
          <span class="stats-stat-label mm-stat-label">Completed Tournaments</span>
          <strong class="stats-stat-value mm-stat-value">{summary.completedTournamentCount}</strong>
        </div>

        <div class="stats-stat-card mm-stat-card">
          <span class="stats-stat-label mm-stat-label">Most Games Correct</span>
          <strong class="stats-stat-value mm-stat-value">{mostGamesRecord?.stat || 'N/A'}</strong>
          {#if mostGamesRecord}
            <a class="stats-name-pill stats-name-pill--summary mm-pill-link" href={getPlayerHref(mostGamesRecord.slug)}>
              {mostGamesRecord.participant}
            </a>
          {/if}
        </div>

        <div class="stats-stat-card mm-stat-card">
          <span class="stats-stat-label mm-stat-label">Highest Score</span>
          <strong class="stats-stat-value mm-stat-value">{highestScoreRecord?.stat || 'N/A'}</strong>
          {#if highestScoreRecord}
            <a class="stats-name-pill stats-name-pill--summary mm-pill-link" href={getPlayerHref(highestScoreRecord.slug)}>
              {highestScoreRecord.participant}
            </a>
          {/if}
        </div>

        <div class="stats-stat-card mm-stat-card">
          <span class="stats-stat-label mm-stat-label">Best Avg %</span>
          <strong class="stats-stat-value mm-stat-value">{bestAveragePercentileRecord?.stat || 'N/A'}</strong>
          {#if bestAveragePercentileRecord}
            <a class="stats-name-pill stats-name-pill--summary mm-pill-link" href={getPlayerHref(bestAveragePercentileRecord.slug)}>
              {bestAveragePercentileRecord.participant}
            </a>
          {/if}
        </div>
      </div>
    </section>

    <section class="stats-tab-row mm-tab-row" aria-label="Stats view">
      <button
        type="button"
        class="stats-tab mm-tab"
        class:is-active={selectedTab === 'overview'}
        on:click={() => (selectedTab = 'overview')}
      >
        Overview
      </button>
      <button
        type="button"
        class="stats-tab mm-tab"
        class:is-active={selectedTab === 'rounds'}
        on:click={() => (selectedTab = 'rounds')}
      >
        Round Records
      </button>
    </section>

    {#if selectedTab === 'overview'}
      <div class="stats-overview-grid">
        <section class="stats-panel mm-panel-surface">
          <div class="stats-section-header mm-panel-header-inline">
            <div>
              <p class="stats-section-kicker mm-eyebrow">Consistency</p>
              <h2 class="stats-section-title mm-panel-title">Best Average Percentile</h2>
            </div>
            <span class="stats-section-tag mm-section-tag">3+ seasons</span>
          </div>

          <section class="stats-mini-board mm-panel-surface">
            <div class="stats-list">
              {#if !bestAveragePercentileCategory || bestAveragePercentileCategory.records.length === 0}
                <p class="stats-empty-copy mm-empty-copy">No records available.</p>
              {:else}
                {#each bestAveragePercentileCategory.records.slice(0, 5) as record, index}
                  <div class:stats-list-row={true} class:is-top={index === 0}>
                    <span class="stats-rank-pill mm-rank-pill">{index + 1}</span>
                    <a class="stats-name-pill mm-pill-link" href={getPlayerHref(record.slug)}>{record.participant}</a>
                    <span class="stats-record-value">{record.stat}</span>
                  </div>
                {/each}
              {/if}
            </div>
          </section>
        </section>

        <section class="stats-panel mm-panel-surface">
          <div class="stats-section-header mm-panel-header-inline">
            <div>
              <p class="stats-section-kicker mm-eyebrow">Consistency</p>
              <h2 class="stats-section-title mm-panel-title">Best Average Placement</h2>
            </div>
            <span class="stats-section-tag mm-section-tag">3+ seasons</span>
          </div>

          <section class="stats-mini-board mm-panel-surface">
            <div class="stats-list">
              {#if !bestAveragePlacementCategory || bestAveragePlacementCategory.records.length === 0}
                <p class="stats-empty-copy mm-empty-copy">No records available.</p>
              {:else}
                {#each bestAveragePlacementCategory.records.slice(0, 5) as record, index}
                  <div class:stats-list-row={true} class:is-top={index === 0}>
                    <span class="stats-rank-pill mm-rank-pill">{index + 1}</span>
                    <a class="stats-name-pill mm-pill-link" href={getPlayerHref(record.slug)}>{record.participant}</a>
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
          <section class="stats-panel mm-panel-surface">
            <div class="stats-section-header mm-panel-header-inline">
              <div>
                <h2 class="stats-section-title stats-section-title--compact mm-panel-title">{category.category}</h2>
              </div>
              <span class="stats-section-tag mm-section-tag">{category.records.length} entries</span>
            </div>

            <div class="stats-list">
              {#if category.records.length === 0}
                <p class="stats-empty-copy mm-empty-copy">No records available.</p>
              {:else}
                {#each category.records as record, index}
                  <div class:stats-list-row={true} class:is-top={index === 0}>
                    <span class="stats-rank-pill mm-rank-pill">{index + 1}</span>
                    <a class="stats-name-pill mm-pill-link" href={getPlayerHref(record.slug)}>{record.participant}</a>
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
  .stats-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.9rem;
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

  .stats-section-title--compact {
    font-size: clamp(1.1rem, 2vw, 1.45rem);
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
