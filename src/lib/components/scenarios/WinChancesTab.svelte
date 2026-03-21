<script lang="ts">
  export let userWinCounts: any[] = [];
</script>

<div class="scenario-win-shell mm-table-shell">
  <table class="scenario-win-table mm-table">
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
      {#each userWinCounts as user}
        <tr>
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
  }

  .scenario-win-table {
    min-width: 0;
  }

  .scenario-win-table th.is-center,
  .scenario-win-percent {
    text-align: center;
  }

  .scenario-win-table th.is-right,
  .scenario-win-count {
    text-align: right;
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
