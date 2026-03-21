<script lang="ts">
  export let userWinCounts: any[] = [];
</script>

<div class="scenario-win-shell">
  <table class="scenario-win-table">
    <thead>
      <tr>
        <th scope="col">
          Name
        </th>
        <th scope="col" class="is-center">
          Win %
        </th>
        <th scope="col" class="is-right">
          Wins
        </th>
      </tr>
    </thead>
    <tbody>
      {#each userWinCounts as user, i}
        <tr class:is-even={i % 2 === 0}>
          <td class="scenario-win-name">
            {user.displayName || `${user.firstName} ${user.lastName}`.trim()}
          </td>
          <td class="scenario-win-percent">
            <span>{user.winProbability.toFixed(1)}%</span>
          </td>
          <td class="scenario-win-count">
            {user.winCount.toLocaleString(undefined, {maximumFractionDigits: 0})}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .scenario-win-shell {
    max-width: 42rem;
    margin: 0 auto;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1.1rem;
    background: rgba(14, 14, 15, 0.92);
  }

  .scenario-win-table {
    width: 100%;
    border-collapse: collapse;
  }

  .scenario-win-table thead {
    background: rgba(255, 255, 255, 0.03);
  }

  .scenario-win-table th {
    padding: 0.78rem 0.9rem;
    color: var(--mm-subtle);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-align: left;
  }

  .scenario-win-table th.is-center,
  .scenario-win-percent {
    text-align: center;
  }

  .scenario-win-table th.is-right,
  .scenario-win-count {
    text-align: right;
  }

  .scenario-win-table tbody tr {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .scenario-win-table tbody tr.is-even {
    background: rgba(255, 255, 255, 0.018);
  }

  .scenario-win-table td {
    padding: 0.72rem 0.9rem;
  }

  .scenario-win-name {
    color: var(--mm-text);
    font-size: 0.95rem;
    font-weight: 600;
  }

  .scenario-win-percent span {
    color: #f59e0b;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .scenario-win-count {
    color: var(--mm-muted);
    font-size: 0.82rem;
  }
  </style>
