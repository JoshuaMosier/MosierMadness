<script>
  import ScoreboardGrid from '$lib/components/ScoreboardGrid.svelte';

  export let data;
</script>

<ScoreboardGrid tournamentSettings={data.tournamentSettings} />