<!-- BracketView.svelte -->
<script lang="ts">
  import type { TeamInfo } from '$lib/types';
  import FinalFourBracket from '$lib/components/bracket/FinalFourBracket.svelte';
  import RegionBracket from '$lib/components/bracket/RegionBracket.svelte';

  type TeamIndex = 'A' | 'B';
  type MatchTeam = (TeamInfo & { score?: number | null }) | null | undefined;

  export let mode: 'view' | 'select' | 'live' = 'view';
  export let bracketData: any = null;
  export let isLocked: boolean = false;
  export let showScores: boolean = true;
  export let onTeamSelect: (detail: { matchId: number; teamIndex: TeamIndex; team: MatchTeam }) => void = () => {};

  const rounds = [
    { id: 1, name: '1st ROUND', dates: 'March 20-21' },
    { id: 2, name: '2nd ROUND', dates: 'March 22-23' },
    { id: 3, name: 'SWEET 16', dates: 'March 27-28' },
    { id: 4, name: 'ELITE EIGHT', dates: 'March 29-30' },
    { id: 5, name: 'FINAL FOUR', dates: 'April 5' },
    { id: 6, name: 'CHAMPION', dates: 'April 7' },
  ];

  const headerRounds = [...rounds, ...rounds.slice().reverse().slice(1)];

  const regions = [
    { id: 1, name: 'SOUTH', side: 'left' as const, topOffset: 0 },
    { id: 2, name: 'EAST', side: 'left' as const, topOffset: 550 },
    { id: 3, name: 'MIDWEST', side: 'right' as const, topOffset: 0 },
    { id: 4, name: 'WEST', side: 'right' as const, topOffset: 550 },
  ];

  $: interactive = mode === 'select' && !isLocked;

  function handleTeamSelect(detail: { matchId: number; teamIndex: TeamIndex; team: MatchTeam }): void {
    if (!interactive) return;
    onTeamSelect(detail);
  }

  function getTeamStyle(team: MatchTeam): string {
    if (!team?.color) {
      return '';
    }

    const opacity = 0.8;
    const hex = team.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `background: linear-gradient(to right, rgba(${r}, ${g}, ${b}, ${opacity}) 0%, rgba(${r}, ${g}, ${b}, 0.6) 100%)`;
  }
</script>

<div class="bg-gradient-to-b from-neutral-950/30 to-neutral-950/95 text-center w-full max-w-[1140px] mx-auto pl-0 rounded-lg shadow-2xl p-4 overflow-x-auto">
  <div class="flex justify-center w-full min-w-[950px]">
    <table class="text-xs border-collapse mx-auto w-[950px] rounded-lg overflow-hidden shadow-lg">
      <tbody>
        <tr>
          {#each headerRounds as round}
            <th class="text-white bg-gradient-to-r from-amber-600/90 to-amber-700/90 p-3 whitespace-nowrap text-center w-[86px] font-semibold">
              {round.name}
            </th>
          {/each}
        </tr>
        <tr>
          {#each headerRounds as round}
            <td class="text-xs p-[9px] bg-zinc-100 text-zinc-800 text-center whitespace-nowrap font-medium">
              {round.dates}
            </td>
          {/each}
        </tr>
      </tbody>
    </table>
  </div>

  <div class="mt-[15px] h-[1000px] relative mx-auto min-w-[950px] w-[950px]" id="bracket">
    {#each regions as region}
      <RegionBracket
        regionId={region.id}
        name={region.name}
        side={region.side}
        topOffset={region.topOffset}
        {bracketData}
        {interactive}
        {showScores}
        onTeamSelect={handleTeamSelect}
      />
    {/each}

    <div class="absolute left-[402.5px] top-[330px] w-[145px]">
      <div class="text-white text-center">
        <div class="text-[11px] uppercase tracking-wider mb-2 text-amber-300/90 font-bold">Champion</div>
        <div class="rounded-sm overflow-hidden">
          {#if bracketData?.champion}
            <div class="h-[25px] px-[6px] whitespace-nowrap flex items-center justify-center rounded-lg" style={getTeamStyle(bracketData.champion)}>
              <span class="inline-block w-[16px] text-center bg-zinc-800/90 mr-1 text-[10px] font-bold">
                {bracketData.champion.seed}
              </span>
              <span class="truncate font-medium">{bracketData.champion.name}</span>
            </div>
          {:else}
            <div class="h-[25px] px-[6px] whitespace-nowrap flex items-center justify-center bg-stone-900 border border-dashed border-amber-300/50">
              <span class="inline-block w-[16px] text-center mr-1 text-[10px] font-bold">-</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <FinalFourBracket
      {bracketData}
      {interactive}
      {showScores}
      onTeamSelect={handleTeamSelect}
    />
  </div>
</div>

<style>
  :global(.truncate) {
    font-family: Inter, "Segoe UI", Roboto, -apple-system, sans-serif;
    font-feature-settings: "tnum" on, "lnum" on;
    letter-spacing: -0.01em;
    font-weight: 450;
  }
</style>
