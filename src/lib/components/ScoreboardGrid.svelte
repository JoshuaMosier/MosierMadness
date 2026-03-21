<script lang="ts">
  import { getStatusColor, sortScoreboardGames } from '$lib/utils/scoreboardUtils';
  import { getGradientStyleFromColor } from '$lib/utils/teamColorUtils';
  import { handleImageError } from '$lib/utils/imageUtils';
  import { canViewGameDetails } from '$lib/utils/stageUtils';
  import type { TournamentSettings, ScoreboardGame } from '$lib/types';

  export let tournamentSettings: TournamentSettings | any = {};
  export let scores: ScoreboardGame[] = [];

  $: matches = scores;
  $: tournamentStage = tournamentSettings?.stage || 'archive';
  $: isTournamentMode = tournamentStage === 'tournament-live' || tournamentStage === 'bracket-open';
  $: scoreboardTitle =
    isTournamentMode
      ? 'Tournament Scoreboard'
      : 'Live Scoreboard';
  $: scoreboardSubtitle =
    isTournamentMode
      ? 'Showing active tournament games from the current settings window'
      : 'Showing today\'s NCAA games based on the current tournament settings';
  $: emptyStateMessage =
    isTournamentMode
      ? 'No tournament games are scheduled in the current settings window.'
      : 'No NCAA games are scheduled today.';
  
  // Helper function to determine if a team is a winner
  function isWinner(team: any): boolean {
    return team?.winner === true;
  }

  // Update the sortedMatches computed property
  $: sortedMatches = sortScoreboardGames(matches);

  // Helper function to get team background style
  function getTeamStyle(team: any): string {
    return getGradientStyleFromColor(team?.color);
  }

  // Helper function to get appropriate team name based on length
  function getDisplayName(team: any): string {
    return team?.displayName || team?.name || '';
  }

  function getGameHref(game: any): string | null {
    return game?.isTournamentGame && canViewGameDetails(tournamentStage) ? `/game/${game.gameId}` : null;
  }
</script>

<div class="min-h-screen py-4 sm:py-8 px-2 sm:px-4 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-4 sm:mb-6">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-white">{scoreboardTitle}</h1>
        <div class="mt-1 text-xs sm:text-sm text-gray-400">{scoreboardSubtitle}</div>
      </div>
      <div class="text-xs sm:text-sm text-gray-400">Live updates</div>
    </div>

    {#if matches.length === 0}
      <div class="w-full py-4 text-center text-white">
        {emptyStateMessage}
      </div>
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
        {#each sortedMatches as game, index (game.gameId)}
          <svelte:element
            this={getGameHref(game) ? 'a' : 'div'}
            href={getGameHref(game)}
            data-sveltekit-preload-data={getGameHref(game) ? 'tap' : undefined}
            class="game-box bg-gradient-to-br from-stone-950/90 to-black/90 rounded-lg sm:rounded-xl p-2 sm:p-5 border border-white/10 shadow-lg"
          >
            <div class="game-date flex justify-between items-center mb-2 sm:mb-3">
              <span class="text-xs sm:text-sm text-gray-400 font-semibold">{game.statusLabel !== 'FINAL' ? (game.displayClock || '') : ''}</span>
              <span class="game-prog {getStatusColor(game.statusLabel)} font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm {game.statusLabel === 'LIVE' ? 'bg-yellow-300/10 animate-pulse' : game.statusLabel === 'FINAL' ? 'bg-white/10' : 'bg-gray-700/50'}">{game.statusLabel}</span>
            </div>
            
            <div class="game-teams space-y-2 sm:space-y-4">
              <!-- Away Team -->
              <div class="game-team flex items-center space-x-1 sm:space-x-2 py-1 sm:py-2 {isWinner(game.awayTeam) ? 'font-bold' : ''} group">
                <div class="relative w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                  <img class="w-full h-full object-contain" 
                       alt="{game.awayTeam.name} logo" 
                       src="/images/team-logos/{game.awayTeam.seoName}.svg"
                       on:error={handleImageError}>
                </div>
                {#if game.awayTeam.seed}
                  <span class="rank text-xxs sm:text-xs bg-gray-700 text-white px-1 sm:px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 min-w-[1.5rem] sm:min-w-[2rem] inline-block text-center">#{game.awayTeam.seed}</span>
                {/if}
                <span class="text-sm sm:text-lg px-1 sm:px-2 py-0.5 sm:py-1 rounded-md flex-grow {isWinner(game.awayTeam) ? 'text-white font-semibold' : isWinner(game.homeTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm truncate"
                      style={getTeamStyle(game.awayTeam)}>
                  {getDisplayName(game.awayTeam)}
                </span>
                <span class="score-value text-lg sm:text-2xl font-bold tabular-nums flex-shrink-0 {isWinner(game.awayTeam) ? 'text-white' : 'text-gray-400'}">{game.awayTeam.scoreText}</span>
              </div>
              
              <!-- Home Team -->
              <div class="game-team flex items-center space-x-1 sm:space-x-2 py-1 sm:py-2 {isWinner(game.homeTeam) ? 'font-bold' : ''} group">
                <div class="relative w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                  <img class="w-full h-full object-contain" 
                       alt="{game.homeTeam.name} logo" 
                       src="/images/team-logos/{game.homeTeam.seoName}.svg"
                       on:error={handleImageError}>
                </div>
                {#if game.homeTeam.seed}
                  <span class="rank text-xxs sm:text-xs bg-gray-700 text-white px-1 sm:px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 min-w-[1.5rem] sm:min-w-[2rem] inline-block text-center">#{game.homeTeam.seed}</span>
                {/if}
                <span class="text-sm sm:text-lg px-1 sm:px-2 py-0.5 sm:py-1 rounded-md flex-grow {isWinner(game.homeTeam) ? 'text-white font-semibold' : isWinner(game.awayTeam) ? 'text-white/75 line-through' : 'text-white'} transition-all duration-200 shadow-sm truncate"
                      style={getTeamStyle(game.homeTeam)}>
                  {getDisplayName(game.homeTeam)}
                </span>
                <span class="score-value text-lg sm:text-2xl font-bold tabular-nums flex-shrink-0 {isWinner(game.homeTeam) ? 'text-white' : 'text-gray-400'}">{game.homeTeam.scoreText}</span>
              </div>
            </div>
          </svelte:element>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Add text-xxs size for very small text on mobile */
  .text-xxs {
    font-size: 0.65rem;
    line-height: 0.85rem;
  }
</style>
