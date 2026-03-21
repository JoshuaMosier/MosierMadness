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
  <div class="player-shell mm-shell">
    <section class="player-hero">
      <div class="player-hero-copy">
        <a class="player-back-link" href="/past-winners">Back to Hall of Champions</a>
        <h1 class="player-title">{person.displayName}</h1>
        <p class="player-subtitle">
          Historical profile pages focus on legacy tournament results, titles, aliases, and year-by-year finishes.
        </p>
      </div>
    </section>

    <section class="player-summary-grid">
      <div class="player-stat-card">
        <span class="player-stat-label">Titles</span>
        <strong class="player-stat-value">{summary.titles}</strong>
      </div>
      <div class="player-stat-card">
        <span class="player-stat-label">Appearances</span>
        <strong class="player-stat-value">{summary.appearances}</strong>
      </div>
      <div class="player-stat-card">
        <span class="player-stat-label">Avg Pctile</span>
        <strong class="player-stat-value">{summary.averagePercentile ? `${summary.averagePercentile}%` : 'N/A'}</strong>
      </div>
      <div class="player-stat-card">
        <span class="player-stat-label">Avg Finish</span>
        <strong class="player-stat-value">{summary.averageFinish || 'N/A'}</strong>
      </div>
      <div class="player-stat-card">
        <span class="player-stat-label">Best Finish</span>
        <strong class="player-stat-value">{summary.bestFinish || 'N/A'}</strong>
      </div>
      <div class="player-stat-card">
        <span class="player-stat-label">Avg Score</span>
        <strong class="player-stat-value">{summary.averageScore || 'N/A'}</strong>
      </div>
      <div class="player-stat-card">
        <span class="player-stat-label">Best Score</span>
        <strong class="player-stat-value">{summary.bestScore || 'N/A'}</strong>
      </div>
    </section>

    <section class="player-meta-grid">
      <div class="player-panel">
        <div class="player-panel-header">
          <div>
            <p class="player-section-kicker">Titles</p>
            <h2 class="player-section-title">Championship Years</h2>
          </div>
        </div>

        {#if titleYears.length}
          <div class="player-chip-row">
            {#each titleYears as year}
              <span class="player-chip player-chip--gold">{year}</span>
            {/each}
          </div>
        {:else}
          <p class="player-empty-copy">No titles recorded.</p>
        {/if}
      </div>

      <div class="player-panel">
        <div class="player-panel-header">
          <div>
            <p class="player-section-kicker">Archive</p>
            <h2 class="player-section-title">Known Aliases</h2>
          </div>
        </div>

        {#if aliases.length}
          <div class="player-chip-row">
            {#each aliases as alias}
              <span class="player-chip">{alias}</span>
            {/each}
          </div>
        {:else}
          <p class="player-empty-copy">No alternate names recorded.</p>
        {/if}
      </div>
    </section>

    <section class="player-results-shell mm-table-shell">
      <div class="player-results-header">
        <div>
          <p class="player-section-kicker">Archive</p>
          <h2 class="player-section-title">Year-by-Year Results</h2>
        </div>
      </div>

      <div class="player-results-table-wrap">
        <table class="player-results-table">
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
            {#each yearlyResults as result, index}
              <tr class:index-even={index % 2 === 0}>
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
    display: grid;
    gap: 1.15rem;
    padding: 1.35rem;
    overflow: hidden;
    background: rgba(10, 10, 11, 0.96);
  }

  .player-hero {
    padding: 0.15rem 0 0.15rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
    margin: 0.55rem 0 0;
    color: var(--mm-text);
    font-size: clamp(2.1rem, 4vw, 3.25rem);
    font-weight: 700;
    line-height: 0.98;
  }

  .player-subtitle {
    margin: 0.75rem 0 0;
    max-width: 42rem;
    color: var(--mm-muted);
    font-size: 0.98rem;
    line-height: 1.55;
  }

  .player-summary-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .player-stat-card,
  .player-panel {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(14, 14, 15, 0.9);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .player-stat-card {
    display: grid;
    gap: 0.32rem;
    padding: 1rem 1rem 0.95rem;
    border-radius: 1rem;
  }

  .player-stat-label,
  .player-section-kicker {
    margin: 0;
    color: var(--mm-subtle);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .player-stat-value {
    color: #f8d27b;
    font-size: clamp(1.85rem, 3vw, 2.4rem);
    font-weight: 700;
    line-height: 1;
  }

  .player-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .player-panel {
    display: grid;
    gap: 0.95rem;
    padding: 1.2rem;
    border-radius: 1.35rem;
  }

  .player-panel-header,
  .player-results-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .player-section-title {
    margin: 0.35rem 0 0;
    color: var(--mm-text);
    font-size: clamp(1.35rem, 2.5vw, 1.9rem);
    font-weight: 700;
    line-height: 1.05;
  }

  .player-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .player-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.15rem;
    padding: 0.42rem 0.88rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-text);
    font-size: 0.92rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .player-chip--gold {
    border-color: rgba(245, 158, 11, 0.24);
    background: rgba(245, 158, 11, 0.1);
    color: #fcd34d;
  }

  .player-empty-copy {
    margin: 0;
    color: var(--mm-muted);
    font-size: 0.96rem;
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

  .player-results-table-wrap {
    overflow-x: auto;
  }

  .player-results-table {
    width: 100%;
    min-width: 820px;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .player-results-table thead {
    background: rgba(255, 255, 255, 0.03);
  }

  .player-results-table th {
    padding: 0.82rem 1rem;
    color: var(--mm-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-align: left;
  }

  .player-results-table tbody tr {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(11, 11, 12, 0.94);
  }

  .player-results-table tbody tr.index-even {
    background: rgba(255, 255, 255, 0.02);
  }

  .player-results-table td {
    padding: 0.96rem 1rem;
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

