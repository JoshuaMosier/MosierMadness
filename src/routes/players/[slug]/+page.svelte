<script lang="ts">
  export let data: any;

  const { person, aliases, titleYears, yearlyResults, summary } = data;
</script>

<svelte:head>
  <title>Mosier Madness - {person.displayName}</title>
  <meta
    name="description"
    content={`Historical Mosier Madness profile for ${person.displayName}, including titles, placements, and yearly results.`}
  />
</svelte:head>

<div class="mm-page player-page">
  <div class="player-shell mm-shell mm-page-shell">
    <section class="player-hero mm-page-hero">
      <div class="player-hero-copy mm-page-hero-copy">
        <a class="player-back-link" href="/past-winners">Back to Hall of Champions</a>
        <h1 class="player-title mm-page-title">{person.displayName}</h1>
        <p class="player-subtitle mm-page-subtitle">
          Historical profile pages focus on legacy tournament results, titles, aliases, and year-by-year finishes.
        </p>
      </div>
    </section>

    <section class="player-summary-grid">
      <div class="player-stat-card mm-stat-card">
        <span class="player-stat-label mm-stat-label">Titles</span>
        <strong class="player-stat-value mm-stat-value">{summary.titles}</strong>
      </div>
      <div class="player-stat-card mm-stat-card">
        <span class="player-stat-label mm-stat-label">Appearances</span>
        <strong class="player-stat-value mm-stat-value">{summary.appearances}</strong>
      </div>
      <div class="player-stat-card mm-stat-card">
        <span class="player-stat-label mm-stat-label">Avg Pctile</span>
        <strong class="player-stat-value mm-stat-value">{summary.averagePercentile ? `${summary.averagePercentile}%` : 'N/A'}</strong>
      </div>
      <div class="player-stat-card mm-stat-card">
        <span class="player-stat-label mm-stat-label">Avg Finish</span>
        <strong class="player-stat-value mm-stat-value">{summary.averageFinish || 'N/A'}</strong>
      </div>
      <div class="player-stat-card mm-stat-card">
        <span class="player-stat-label mm-stat-label">Best Finish</span>
        <strong class="player-stat-value mm-stat-value">{summary.bestFinish || 'N/A'}</strong>
      </div>
      <div class="player-stat-card mm-stat-card">
        <span class="player-stat-label mm-stat-label">Avg Score</span>
        <strong class="player-stat-value mm-stat-value">{summary.averageScore || 'N/A'}</strong>
      </div>
      <div class="player-stat-card mm-stat-card">
        <span class="player-stat-label mm-stat-label">Best Score</span>
        <strong class="player-stat-value mm-stat-value">{summary.bestScore || 'N/A'}</strong>
      </div>
    </section>

    <section class="player-meta-grid">
      <div class="player-panel mm-panel-surface">
        <div class="player-panel-header mm-panel-header-inline">
          <div>
            <p class="player-section-kicker mm-eyebrow">Titles</p>
            <h2 class="player-section-title mm-panel-title">Championship Years</h2>
          </div>
        </div>

        {#if titleYears.length}
          <div class="player-chip-row mm-chip-row">
            {#each titleYears as year}
              <span class="player-chip player-chip--gold mm-pill">{year}</span>
            {/each}
          </div>
        {:else}
          <p class="player-empty-copy mm-empty-copy">No titles recorded.</p>
        {/if}
      </div>

      <div class="player-panel mm-panel-surface">
        <div class="player-panel-header mm-panel-header-inline">
          <div>
            <p class="player-section-kicker mm-eyebrow">Archive</p>
            <h2 class="player-section-title mm-panel-title">Known Aliases</h2>
          </div>
        </div>

        {#if aliases.length}
          <div class="player-chip-row mm-chip-row">
            {#each aliases as alias}
              <span class="player-chip mm-pill">{alias}</span>
            {/each}
          </div>
        {:else}
          <p class="player-empty-copy mm-empty-copy">No alternate names recorded.</p>
        {/if}
      </div>
    </section>

    <section class="player-results-shell mm-table-shell">
      <div class="player-results-header">
        <div>
          <p class="player-section-kicker mm-eyebrow">Archive</p>
          <h2 class="player-section-title mm-panel-title">Year-by-Year Results</h2>
        </div>
      </div>

      <div class="player-results-table-wrap mm-data-table-scroll">
        <table class="player-results-table mm-data-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Result</th>
              <th>Rank</th>
              <th>Pctile</th>
              <th>Score</th>
              <th>Games</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {#each yearlyResults as result}
              <tr>
                <td class="player-results-year">{result.year}</td>
                <td>
                  <span class="player-result-pill" class:player-result-pill--champion={result.champion}>
                    {#if result.champion}
                      Champion
                    {:else}
                      Entrant
                    {/if}
                  </span>
                </td>
                <td>{result.finalRank ? `${result.finalRank} / ${result.fieldSize || '?'}` : '-'}</td>
                <td>{result.percentile !== null && result.percentile !== undefined ? `${Math.round(result.percentile)}%` : '-'}</td>
                <td>{result.totalPoints ?? '-'}</td>
                <td>{result.correctGames ?? '-'}</td>
                <td class="player-results-notes">{result.notes || '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </div>
</div>

<style>
  .player-shell {
    padding: 1.35rem;
  }

  .player-hero {
    padding-bottom: 0.15rem;
  }

  .player-hero-copy {
    max-width: 44rem;
  }

  .player-back-link {
    display: inline-flex;
    align-items: center;
    color: #fbbf24;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: color 160ms ease;
  }

  .player-back-link:hover {
    color: #fde68a;
  }

  .player-title {
    margin-top: 0.55rem;
    font-size: clamp(2.1rem, 4vw, 3.25rem);
    line-height: 0.98;
  }

  .player-subtitle {
    margin-top: 0.75rem;
    max-width: 42rem;
  }

  .player-summary-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .player-stat-card {
    gap: 0.32rem;
  }

  .player-stat-label {
    letter-spacing: 0.16em;
  }

  .player-stat-value {
    color: #f8d27b;
    font-size: clamp(1.85rem, 3vw, 2.4rem);
  }

  .player-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .player-panel {
    display: grid;
    gap: 0.95rem;
  }

  .player-results-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .player-section-title {
    font-size: clamp(1.35rem, 2.5vw, 1.9rem);
  }

  .player-chip {
    font-size: 0.92rem;
  }

  .player-chip--gold {
    border-color: rgba(245, 158, 11, 0.24);
    background: rgba(245, 158, 11, 0.1);
    color: #fcd34d;
  }

  .player-results-shell {
    overflow: hidden;
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(11, 11, 12, 0.96);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .player-results-shell::before {
    display: none;
  }

  .player-results-header {
    padding: 1.2rem 1.25rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.025);
  }

  .player-results-table {
    min-width: 820px;
    table-layout: fixed;
  }

  .player-results-table td {
    color: var(--mm-muted);
    font-size: 0.95rem;
    line-height: 1.4;
    vertical-align: top;
  }

  .player-results-year {
    color: var(--mm-text);
    font-weight: 600;
  }

  .player-result-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2rem;
    padding: 0.34rem 0.78rem;
    border-radius: 999px;
    color: var(--mm-text);
    font-size: 0.86rem;
    font-weight: 600;
    line-height: 1.1;
  }

  .player-result-pill--champion {
    border: 1px solid rgba(245, 158, 11, 0.24);
    background: rgba(245, 158, 11, 0.1);
    color: #fcd34d;
  }

  .player-results-notes {
    color: var(--mm-subtle);
    white-space: normal;
    word-break: break-word;
  }

  @media (max-width: 1279px) {
    .player-summary-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .player-shell {
      gap: 1rem;
      padding: 1rem;
    }

    .player-summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .player-meta-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .player-page {
      padding-top: 1rem;
    }

    .player-shell {
      padding: 0.95rem;
      border-radius: 24px;
    }

    .player-title {
      font-size: 2.15rem;
    }

    .player-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .player-stat-card,
    .player-panel {
      padding: 0.95rem;
    }

    .player-results-header {
      padding: 0.95rem 1rem 0.9rem;
    }

    .player-results-table th,
    .player-results-table td {
      padding-left: 0.88rem;
      padding-right: 0.88rem;
    }
  }
</style>

