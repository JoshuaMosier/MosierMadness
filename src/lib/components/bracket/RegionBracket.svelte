<script lang="ts">
  import type { TeamInfo } from '$lib/types';
  import BracketMatchCard from './BracketMatchCard.svelte';

  type MatchTeam = (TeamInfo & { score?: number | null }) | null | undefined;
  type TeamIndex = 'A' | 'B';
  type RegionSide = 'left' | 'right';

  interface RoundConfig {
    roundId: number;
    xOffset: number;
    topBase: number;
    topStep: number;
    matchCount: number;
  }

  interface ConnectorConfig {
    xOffset: number;
    topBase: number;
    topStep: number;
    height: number;
    matchCount: number;
  }

  export let regionId: number;
  export let name: string;
  export let side: RegionSide = 'left';
  export let topOffset: number = 0;
  export let bracketData: any = null;
  export let interactive: boolean = false;
  export let showScores: boolean = true;
  export let onTeamSelect: (detail: { matchId: number; teamIndex: TeamIndex; team: MatchTeam }) => void = () => {};

  const roundConfigs: RoundConfig[] = [
    { roundId: 1, xOffset: 0, topBase: 0, topStep: 50, matchCount: 8 },
    { roundId: 2, xOffset: 115, topBase: 0, topStep: 100, matchCount: 4 },
    { roundId: 3, xOffset: 230, topBase: 0, topStep: 200, matchCount: 2 },
    { roundId: 4, xOffset: 345, topBase: 0, topStep: 0, matchCount: 1 },
  ];

  const connectorConfigs: ConnectorConfig[] = [
    { xOffset: 115, topBase: 5, topStep: 100, height: 80, matchCount: 4 },
    { xOffset: 230, topBase: 30, topStep: 200, height: 130, matchCount: 2 },
    { xOffset: 345, topBase: 55, topStep: 0, height: 280, matchCount: 1 },
  ];

  function getMatchId(roundId: number, matchIndex: number): number {
    if (roundId === 1) {
      return (regionId - 1) * 8 + matchIndex + 1;
    }

    if (roundId === 2) {
      return 32 + (regionId - 1) * 4 + matchIndex + 1;
    }

    if (roundId === 3) {
      return 48 + (regionId - 1) * 2 + matchIndex + 1;
    }

    return 56 + regionId;
  }

  function range(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index);
  }

  function getHeaderClass(): string {
    const sideClass = side === 'left'
      ? 'absolute left-[170px] block w-[150px]'
      : 'absolute right-[170px] block w-[150px] text-right';

    return `absolute uppercase text-amber-300/90 pt-[15px] font-bold ${sideClass}`;
  }

  function getHeaderStyle(): string {
    return `top: ${topOffset + 165}px;`;
  }

  function getConnectorClass(): string {
    return `absolute border-r-2 border-t-2 border-b-2 border-amber-700/30 rounded-r-md ${side === 'right' ? 'transform rotate-180' : ''}`;
  }

  function getConnectorStyle(config: ConnectorConfig, matchIndex: number): string {
    const horizontal = side === 'left'
      ? `left: ${config.xOffset}px;`
      : `right: ${config.xOffset}px;`;
    const top = topOffset + config.topBase + matchIndex * config.topStep;

    return `${horizontal} top: ${top}px; height: ${config.height}px; width: 15px;`;
  }

  function getMatchContainerStyle(config: RoundConfig): string {
    return side === 'left'
      ? `left: ${config.xOffset}px;`
      : `right: ${config.xOffset}px;`;
  }

  function getMatchTop(config: RoundConfig, matchIndex: number): number {
    return topOffset + config.topBase + matchIndex * config.topStep;
  }
</script>

<div class="absolute inset-0">
  <h4 class={getHeaderClass()} style={getHeaderStyle()}>
    {name}
  </h4>

  {#each connectorConfigs as config}
    {#each range(config.matchCount) as matchIndex}
      <div class={getConnectorClass()} style={getConnectorStyle(config, matchIndex)}></div>
    {/each}
  {/each}

  {#each roundConfigs as config}
    {#each range(config.matchCount) as matchIndex}
      {@const matchId = getMatchId(config.roundId, matchIndex)}
      {#if bracketData?.matches?.[matchId]}
        <div class="absolute top-0 w-[115px]" style={getMatchContainerStyle(config)}>
          <BracketMatchCard
            match={bracketData.matches[matchId]}
            {matchId}
            roundId={config.roundId}
            top={getMatchTop(config, matchIndex)}
            side={side}
            variant="standard"
            {interactive}
            {showScores}
            {onTeamSelect}
          />
        </div>
      {/if}
    {/each}
  {/each}
</div>
