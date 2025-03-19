<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { fade } from 'svelte/transition';
  import EntriesList from '$lib/components/EntriesList.svelte';
  import EntrantBracketView from '$lib/components/EntrantBracketView.svelte';

  // Hardcoded tournament state - change this to true when tournament starts
  const TOURNAMENT_STARTED = true;

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

{#if TOURNAMENT_STARTED}
  <EntrantBracketView {entries} {loading} {error} />
{:else}
  <EntriesList {entries} {loading} {error} />
{/if}

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
</style> 