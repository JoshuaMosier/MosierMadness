<script lang="ts">
  import { fade } from 'svelte/transition';
  import { FADE_QUICK, FADE_DELAYED, FADE_CONTENT } from '$lib/constants/transitions';
  import Alert from '$lib/components/Alert.svelte';

  export let entries: any[] = [];
  export let loading: boolean = false;
  export let error: string | null = null;
</script>

<div class="mm-page">
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
      <div class="mm-table-shell">
        <div class="mm-panel-header">
          <h2 class="mm-section-title text-2xl md:text-3xl">Tournament Entries</h2>
          <p class="mt-1 text-sm text-zinc-400">View all bracket submissions and their status</p>
        </div>
        <div class="overflow-x-auto">
          <table class="mm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Picks Made</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {#each entries.filter(entry => 
                entry.brackets[0]?.selections?.filter(Boolean).length > 0
              ) as entry}
                {@const bracket = entry.brackets[0]}
                <tr>
                  <td>
                    <div class="text-zinc-200">{entry.first_name} {entry.last_name}</div>
                  </td>
                  <td>
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
                  <td class="text-zinc-300">
                    {#if bracket}
                      {bracket.selections.filter(Boolean).length} / 63
                    {:else}
                      0 / 63
                    {/if}
                  </td>
                  <td class="text-sm text-zinc-400">
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
