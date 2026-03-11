<script lang="ts">
  import ScoreboardGrid from '$lib/components/ScoreboardGrid.svelte';

  export let data: any;
</script>

<ScoreboardGrid tournamentSettings={data.tournamentSettings} scores={data.scores ?? []} />
