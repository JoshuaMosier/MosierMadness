<script lang="ts">
  export let userWinCounts: any[] = [];
</script>

<div class="overflow-x-auto rounded-lg border border-zinc-700 max-w-2xl mx-auto">
  <table class="w-full divide-y divide-zinc-700">
    <thead class="bg-zinc-800">
      <tr>
        <th scope="col" class="px-2 py-2 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
          Name
        </th>
        <th scope="col" class="px-2 py-2 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider">
          Win %
        </th>
        <th scope="col" class="px-2 py-2 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">
          Wins
        </th>
      </tr>
    </thead>
    <tbody class="bg-zinc-800/50 divide-y divide-zinc-700">
      {#each userWinCounts as user, i}
        <tr class={i % 2 === 0 ? 'bg-zinc-800' : ''}>
          <td class="px-2 py-2 whitespace-nowrap text-sm text-zinc-300">
            {user.firstName} {user.lastName}
          </td>
          <td class="px-2 py-2 whitespace-nowrap text-sm text-zinc-300 text-center">
            <div class="inline-flex items-center">
              <span class="text-amber-500 font-medium text-sm">{user.winProbability.toFixed(1)}%</span>
            </div>
          </td>
          <td class="px-2 py-2 whitespace-nowrap text-xs text-zinc-400 text-right">
            {user.winCount.toLocaleString(undefined, {maximumFractionDigits: 0})}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
