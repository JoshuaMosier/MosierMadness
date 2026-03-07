<script>
  import EntriesList from '$lib/components/EntriesList.svelte';
  import EntrantBracketView from '$lib/components/EntrantBracketView.svelte';

  export let data;

  // Hardcoded tournament state - change this to true when tournament starts
  const TOURNAMENT_STARTED = true;
</script>

<svelte:head>
  <title>Mosier Madness - Tournament Entries</title>
  <meta name="description" content="View all tournament entries and their current status" />
</svelte:head>

{#if TOURNAMENT_STARTED}
  <EntrantBracketView
    entries={data.entries}
    selectedEntrantId={data.selectedEntrantId}
    selectedBracketData={data.selectedBracketData}
  />
{:else}
  <EntriesList entries={data.entries} loading={false} error={null} />
{/if}