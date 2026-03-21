<script lang="ts">
  import { fade } from 'svelte/transition';
  import { FADE_DELAYED, FADE_CONTENT } from '$lib/constants/transitions';
  import { hexToRgb } from '$lib/utils/teamColorUtils';
  import { handleImageError } from '$lib/utils/imageUtils';
  import Alert from '$lib/components/Alert.svelte';
  import type { LeaderboardProjection, EntryScore } from '$lib/types';

  export let leaderboard: LeaderboardProjection | null = null;
  export let currentUserId: string | null = null;

  const teamLogoClass = 'leaderboard-team-logo';
  const teamLogoContainerClass = 'leaderboard-team-logo-shell';
  type TeamPickState = 'normal' | 'correct' | 'eliminated';

  $: sortedScores = leaderboard?.rows || [];
  $: ranks = leaderboard?.ranks || [];
  $: masterBracket = leaderboard?.masterBracket || [];
  $: eliminatedTeams = leaderboard?.eliminatedTeams || [];
  $: teamSeoMap = leaderboard?.teamSeoMap || {};
  $: teamColorMap = leaderboard?.teamColorMap || {};
  $: teamSelectionsByEntryId = leaderboard?.teamSelectionsByEntryId || {};
  let svgFilter = `
  <svg width="0" height="0" style="position: absolute;">
    <defs>
      <filter id="teamLogoOutline" x="-20%" y="-20%" width="140%" height="140%">
        <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="blackThicken" />
        <feFlood flood-color="black" result="blackOutline" />
        <feComposite in="blackOutline" in2="blackThicken" operator="in" result="blackOutline" />
        <feMorphology operator="dilate" radius="0.5" in="SourceAlpha" result="whiteThicken" />
        <feFlood flood-color="white" result="whiteOutline" />
        <feComposite in="whiteOutline" in2="whiteThicken" operator="in" result="whiteOutline" />
        <feComposite in="whiteOutline" in2="blackOutline" operator="over" result="outlines" />
        <feComposite in="SourceGraphic" in2="outlines" operator="over" />
      </filter>
    </defs>
  </svg>
  `;

  function getRankLabel(rank: number): string {
    const lastDigit = rank % 10;
    const lastTwoDigits = rank % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${rank}th`;
    }

    switch (lastDigit) {
      case 1:
        return `${rank}st`;
      case 2:
        return `${rank}nd`;
      case 3:
        return `${rank}rd`;
      default:
        return `${rank}th`;
    }
  }

  function getTeamNameFromSelection(selection: string | null): string | null {
    if (!selection) return null;
    const parts = selection.split(' ');
    if (parts.length < 2) return null;
    return parts.slice(1).join(' ');
  }

  function getTeamSeoName(team: string): string {
    return teamSeoMap[team] || '';
  }

  function getEntryHref(score: EntryScore): string {
    const nameIdentifier = `${score.firstName}|${score.lastName}`;
    return `/entries?selected=${encodeURIComponent(nameIdentifier)}`;
  }

  function isCurrentUserRow(score: EntryScore): boolean {
    return Boolean(currentUserId && score.userId && score.userId === currentUserId);
  }

  function getNameButtonClass(): string {
    return 'leaderboard-name-button';
  }

  function getPotentialValue(potential: number | undefined): number {
    return typeof potential === 'number' && Number.isFinite(potential) ? potential : 0;
  }

  function getTeamPrimaryColor(teamName: string): string {
    return teamColorMap[teamName]?.primaryColor || '#666666';
  }

  function getTeamContainerStyle(teamName: string, state: TeamPickState = 'normal'): string {
    const baseColor = getTeamPrimaryColor(teamName);
    let rgba;
    
    const rgb = hexToRgb(baseColor);
    if (rgb) {
      if (state === 'eliminated') {
        rgba = 'rgba(127, 29, 29, 0.94)';
      } else if (state === 'correct') {
        // Correct picks stay neutral so the green overlay reads clearly.
        const gray = Math.round((rgb.r + rgb.g + rgb.b) / 3);
        rgba = `rgba(${gray}, ${gray}, ${gray}, 0.5)`;
      } else {
        rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
      }
    } else if (state === 'eliminated') {
      rgba = 'rgba(127, 29, 29, 0.94)';
    } else {
      rgba = baseColor;
    }

    return `
      background-color: ${rgba};
      border-color: ${state === 'eliminated' ? 'rgba(248, 113, 113, 0.24)' : 'rgba(255, 255, 255, 0.08)'};
      filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.24));
    `;
  }

  function getTeamLogoFilter(state: TeamPickState): string {
    if (state === 'eliminated') {
      return 'filter: url(#teamLogoOutline) grayscale(0.28) saturate(0.15) brightness(0.92);';
    }

    if (state === 'correct') {
      return 'filter: url(#teamLogoOutline) saturate(0.3);';
    }

    return 'filter: url(#teamLogoOutline);';
  }

  function getTeamOverlayStyle(teamName: string, score: EntryScore, gameIndex: number): { style: string; state: TeamPickState } {
    const masterTeamName = getTeamNameFromSelection(masterBracket[gameIndex]);
    const isCorrect = masterTeamName === teamName;
    
    const isEliminated = !isCorrect && eliminatedTeams.some(eliminatedTeam => {
      const eliminatedTeamName = getTeamNameFromSelection(eliminatedTeam);
      return eliminatedTeamName === teamName;
    });
    
    const styles = [];
    
    if (isCorrect) {
      styles.push('background: rgba(16, 185, 129, 0.34)');
      styles.push('box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.18)');
    } else if (isEliminated) {
      styles.push('background: linear-gradient(180deg, rgba(239, 68, 68, 0.58), rgba(127, 29, 29, 0.76))');
      styles.push('box-shadow: inset 0 0 0 1px rgba(254, 202, 202, 0.16)');
    }
    
    return {
      style: styles.join(';'),
      state: isCorrect ? 'correct' : isEliminated ? 'eliminated' : 'normal'
    };
  }

  // Update the getPotentialColor function to include opacity
  function getPotentialColor(potential: number | undefined, scores: EntryScore[]): string {
    if (scores.length === 0) return 'color: hsla(160, 84%, 55%, 0.8)';
    
    // Find max and min potentials in the dataset
    const maxPotential = Math.max(...scores.map((s) => getPotentialValue(s.potential)));
    const minPotential = Math.min(...scores.map((s) => getPotentialValue(s.potential)));
    
    // If all potentials are the same, return the max color
    if (maxPotential === minPotential) return 'color: hsla(160, 84%, 55%, 0.8)';
    
    // Calculate where this potential falls in the range (0 to 1)
    const normalizedValue = (getPotentialValue(potential) - minPotential) / (maxPotential - minPotential);
    
    // Convert normalized value to HSL color (120° for green, 60° for yellow, 0° for red)
    // This gives a smooth transition from red→yellow→green as the value increases
    const hue = Math.round(normalizedValue * 120); // 0 = red, 60 = yellow, 120 = green
    const saturation = 85; // High saturation for vibrant colors
    const lightness = 60; // Medium lightness for visibility
    const opacity = 0.8; // 70% opacity as requested
    
    // Return a style object with hsla color (including alpha/opacity)
    return `color: hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
  }

  function getPotentialDisplay(potential: number | undefined): string {
    return `${getPotentialValue(potential)}`;
  }
</script>

{@html svgFilter}

{#if !leaderboard}
  <div in:fade={FADE_DELAYED}>
    <Alert center class="mb-4">Leaderboard data is unavailable.</Alert>
  </div>
{:else}
  <div class="leaderboard-shell mm-shell" in:fade={FADE_CONTENT}>
    <div class="leaderboard-mobile">
      {#each sortedScores as score, index}
        <div class="leaderboard-mobile-row" class:leaderboard-row--current-user={isCurrentUserRow(score)}>
          <span class="leaderboard-rank leaderboard-rank--mobile">{getRankLabel(ranks[index])}</span>
          <a href={getEntryHref(score)} class={`${getNameButtonClass()} leaderboard-name-button--mobile`}>
            <span class="leaderboard-name leaderboard-name--mobile">{score.firstName} {score.lastName}</span>
          </a>
          <span class="leaderboard-metric leaderboard-metric--mobile is-total">{score.total}</span>
          <span class="leaderboard-metric leaderboard-metric--mobile is-potential" style={getPotentialColor(score.potential, sortedScores)}>
            {getPotentialDisplay(score.potential)}
          </span>
        </div>
      {/each}
    </div>

    <div class="leaderboard-table-shell">
      <div class="leaderboard-table-scroll">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Total</th>
              <th>Potential</th>
              <th>R1</th>
              <th>R2</th>
              <th>S16</th>
              <th>Elite 8</th>
              <th>Final 4</th>
              <th>Champ</th>
              <th>Games</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedScores as score, index}
              <tr class="leaderboard-row" class:leaderboard-row--current-user={isCurrentUserRow(score)}>
                <td class="leaderboard-cell leaderboard-cell--rank">
                  <span class="leaderboard-rank">{getRankLabel(ranks[index])}</span>
                </td>
                <td class="leaderboard-cell leaderboard-cell--name">
                  <a href={getEntryHref(score)} class={getNameButtonClass()}>
                    <span class="leaderboard-name">{score.firstName} {score.lastName}</span>
                  </a>
                </td>
                <td class="leaderboard-cell leaderboard-cell--center">
                  <span class="leaderboard-metric is-total">{score.total}</span>
                </td>
                <td class="leaderboard-cell leaderboard-cell--center">
                  <span class="leaderboard-metric is-potential" style={getPotentialColor(score.potential, sortedScores)}>
                    {getPotentialDisplay(score.potential)}
                  </span>
                </td>
                <td class="leaderboard-cell leaderboard-cell--center">
                  <span class="leaderboard-round-metric">{score.round1}</span>
                </td>
                <td class="leaderboard-cell leaderboard-cell--center">
                  <span class="leaderboard-round-metric">{score.round2}</span>
                </td>
                <td class="leaderboard-cell leaderboard-cell--center">
                  <span class="leaderboard-round-metric">{score.round3}</span>
                </td>
                <td class="leaderboard-cell leaderboard-cell--center">
                  <div class="leaderboard-logo-stack">
                    {#if teamSelectionsByEntryId[score.entryId]?.e8?.length > 0}
                      {#each teamSelectionsByEntryId[score.entryId].e8 as team, idx}
                        {@const overlayInfo = getTeamOverlayStyle(team, score, 56 + idx)}
                        <div class={teamLogoContainerClass} title={team} style={getTeamContainerStyle(team, overlayInfo.state)}>
                          <img
                            src="/images/team-logos/{getTeamSeoName(team)}.svg"
                            alt={team}
                            class={teamLogoClass}
                            style={getTeamLogoFilter(overlayInfo.state)}
                            loading="lazy"
                            decoding="async"
                            fetchpriority="low"
                            on:error={handleImageError}
                          >
                          <div class="absolute inset-0" style={`${overlayInfo.style}; border-radius: inherit;`}></div>
                        </div>
                      {/each}
                    {:else}
                      <span class="leaderboard-empty-slot">-</span>
                    {/if}
                  </div>
                </td>
                <td class="leaderboard-cell leaderboard-cell--center">
                  <div class="leaderboard-logo-stack">
                    {#if teamSelectionsByEntryId[score.entryId]?.f4?.length > 0}
                      {#each teamSelectionsByEntryId[score.entryId].f4 as team, idx}
                        {@const overlayInfo = getTeamOverlayStyle(team, score, 60 + idx)}
                        <div class={teamLogoContainerClass} title={team} style={getTeamContainerStyle(team, overlayInfo.state)}>
                          <img
                            src="/images/team-logos/{getTeamSeoName(team)}.svg"
                            alt={team}
                            class={teamLogoClass}
                            style={getTeamLogoFilter(overlayInfo.state)}
                            loading="lazy"
                            decoding="async"
                            fetchpriority="low"
                            on:error={handleImageError}
                          >
                          <div class="absolute inset-0" style={`${overlayInfo.style}; border-radius: inherit;`}></div>
                        </div>
                      {/each}
                    {:else}
                      <span class="leaderboard-empty-slot">-</span>
                    {/if}
                  </div>
                </td>
                <td class="leaderboard-cell leaderboard-cell--center">
                  <div class="leaderboard-logo-stack">
                    {#if teamSelectionsByEntryId[score.entryId]?.champ}
                      {@const champTeam = teamSelectionsByEntryId[score.entryId].champ}
                      {@const overlayInfo = getTeamOverlayStyle(champTeam, score, 62)}
                      <div class={teamLogoContainerClass} title={champTeam} style={getTeamContainerStyle(champTeam, overlayInfo.state)}>
                        <img
                          src="/images/team-logos/{getTeamSeoName(champTeam)}.svg"
                          alt={champTeam}
                          class={teamLogoClass}
                          style={getTeamLogoFilter(overlayInfo.state)}
                          loading="lazy"
                          decoding="async"
                          fetchpriority="low"
                          on:error={handleImageError}
                        >
                        <div class="absolute inset-0" style={`${overlayInfo.style}; border-radius: inherit;`}></div>
                      </div>
                    {:else}
                      <span class="leaderboard-empty-slot">-</span>
                    {/if}
                  </div>
                </td>
                <td class="leaderboard-cell leaderboard-cell--center">
                  <span class="leaderboard-round-metric is-games">{score.correctGames}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}

<style>
  .leaderboard-shell {
    overflow: hidden;
    background: rgba(10, 10, 11, 0.96);
  }

  .leaderboard-shell::before {
    content: none;
  }

  .leaderboard-mobile {
    display: grid;
    gap: 0;
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(14, 14, 15, 0.92);
  }

  .leaderboard-mobile-row {
    display: grid;
    grid-template-columns: 3rem minmax(0, 1fr) 2.8rem 3.3rem;
    align-items: center;
    gap: 0.55rem;
    white-space: nowrap;
  }

  .leaderboard-mobile-row {
    padding: 0.46rem 0.8rem;
    background: rgba(255, 255, 255, 0.015);
  }

  .leaderboard-mobile-row + .leaderboard-mobile-row {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .leaderboard-mobile-row:nth-child(odd) {
    background: rgba(255, 255, 255, 0.028);
  }

  .leaderboard-mobile-row.leaderboard-row--current-user {
    background:
      linear-gradient(90deg, rgba(180, 83, 9, 0.26), rgba(245, 158, 11, 0.1) 36%, rgba(255, 255, 255, 0.02));
    box-shadow: inset 3px 0 0 rgba(245, 158, 11, 0.52);
  }

  .leaderboard-table-shell {
    display: none;
    padding: 0;
  }

  .leaderboard-table-scroll {
    overflow-x: auto;
    background: transparent;
  }

  .leaderboard-table {
    width: 100%;
    min-width: 1100px;
    border-collapse: separate;
    border-spacing: 0;
  }

  .leaderboard-table thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 1rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(14, 14, 15, 0.96);
    color: var(--mm-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-align: center;
    text-transform: uppercase;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .leaderboard-table thead th:nth-child(2) {
    text-align: center;
  }

  .leaderboard-table thead th:first-child,
  .leaderboard-row td:first-child {
    padding-left: 1.1rem;
  }

  .leaderboard-table thead th:last-child,
  .leaderboard-row td:last-child {
    padding-right: 1.1rem;
  }

  .leaderboard-row {
    transition: background-color 180ms ease;
  }

  .leaderboard-row:nth-child(odd) {
    background: rgba(255, 255, 255, 0.018);
  }

  .leaderboard-row:hover {
    background: rgba(255, 255, 255, 0.042);
  }

  .leaderboard-row.leaderboard-row--current-user,
  .leaderboard-row.leaderboard-row--current-user:nth-child(odd),
  .leaderboard-row.leaderboard-row--current-user:hover {
    background:
      linear-gradient(90deg, rgba(180, 83, 9, 0.24), rgba(245, 158, 11, 0.08) 40%, rgba(255, 255, 255, 0.018));
  }

  .leaderboard-row--current-user .leaderboard-name-button {
    border-color: rgba(245, 158, 11, 0.2);
    background: rgba(245, 158, 11, 0.08);
  }

  .leaderboard-row--current-user .leaderboard-name-button--mobile {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
  }

  .leaderboard-row--current-user .leaderboard-name {
    color: #fde68a;
  }

  .leaderboard-row td {
    padding: 0.48rem 0.7rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    vertical-align: middle;
  }

  .leaderboard-cell--rank,
  .leaderboard-cell--center {
    text-align: center;
  }

  .leaderboard-cell--name {
    min-width: 15rem;
    text-align: center;
  }

  .leaderboard-rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 4rem;
    padding: 0.38rem 0.78rem;
    border-radius: 999px;
    border: 1px solid rgba(245, 158, 11, 0.22);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.16), rgba(180, 83, 9, 0.08));
    color: #fcd34d;
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    line-height: 1;
  }

  .leaderboard-name-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: min(100%, 13.5rem);
    max-width: 100%;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    padding: 0.38rem 0.9rem;
  }

  .leaderboard-name-button--mobile {
    display: block;
    width: 100%;
    min-width: 0;
    border: 0;
    border-radius: 0.55rem;
    background: transparent;
    padding: 0.14rem 0;
  }

  .leaderboard-name-button:hover {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.05);
  }

  .leaderboard-name-button--mobile:hover {
    border-color: transparent;
    background: transparent;
  }

  .leaderboard-name-button:focus-visible {
    outline: none;
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(245, 158, 11, 0.06);
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
  }

  .leaderboard-name-button--mobile:focus-visible {
    border-color: transparent;
    background: rgba(245, 158, 11, 0.06);
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.16);
  }

  .leaderboard-name {
    display: block;
    overflow: hidden;
    color: var(--mm-text);
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .leaderboard-name--mobile {
    font-size: 0.9rem;
    text-align: left;
  }

  .leaderboard-metric,
  .leaderboard-round-metric {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .leaderboard-metric {
    min-width: 0;
    padding: 0;
    font-size: 1.2rem;
    letter-spacing: 0;
  }

  .leaderboard-metric--mobile {
    justify-self: end;
    font-size: 1rem;
  }

  .leaderboard-metric.is-total {
    color: #fcd34d;
  }

  .leaderboard-metric.is-potential {
    color: var(--mm-text);
  }

  .leaderboard-round-metric {
    min-width: 0;
    padding: 0;
    color: rgba(244, 244, 245, 0.9);
    font-size: 1rem;
  }

  .leaderboard-round-metric.is-games {
    color: var(--mm-muted);
  }

  .leaderboard-logo-stack {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    min-height: 2.2rem;
  }

  .leaderboard-team-logo-shell {
    position: relative;
    width: 2.2rem;
    min-width: 2.2rem;
    height: 2.2rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.62rem;
    padding: 0.12rem;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .leaderboard-team-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 0.06rem;
    opacity: 0.92;
  }

  .leaderboard-empty-slot {
    color: var(--mm-subtle);
    font-size: 0.9rem;
  }

  .leaderboard-rank--mobile {
    min-width: 0;
    width: 100%;
    padding: 0.28rem 0.5rem;
    font-size: 0.78rem;
  }

  @media (min-width: 768px) {
    .leaderboard-mobile {
      display: none;
    }

    .leaderboard-table-shell {
      display: block;
    }
  }

  @media (max-width: 767px) {
    .leaderboard-mobile-row {
      grid-template-columns: 2.8rem minmax(0, 1fr) 2.65rem 3.1rem;
      gap: 0.45rem;
    }

    .leaderboard-mobile-row {
      padding-left: 0.7rem;
      padding-right: 0.7rem;
    }
  }
</style>
