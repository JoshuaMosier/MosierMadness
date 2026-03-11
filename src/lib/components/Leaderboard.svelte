<script lang="ts">
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { FADE_DELAYED, FADE_CONTENT, fadeStagger } from '$lib/constants/transitions';
  import { hexToRgb } from '$lib/utils/teamColorUtils';
  import { handleImageError } from '$lib/utils/imageUtils';
  import Alert from '$lib/components/Alert.svelte';
  import type { LeaderboardProjection, EntryScore } from '$lib/types';

  export let leaderboard: LeaderboardProjection | null = null;

  const teamLogoClass = 'w-full h-full object-contain p-0.5 opacity-90';
  const teamLogoContainerClass = 'w-10 h-10 rounded-lg p-1 overflow-hidden shadow-inner relative';

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

  // Function to handle name click and navigation
  function handleNameClick(score: EntryScore): void {
    const nameIdentifier = `${score.firstName}|${score.lastName}`;
    goto(`/entries?selected=${nameIdentifier}`);
  }

  // Update getNameButtonClass to remove the user-specific styling
  function getNameButtonClass(score: EntryScore): string {
    return `
      inline-flex items-center gap-2 px-2 py-1 rounded-md transition-colors duration-150
      hover:bg-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50
    `.trim();
  }

  function getTeamPrimaryColor(teamName: string): string {
    return teamColorMap[teamName]?.primaryColor || '#666666';
  }

  function getTeamContainerStyle(teamName: string, isEliminatedOrCorrect: boolean = false): string {
    const baseColor = getTeamPrimaryColor(teamName);
    let rgba;
    
    const rgb = hexToRgb(baseColor);
    if (rgb) {
      if (isEliminatedOrCorrect) {
        // Convert to grayscale and reduce opacity further
        const gray = Math.round((rgb.r + rgb.g + rgb.b) / 3);
        rgba = `rgba(${gray}, ${gray}, ${gray}, .5)`;
      } else {
        rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, .8)`;
      }
    } else {
      rgba = baseColor;
    }

    return `
      background-color: ${rgba}; 
      filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3)) drop-shadow(-1px -1px 1px rgba(255, 255, 255, 0.1));
    `;
  }

  // Update getTeamOverlayStyle to return more information
  function getTeamOverlayStyle(teamName: string, score: EntryScore, gameIndex: number): { style: string; isEliminatedOrCorrect: boolean } {
    const masterTeamName = getTeamNameFromSelection(masterBracket[gameIndex]);
    const isCorrect = masterTeamName === teamName;
    
    const isEliminated = !isCorrect && eliminatedTeams.some(eliminatedTeam => {
      const eliminatedTeamName = getTeamNameFromSelection(eliminatedTeam);
      return eliminatedTeamName === teamName;
    });
    
    const styles = [];
    
    if (isCorrect) {
      styles.push('background: rgba(34, 197, 94, 0.5)');
    } else if (isEliminated) {
      styles.push('background: rgba(255, 0, 0, 0.6)');
    }
    
    return {
      style: styles.join(';'),
      isEliminatedOrCorrect: isEliminated || isCorrect
    };
  }

  // Update the getPotentialColor function to include opacity
  function getPotentialColor(potential: number | undefined, scores: EntryScore[]): string {
    if (scores.length === 0) return 'text-emerald-400';
    
    // Find max and min potentials in the dataset
    const maxPotential = Math.max(...scores.map(s => s.potential));
    const minPotential = Math.min(...scores.map(s => s.potential));
    
    // If all potentials are the same, return the max color
    if (maxPotential === minPotential) return 'text-emerald-400';
    
    // Calculate where this potential falls in the range (0 to 1)
    const normalizedValue = (potential - minPotential) / (maxPotential - minPotential);
    
    // Convert normalized value to HSL color (120° for green, 60° for yellow, 0° for red)
    // This gives a smooth transition from red→yellow→green as the value increases
    const hue = Math.round(normalizedValue * 120); // 0 = red, 60 = yellow, 120 = green
    const saturation = 85; // High saturation for vibrant colors
    const lightness = 60; // Medium lightness for visibility
    const opacity = 0.8; // 70% opacity as requested
    
    // Return a style object with hsla color (including alpha/opacity)
    return `color: hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
  }
</script>

<!-- Add the SVG filter definition to the page -->
  {@html svgFilter}
  
  {#if !leaderboard}
    <div in:fade={FADE_DELAYED}>
      <Alert center class="mb-4">Leaderboard data is unavailable.</Alert>
    </div>
  {:else}
    <div 
      class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
      in:fade={FADE_CONTENT}
    >
      
      <!-- Mobile View -->
      <div class="md:hidden">
        <!-- Column Headers -->
        <div class="border-b border-zinc-800 p-3 bg-zinc-900/50 sticky top-0 backdrop-blur-sm z-[5]">
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <span class="text-zinc-300 text-sm font-semibold">Name</span>
            </div>
            <div class="flex gap-4">
              <div class="w-8 text-center">
                <span class="text-zinc-300 text-sm font-semibold">Tot.</span>
              </div>
              <div class="w-8 text-center">
                <span class="text-zinc-300 text-sm font-semibold">Pot.</span>
              </div>
            </div>
          </div>
        </div>

        {#each sortedScores as score, index}
          <div 
            class="border-b border-zinc-800 p-4 transition-colors duration-150
                   {index % 2 === 0 ? 'bg-zinc-800/30 hover:bg-zinc-800/40' : 'hover:bg-zinc-800/20'}"
            in:fade={fadeStagger(index)}
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3 flex-1">
                <span class="text-amber-500 font-bold text-sm min-w-[2.5rem] bg-amber-500/10 rounded-full py-1 px-2 text-center">{getRankLabel(ranks[index])}</span>
                <button 
                  class={getNameButtonClass(score)}
                  on:click={() => handleNameClick(score)}
                >
                  <span class="text-zinc-100 font-medium">{score.firstName} {score.lastName}</span>
                </button>
              </div>
              <div class="flex gap-6">
                <div class="w-8 text-center">
                  <div class="text-amber-400 font-bold text-lg">{score.total}</div>
                </div>
                <div class="w-8 text-center">
                  <div style={getPotentialColor(score.potential, sortedScores)}>{score.potential}</div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Desktop View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full divide-y divide-zinc-800">
          <thead>
            <tr class="bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
              <th class="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-12">Rank</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                NAME
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider">
                Total
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Potential
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                R1
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                R2
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                S16
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Elite 8
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Final 4
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                CHAMP
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Games
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800">
            {#each sortedScores as score, index}
              <tr 
                class="transition-colors duration-150
                       {index % 2 === 0 ? 'bg-zinc-800/30 hover:bg-zinc-800/40' : 'hover:bg-zinc-800/20'}"
                in:fade={fadeStagger(index)}
              >
                <td class="px-6 py-2 whitespace-nowrap">
                  <span class="text-amber-500 font-bold bg-amber-500/10 rounded-full py-1 px-3">{getRankLabel(ranks[index])}</span>
                </td>
                <td class="px-6 py-2 whitespace-nowrap">
                  <button 
                    class={getNameButtonClass(score)}
                    on:click={() => handleNameClick(score)}
                  >
                    <span class="text-zinc-100 font-medium">{score.firstName} {score.lastName}</span>
                  </button>
                </td>
                <td class="px-2 whitespace-nowrap text-center text-amber-400 font-bold text-lg">{score.total}</td>
                <td class="px-2 whitespace-nowrap text-center">
                  <span style={getPotentialColor(score.potential, sortedScores)}>{score.potential}</span>
                </td>
                <td class="px-2 whitespace-nowrap text-center text-white">{score.round1}</td>
                <td class="px-2 whitespace-nowrap text-center text-white">{score.round2}</td>
                <td class="px-2 whitespace-nowrap text-center text-white">{score.round3}</td>
                <td class="px-2 whitespace-nowrap text-center">
                  <div class="flex justify-center gap-1">
                    {#if teamSelectionsByEntryId[score.entryId]?.e8?.length > 0}
                      {#each teamSelectionsByEntryId[score.entryId].e8 as team, idx}
                        {@const overlayInfo = getTeamOverlayStyle(team, score, 56 + idx)}
                        <div 
                          class={teamLogoContainerClass} 
                          title={team}
                          style={getTeamContainerStyle(team, overlayInfo.isEliminatedOrCorrect)}
                        >
                          <img src="/images/team-logos/{getTeamSeoName(team)}.svg" 
                               alt={team} 
                               class={teamLogoClass}
                               style="filter: url(#teamLogoOutline) {overlayInfo.isEliminatedOrCorrect ? 'saturate(0.3)' : ''};"
                               on:error={handleImageError}>
                          <div 
                            class="absolute inset-0 rounded-lg"
                            style={overlayInfo.style}
                          ></div>
                        </div>
                      {/each}
                    {:else}
                      <span class="text-zinc-500 text-sm">-</span>
                    {/if}
                  </div>
                </td>
                <td class="px-2 whitespace-nowrap text-center">
                  <div class="flex justify-center gap-1">
                    {#if teamSelectionsByEntryId[score.entryId]?.f4?.length > 0}
                      {#each teamSelectionsByEntryId[score.entryId].f4 as team, idx}
                        {@const overlayInfo = getTeamOverlayStyle(team, score, 60 + idx)}
                        <div 
                          class={teamLogoContainerClass} 
                          title={team}
                          style={getTeamContainerStyle(team, overlayInfo.isEliminatedOrCorrect)}
                        >
                          <img src="/images/team-logos/{getTeamSeoName(team)}.svg" 
                               alt={team} 
                               class={teamLogoClass}
                               style="filter: url(#teamLogoOutline) {overlayInfo.isEliminatedOrCorrect ? 'saturate(0.3)' : ''};"
                               on:error={handleImageError}>
                          <div 
                            class="absolute inset-0 rounded-lg"
                            style={overlayInfo.style}
                          ></div>
                        </div>
                      {/each}
                    {:else}
                      <span class="text-zinc-500 text-sm">-</span>
                    {/if}
                  </div>
                </td>
                <td class="px-2 whitespace-nowrap text-center">
                  <div class="flex justify-center">
                    {#if teamSelectionsByEntryId[score.entryId]?.champ}
                      {@const champTeam = teamSelectionsByEntryId[score.entryId].champ}
                      {@const overlayInfo = getTeamOverlayStyle(champTeam, score, 62)}
                      <div 
                        class={teamLogoContainerClass} 
                        title={champTeam}
                        style={getTeamContainerStyle(champTeam, overlayInfo.isEliminatedOrCorrect)}
                      >
                        <img src="/images/team-logos/{getTeamSeoName(champTeam)}.svg" 
                             alt={champTeam} 
                             class={teamLogoClass}
                             style="filter: url(#teamLogoOutline) {overlayInfo.isEliminatedOrCorrect ? 'saturate(0.3)' : ''};"
                             on:error={handleImageError}>
                        <div 
                          class="absolute inset-0 rounded-lg"
                          style={overlayInfo.style}
                        ></div>
                      </div>
                    {:else}
                      <span class="text-zinc-500 text-sm">-</span>
                    {/if}
                  </div>
                </td>
                <td class="px-2 whitespace-nowrap text-center text-white">{score.correctGames}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
