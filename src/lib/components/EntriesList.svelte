<script>
  import { fade } from 'svelte/transition';
  import { FADE_QUICK, FADE_DELAYED, FADE_CONTENT } from '$lib/constants/transitions';
  import Alert from '$lib/components/Alert.svelte';

  export let entries = [];
  export let loading = false;
  export let error = null;
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  {#if loading}
    <div class="flex justify-center items-center min-h-[400px]" in:fade={FADE_QUICK}>
      <div class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-amber-600 font-medium">Loading entries...</div>
      </div>
    </div>
  {:else if error}
    <div in:fade={FADE_DELAYED}>
      <Alert message={error} center class="mb-4" />
    </div>
  {:else}
    <div in:fade={FADE_CONTENT}>
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div class="border-b border-zinc-800 bg-zinc-900/50">
          <div class="p-6">
            <h2 class="text-2xl font-semibold text-zinc-100">Tournament Entries</h2>
            <p class="text-sm text-zinc-400 mt-1">View all bracket submissions and their status</p>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-zinc-800">
                <th class="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Name</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Status</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Picks Made</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Last Updated</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
              {#each entries.filter(entry => 
                entry.brackets[0]?.selections?.filter(Boolean).length > 0
              ) as entry}
                {@const bracket = entry.brackets[0]}
                <tr class="hover:bg-zinc-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="text-zinc-200">{entry.first_name} {entry.last_name}</div>
                  </td>
                  <td class="px-6 py-4">
                    {#if !bracket}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 text-zinc-400">
                        No Bracket
                      </span>
                    {:else if bracket.is_submitted}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
                        Submitted
                      </span>
                    {:else}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-400">
                        In Progress
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-zinc-300">
                    {#if bracket}
                      {bracket.selections.filter(Boolean).length} / 63
                    {:else}
                      0 / 63
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-zinc-400 text-sm">
                    {#if bracket}
                      {new Date(bracket.updated_at).toLocaleString()}
                    {:else}
                      -
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 text-center text-sm text-zinc-500">
        Total Active Entries: {entries.filter(entry => 
          entry.brackets[0]?.selections?.filter(Boolean).length > 0
        ).length}
      </div>
    </div>
  {/if}
</div> 