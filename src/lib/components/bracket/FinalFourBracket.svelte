<script lang="ts">
  import type { TeamInfo } from '$lib/types';
  import BracketMatchCard from './BracketMatchCard.svelte';

  type MatchTeam = (TeamInfo & { score?: number | null }) | null | undefined;
  type TeamIndex = 'A' | 'B';

  export let bracketData: any = null;
  export let interactive: boolean = false;
  export let showScores: boolean = true;
  export let onTeamSelect: (detail: { matchId: number; teamIndex: TeamIndex; team: MatchTeam }) => void = () => {};

  const semifinalMatches = [
    { matchId: 61, side: 'left' as const, xOffset: 285, top: 415 },
    { matchId: 62, side: 'right' as const, xOffset: 285, top: 415 },
  ];
</script>

<div class="absolute inset-0">
  {#each semifinalMatches as matchConfig}
    {#if bracketData?.matches?.[matchConfig.matchId]}
      <div
        class="absolute top-0 w-[115px]"
        style={matchConfig.side === 'left' ? `left: ${matchConfig.xOffset}px;` : `right: ${matchConfig.xOffset}px;`}
      >
        <BracketMatchCard
          match={bracketData.matches[matchConfig.matchId]}
          matchId={matchConfig.matchId}
          roundId={5}
          top={matchConfig.top}
          side={matchConfig.side}
          variant="standard"
          {interactive}
          {showScores}
          {onTeamSelect}
        />
      </div>
    {/if}
  {/each}

  {#if bracketData?.matches?.[63]}
    <BracketMatchCard
      match={bracketData.matches[63]}
      matchId={63}
      roundId={6}
      top={445}
      side="center"
      variant="final"
      {interactive}
      {showScores}
      {onTeamSelect}
    />
  {/if}
</div>
