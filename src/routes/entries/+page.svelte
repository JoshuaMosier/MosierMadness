<script>
  import EntriesList from '$lib/components/EntriesList.svelte';
  import EntrantBracketView from '$lib/components/EntrantBracketView.svelte';

  export let data;
  const stage = data.tournamentSettings?.stage || 'archive';
  const showEntriesList = stage === 'bracket-open';
  const showBracketView = stage === 'tournament-live' || stage === 'complete';
  const pageTitle = showEntriesList ? 'Entrants' : 'Tournament Entries';
  const pageDescription = showEntriesList
    ? 'Browse submitted pool entries before games begin'
    : 'View all tournament entries and their current bracket status';
</script>

<svelte:head>
  <title>Mosier Madness - {pageTitle}</title>
  <meta name="description" content={pageDescription} />
</svelte:head>

{#if stage === 'archive'}
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
      <h1 class="text-2xl font-semibold text-zinc-100">Entries are not available yet</h1>
      <p class="mt-3 text-zinc-400">
        Check back when bracket season opens to browse entrants, then return during the tournament to inspect full brackets.
      </p>
    </div>
  </div>
{:else if showBracketView}
  <EntrantBracketView
    entries={data.entries}
    selectedEntrantId={data.selectedEntrantId}
    selectedBracketData={data.selectedBracketData}
  />
{:else if showEntriesList}
  <EntriesList entries={data.entries} loading={false} error={null} />
{/if}