<script lang="ts">
  import EntriesList from '$lib/components/EntriesList.svelte';
  import EntrantBracketView from '$lib/components/EntrantBracketView.svelte';
  import { isArchive, isBracketOpen, hasLeaderboard } from '$lib/utils/stageUtils';
  import type { TournamentStage } from '$lib/types';

  export let data: any;
  const stage: TournamentStage = data.tournamentSettings?.stage || 'archive';
  const showEntriesList = isBracketOpen(stage);
  const showBracketView = hasLeaderboard(stage);
  const pageTitle = showEntriesList ? 'Entrants' : 'Tournament Entries';
  const pageDescription = showEntriesList
    ? 'Browse submitted pool entries before games begin'
    : 'View all tournament entries and their current bracket status';
</script>

<svelte:head>
  <title>Mosier Madness - {pageTitle}</title>
  <meta name="description" content={pageDescription} />
</svelte:head>

{#if isArchive(stage)}
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
      <h2 class="text-2xl font-semibold text-zinc-100">Entries are not available yet</h2>
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