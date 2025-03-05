<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let loading = true;
  let error = null;
  let entries = [];

  onMount(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          brackets (
            id,
            is_submitted,
            selections,
            updated_at
          )
        `)
        .order('last_name', { ascending: true });

      if (fetchError) throw fetchError;
      entries = data;
    } catch (err) {
      console.error('Error fetching entries:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Mosier Madness - Tournament Entries</title>
  <meta name="description" content="View all tournament entries and their current status" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold text-amber-600 mb-2">Tournament Entries</h1>
    <p class="text-xl text-zinc-400">View all bracket submissions and their status</p>
  </div>

  {#if loading}
    <div class="flex justify-center items-center min-h-[200px]">
      <div class="text-amber-600">Loading entries...</div>
    </div>
  {:else if error}
    <div class="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-lg text-center mb-4">
      {error}
    </div>
  {:else}
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
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
            {#each entries as entry}
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
                    {new Date(bracket.updated_at).toLocaleDateString()}
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
      Total Entries: {entries.length}
    </div>
  {/if}
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
</style> 