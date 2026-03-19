<script lang="ts">
  import type { TeamInfo } from '$lib/types';

  type TeamIndex = 'A' | 'B';
  type MatchTeam = (TeamInfo & { score?: number | null }) | null | undefined;
  type MatchSide = 'left' | 'right' | 'center';
  type MatchVariant = 'standard' | 'final';

  interface DisplayMatch {
    teamA?: MatchTeam;
    teamB?: MatchTeam;
    winner?: TeamIndex | null;
  }

  export let match: DisplayMatch | null = null;
  export let matchId: number;
  export let roundId: number;
  export let top: number;
  export let side: MatchSide = 'left';
  export let variant: MatchVariant = 'standard';
  export let interactive: boolean = false;
  export let showScores: boolean = true;
  export let onTeamSelect: (detail: { matchId: number; teamIndex: TeamIndex; team: MatchTeam }) => void = () => {};

  $: wrapperClassName =
    variant === 'final'
      ? 'absolute left-0 right-0 mx-auto w-[150px] p-0 text-xs text-white'
      : `absolute w-[115px] border border-zinc-700/40 p-0 text-xs text-white justify-between rounded-sm transition-all duration-200 flex flex-col ${interactive ? 'cursor-pointer' : ''} ${getStandardHeightClass(roundId)} ${getStandardMarginClass(roundId)} ${getStandardBorderClass(side)}`;
  $: wrapperStyle =
    variant === 'final'
      ? `top: ${top}px;`
      : `top: ${top}px; ${side === 'left' ? 'left: 0;' : 'right: 0;'}`;

  function handleTeamClick(teamIndex: TeamIndex): void {
    if (!interactive) return;

    const team = teamIndex === 'A' ? match?.teamA : match?.teamB;
    onTeamSelect({ matchId, teamIndex, team });
  }

  function teamAriaLabel(team: MatchTeam): string {
    if (!team?.name) return 'Empty slot';
    const label = `${team.seed} ${team.name}`;
    return interactive ? `Select ${label}` : label;
  }

  function getTeamClass(team: MatchTeam): string {
    if (!team?.name) {
      return 'bg-stone-900 border border-dashed border-amber-300/50';
    }

    return team.color ? '' : 'bg-zinc-800/80';
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

  function getStandardHeightClass(currentRoundId: number): string {
    if (currentRoundId === 3) return 'h-[90px]';
    if (currentRoundId === 4) return 'h-[220px]';
    if (currentRoundId === 5) return 'h-[115px]';
    return 'h-[40px]';
  }

  function getStandardMarginClass(currentRoundId: number): string {
    if (currentRoundId === 2) return 'mt-[24px]';
    if (currentRoundId === 3) return 'mt-[50px]';
    if (currentRoundId === 4) return 'mt-[85px]';
    return '';
  }

  function getStandardBorderClass(currentSide: MatchSide): string {
    if (currentSide === 'left') return 'border-l-0';
    if (currentSide === 'right') return 'border-r-0';
    return '';
  }
</script>

<div class={wrapperClassName} style={wrapperStyle}>
  {#if variant === 'final'}
    <div class="overflow-hidden rounded-sm border border-zinc-700/40">
      <div
        class={`h-[25px] whitespace-nowrap rounded-sm px-[6px] flex items-center transition-colors duration-200 ${getTeamClass(match?.teamA)}`}
        style={getTeamStyle(match?.teamA)}
        on:click={() => handleTeamClick('A')}
        on:keydown={(event) => event.key === 'Enter' && handleTeamClick('A')}
        role="button"
        aria-label={teamAriaLabel(match?.teamA)}
        tabindex="0"
      >
        <span class="mr-1 inline-block w-[16px] bg-zinc-800/90 text-center text-[10px] font-bold">
          {match?.teamA?.seed || '-'}
        </span>
        <span class="truncate">{match?.teamA?.name || ''}</span>
        {#if showScores && match?.teamA?.score !== undefined}
          <span class="ml-auto text-gray-200">{match?.teamA?.score}</span>
        {/if}
      </div>
      <div
        class={`h-[25px] whitespace-nowrap rounded-sm px-[6px] flex items-center transition-colors duration-200 ${getTeamClass(match?.teamB)}`}
        style={getTeamStyle(match?.teamB)}
        on:click={() => handleTeamClick('B')}
        on:keydown={(event) => event.key === 'Enter' && handleTeamClick('B')}
        role="button"
        aria-label={teamAriaLabel(match?.teamB)}
        tabindex="0"
      >
        <span class="mr-1 inline-block w-[16px] bg-zinc-800/90 text-center text-[10px] font-bold">
          {match?.teamB?.seed || '-'}
        </span>
        <span class="truncate">{match?.teamB?.name || ''}</span>
        {#if showScores && match?.teamB?.score !== undefined}
          <span class="ml-auto text-gray-200">{match?.teamB?.score}</span>
        {/if}
      </div>
    </div>
  {:else}
    <div
      class={`m-0 h-[20px] whitespace-nowrap rounded-sm pl-[5px] flex items-center transition-colors duration-200 ${getTeamClass(match?.teamA)}`}
      style={getTeamStyle(match?.teamA)}
      on:click={() => handleTeamClick('A')}
      on:keydown={(event) => event.key === 'Enter' && handleTeamClick('A')}
      role="button"
      aria-label={teamAriaLabel(match?.teamA)}
      tabindex="0"
    >
      <span class="mr-1 inline-block w-[16px] bg-zinc-800/90 text-center text-[10px] font-bold">
        {match?.teamA?.seed || '-'}
      </span>
      <span class="truncate">{match?.teamA?.name || ''}</span>
      {#if showScores && match?.teamA?.score !== undefined}
        <span class="ml-auto mr-1 text-gray-200">{match?.teamA?.score}</span>
      {/if}
    </div>

    <div
      class={`m-0 h-[20px] whitespace-nowrap rounded-sm pl-[5px] flex items-center transition-colors duration-200 ${getTeamClass(match?.teamB)}`}
      style={getTeamStyle(match?.teamB)}
      on:click={() => handleTeamClick('B')}
      on:keydown={(event) => event.key === 'Enter' && handleTeamClick('B')}
      role="button"
      aria-label={teamAriaLabel(match?.teamB)}
      tabindex="0"
    >
      <span class="mr-1 inline-block w-[16px] bg-zinc-800/90 text-center text-[10px] font-bold">
        {match?.teamB?.seed || '-'}
      </span>
      <span class="truncate">{match?.teamB?.name || ''}</span>
      {#if showScores && match?.teamB?.score !== undefined}
        <span class="ml-auto mr-1 text-gray-200">{match?.teamB?.score}</span>
      {/if}
    </div>
  {/if}
</div>
