<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { sortScoreboardGames } from '$lib/utils/scoreboardUtils';
  import { getGradientStyleFromColor } from '$lib/utils/teamColorUtils';
  import { handleImageError } from '$lib/utils/imageUtils';
  import { canViewGameDetails } from '$lib/utils/stageUtils';
  import type { TournamentSettings, ScoreboardGame } from '$lib/types';

  export let tournamentSettings: TournamentSettings | any = {};
  export let tickerScores: ScoreboardGame[] = [];

  const logoOutlineFilter = `
  <svg width="0" height="0" style="position: absolute;">
    <defs>
      <filter id="tickerLogoOutline" x="-20%" y="-20%" width="140%" height="140%">
        <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="blackThicken" />
        <feFlood flood-color="black" result="blackOutline" />
        <feComposite in="blackOutline" in2="blackThicken" operator="in" result="blackOutline" />
        <feMorphology operator="dilate" radius="0.5" in="SourceAlpha" result="whiteThicken" />
        <feFlood flood-color="#a1a1aa" result="whiteOutline" />
        <feComposite in="whiteOutline" in2="whiteThicken" operator="in" result="whiteOutline" />
        <feComposite in="whiteOutline" in2="blackOutline" operator="over" result="outlines" />
        <feComposite in="SourceGraphic" in2="outlines" operator="over" />
      </filter>
    </defs>
  </svg>
  `;

  $: matches = tickerScores;
  let duplicatedMatches: ScoreboardGame[] = [];
  let marqueeContent: HTMLDivElement | null = null;
  let rafId: number | null = null;
  const MARQUEE_DURATION_S = 200;

  $: tournamentStage = tournamentSettings?.stage || 'archive';
  $: viewAllLabel = tournamentStage === 'tournament-live' || tournamentStage === 'bracket-open' ? 'Tournament Scores' : 'Today\'s Scores';
  $: emptyStateMessage =
    tournamentStage === 'tournament-live' || tournamentStage === 'bracket-open'
      ? 'No tournament games scheduled right now.'
      : 'No games scheduled at this time.';
  
  // Helper function to determine if a team is a winner
  function isWinner(team: any): boolean {
    return team?.winner === true;
  }
  
  // Determine display mode based on number of games
  $: displayMode = matches.length <= 4 ? 'featured' : 'scroll';
  
  // Sort games by status and time
  $: sortedGames = sortScoreboardGames(matches);

  // Helper function to get team background style
  function getTeamStyle(team: any): string {
    return getGradientStyleFromColor(team?.color);
  }

  // Helper function to get appropriate team name based on length
  function getDisplayName(team: any): string {
    return team?.displayName || team?.name || '';
  }

  function getGameHref(game: any): string {
    return game?.isTournamentGame && canViewGameDetails(tournamentStage) ? `/game/${game.gameId}` : '/scores';
  }

  function getStatusClass(status: string | null | undefined): string {
    switch ((status || '').toUpperCase()) {
      case 'LIVE':
        return 'ticker-status is-live animate-pulse';
      case 'FINAL':
        return 'ticker-status is-final';
      case 'PRE':
        return 'ticker-status is-pre';
      default:
        return 'ticker-status';
    }
  }

  function getTeamNameClass(team: any, opponent: any): string {
    if (isWinner(team)) {
      return 'ticker-team-name is-winner';
    }

    if (isWinner(opponent)) {
      return 'ticker-team-name is-loser';
    }

    return 'ticker-team-name';
  }

  function getSeedClass(team: any): string {
    return isWinner(team) ? 'ticker-seed is-winner' : 'ticker-seed';
  }

  function getScoreClass(team: any): string {
    const scoreText = String(team?.scoreText ?? '').trim();

    if (!scoreText) {
      return 'ticker-score is-empty';
    }

    return isWinner(team) ? 'ticker-score is-winner' : 'ticker-score';
  }

  // Build duplicatedMatches for marquee: 2× for seamless scroll when 5+ games (reduced from 3× for less DOM/compositing)
  $: {
    if (matches.length > 4) {
      duplicatedMatches = [...sortedGames, ...sortedGames];
    } else {
      duplicatedMatches = sortedGames;
    }
  }

  // JS-driven pixel-snapped marquee animation (avoids sub-pixel rendering stutter)
  function tick(startTime: number): void {
    if (!marqueeContent || displayMode !== 'scroll' || !marqueeContent.offsetParent) return;
    const contentWidth = marqueeContent.scrollWidth;
    if (contentWidth <= 0) {
      rafId = requestAnimationFrame(() => tick(startTime));
      return;
    }
    const halfWidth = contentWidth * 0.5;
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = (elapsed / MARQUEE_DURATION_S) % 1;
    const offset = -progress * halfWidth;
    const dpr = window.devicePixelRatio || 1;
    const snapped = Math.round(offset * dpr) / dpr;
    marqueeContent.style.transform = `translateX(${snapped}px)`;
    rafId = requestAnimationFrame(() => tick(startTime));
  }

  onMount(() => {
    if (displayMode === 'scroll' && marqueeContent) {
      const startTime = Date.now();
      rafId = requestAnimationFrame(() => tick(startTime));
    }
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });

  // Restart animation when switching to scroll mode or when content changes
  $: if (displayMode === 'scroll' && marqueeContent && !rafId) {
    const startTime = Date.now();
    rafId = requestAnimationFrame(() => tick(startTime));
  }
</script>

{@html logoOutlineFilter}

{#if matches.length === 0}
  <div class="w-full py-4 text-center text-white">
    {emptyStateMessage}
  </div>
{:else}
  <div class="w-full ticker-shell">
    <!-- Featured mode for 1-4 games - show in a static layout -->
    {#if displayMode === 'featured'}
      <div class="p-2">
        <!-- Desktop: flex wrap layout -->
        <div class="hidden md:flex md:flex-wrap md:gap-2 md:justify-center">
          {#each sortedGames as game, index}
            <a href={getGameHref(game)} class="flex-shrink-0 w-[17rem]">
              <div class="game-box ticker-card px-3.5 py-2.5">
                <div class="game-date ticker-card__meta flex justify-between items-center mb-2">
                  <span class="ticker-clock">{game.statusLabel !== 'FINAL' ? (game.displayClock || '') : ''}</span>
                  <span class={getStatusClass(game.statusLabel)}>{game.statusLabel}</span>
                </div>
                
                <div class="game-teams ticker-team-stack">
                  <!-- Away Team -->
                  <div class="game-team ticker-team-row {isWinner(game.awayTeam) ? 'font-bold' : ''} group">
                    <div class="ticker-team-main">
                      <div class="relative w-6 h-6 flex-shrink-0">
                        <img class="ticker-logo w-full h-full object-contain transition-transform" 
                             alt="{game.awayTeam.name} logo" 
                             src="/images/team-logos/{game.awayTeam.seoName}.svg"
                             on:error={handleImageError}>
                      </div>
                      {#if game.awayTeam.seed}
                        <span class={getSeedClass(game.awayTeam)}>#{game.awayTeam.seed}</span>
                      {/if}
                      <span class="{getTeamNameClass(game.awayTeam, game.homeTeam)} whitespace-nowrap overflow-hidden text-ellipsis flex-shrink"
                            style={getTeamStyle(game.awayTeam)}>
                        {getDisplayName(game.awayTeam)}
                      </span>
                    </div>
                    <div class="ticker-score-slot">
                      <span class={getScoreClass(game.awayTeam)}>{game.awayTeam.scoreText}</span>
                    </div>
                  </div>
                  
                  <!-- Home Team -->
                  <div class="game-team ticker-team-row {isWinner(game.homeTeam) ? 'font-bold' : ''} group">
                    <div class="ticker-team-main">
                      <div class="relative w-6 h-6 flex-shrink-0">
                        <img class="ticker-logo w-full h-full object-contain transition-transform" 
                             alt="{game.homeTeam.name} logo" 
                             src="/images/team-logos/{game.homeTeam.seoName}.svg"
                             on:error={handleImageError}>
                      </div>
                      {#if game.homeTeam.seed}
                        <span class={getSeedClass(game.homeTeam)}>#{game.homeTeam.seed}</span>
                      {/if}
                      <span class="{getTeamNameClass(game.homeTeam, game.awayTeam)} whitespace-nowrap overflow-hidden text-ellipsis flex-shrink"
                            style={getTeamStyle(game.homeTeam)}>
                        {getDisplayName(game.homeTeam)}
                      </span>
                    </div>
                    <div class="ticker-score-slot">
                      <span class={getScoreClass(game.homeTeam)}>{game.homeTeam.scoreText}</span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          {/each}
        </div>
        
        <!-- Mobile: horizontal scroll layout -->
        <div class="flex md:hidden overflow-x-auto py-2 px-1 scrollbar-hide">
          {#each sortedGames as game, index}
            <a href={getGameHref(game)} class="flex-shrink-0 mx-1 w-[17rem]">
              <div class="game-box ticker-card px-3.5 py-2.5">
                <div class="game-date ticker-card__meta flex justify-between items-center mb-2">
                  <span class="ticker-clock">{game.statusLabel !== 'FINAL' ? (game.displayClock || '') : ''}</span>
                  <span class={getStatusClass(game.statusLabel)}>{game.statusLabel}</span>
                </div>
                
                <div class="game-teams ticker-team-stack">
                  <!-- Away Team -->
                  <div class="game-team ticker-team-row {isWinner(game.awayTeam) ? 'font-bold' : ''} group">
                    <div class="ticker-team-main">
                      <div class="relative w-6 h-6 flex-shrink-0">
                        <img class="ticker-logo w-full h-full object-contain transition-transform" 
                             alt="{game.awayTeam.name} logo" 
                             src="/images/team-logos/{game.awayTeam.seoName}.svg"
                             on:error={handleImageError}>
                      </div>
                      {#if game.awayTeam.seed}
                        <span class={getSeedClass(game.awayTeam)}>#{game.awayTeam.seed}</span>
                      {/if}
                      <span class="{getTeamNameClass(game.awayTeam, game.homeTeam)} whitespace-nowrap overflow-hidden text-ellipsis flex-shrink"
                            style={getTeamStyle(game.awayTeam)}>
                        {getDisplayName(game.awayTeam)}
                      </span>
                    </div>
                    <div class="ticker-score-slot">
                      <span class={getScoreClass(game.awayTeam)}>{game.awayTeam.scoreText}</span>
                    </div>
                  </div>
                  
                  <!-- Home Team -->
                  <div class="game-team ticker-team-row {isWinner(game.homeTeam) ? 'font-bold' : ''} group">
                    <div class="ticker-team-main">
                      <div class="relative w-6 h-6 flex-shrink-0">
                        <img class="ticker-logo w-full h-full object-contain transition-transform" 
                             alt="{game.homeTeam.name} logo" 
                             src="/images/team-logos/{game.homeTeam.seoName}.svg"
                             on:error={handleImageError}>
                      </div>
                      {#if game.homeTeam.seed}
                        <span class={getSeedClass(game.homeTeam)}>#{game.homeTeam.seed}</span>
                      {/if}
                      <span class="{getTeamNameClass(game.homeTeam, game.awayTeam)} whitespace-nowrap overflow-hidden text-ellipsis flex-shrink"
                            style={getTeamStyle(game.homeTeam)}>
                        {getDisplayName(game.homeTeam)}
                      </span>
                    </div>
                    <div class="ticker-score-slot">
                      <span class={getScoreClass(game.homeTeam)}>{game.homeTeam.scoreText}</span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    
    <!-- Scroll mode for 5+ games - show scrolling ticker -->
    {:else}
      <div class="relative">
        <!-- Desktop View All Scores Button -->
        <div class="absolute -top-10 right-0 hidden md:block">
          <a href="/scores" class="bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl hover:transform hover:scale-[1.02]">
            <span>{viewAllLabel}</span>
          </a>
        </div>

        <!-- Mobile View All Scores button - always visible above the scores -->
        <div class="mb-3 flex justify-center md:hidden">
          <a href="/scores" 
             on:click|preventDefault={(e) => { window.location.href = '/scores'; }}
             class="bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 shadow-lg active:bg-black/70 touch-manipulation">
            <span>{viewAllLabel}</span>
          </a>
        </div>

        <div class="score-ticker relative py-2">
          <!-- Mobile view: scrollable container -->
          <div class="md:hidden flex overflow-x-auto py-2 px-1 scrollbar-hide">
            {#each sortedGames as game, index}
              <a href={getGameHref(game)} class="flex-shrink-0 mx-1 w-[17rem]">
                <div class="game-box ticker-card px-3.5 py-2.5">
                  <div class="game-date ticker-card__meta flex justify-between items-center mb-2">
                    <span class="ticker-clock">{game.statusLabel !== 'FINAL' ? (game.displayClock || '') : ''}</span>
                    <span class={getStatusClass(game.statusLabel)}>{game.statusLabel}</span>
                  </div>
                  
                  <div class="game-teams ticker-team-stack">
                    <!-- Away Team -->
                    <div class="game-team ticker-team-row {isWinner(game.awayTeam) ? 'font-bold' : ''} group">
                      <div class="ticker-team-main">
                        <div class="relative w-6 h-6 flex-shrink-0">
                          <img class="ticker-logo w-full h-full object-contain transition-transform" 
                               alt="{game.awayTeam.name} logo" 
                               src="/images/team-logos/{game.awayTeam.seoName}.svg"
                               on:error={handleImageError}>
                        </div>
                        {#if game.awayTeam.seed}
                          <span class={getSeedClass(game.awayTeam)}>#{game.awayTeam.seed}</span>
                        {/if}
                        <span class="{getTeamNameClass(game.awayTeam, game.homeTeam)} whitespace-nowrap overflow-hidden text-ellipsis flex-shrink"
                              style={getTeamStyle(game.awayTeam)}>
                          {getDisplayName(game.awayTeam)}
                        </span>
                      </div>
                      <div class="ticker-score-slot">
                        <span class={getScoreClass(game.awayTeam)}>{game.awayTeam.scoreText}</span>
                      </div>
                    </div>
                    
                    <!-- Home Team -->
                    <div class="game-team ticker-team-row {isWinner(game.homeTeam) ? 'font-bold' : ''} group">
                      <div class="ticker-team-main">
                        <div class="relative w-6 h-6 flex-shrink-0">
                          <img class="ticker-logo w-full h-full object-contain transition-transform" 
                               alt="{game.homeTeam.name} logo" 
                               src="/images/team-logos/{game.homeTeam.seoName}.svg"
                               on:error={handleImageError}>
                        </div>
                        {#if game.homeTeam.seed}
                          <span class={getSeedClass(game.homeTeam)}>#{game.homeTeam.seed}</span>
                        {/if}
                        <span class="{getTeamNameClass(game.homeTeam, game.awayTeam)} whitespace-nowrap overflow-hidden text-ellipsis flex-shrink"
                              style={getTeamStyle(game.homeTeam)}>
                          {getDisplayName(game.homeTeam)}
                        </span>
                      </div>
                      <div class="ticker-score-slot">
                        <span class={getScoreClass(game.homeTeam)}>{game.homeTeam.scoreText}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          </div>
          
          <!-- Desktop view: auto-scrolling marquee -->
          <div class="hidden md:block overflow-hidden relative marquee-mask">
            <div class="marquee-container">
              <div class="marquee-content" bind:this={marqueeContent}>
                {#each duplicatedMatches as game, index}
                  <a href={getGameHref(game)} class="flex-shrink-0 mx-2 w-[17rem] marquee-card">
                    <div class="game-box ticker-card px-3.5 py-2.5">
                      <div class="game-date ticker-card__meta flex justify-between items-center mb-2">
                        <span class="ticker-clock">{game.statusLabel !== 'FINAL' ? (game.displayClock || '') : ''}</span>
                        <span class={getStatusClass(game.statusLabel)}>{game.statusLabel}</span>
                      </div>
                      
                      <div class="game-teams ticker-team-stack">
                        <!-- Away Team - fixed widths to prevent flex layout thrashing -->
                        <div class="game-team ticker-team-row {isWinner(game.awayTeam) ? 'font-bold' : ''} group">
                          <div class="ticker-team-main marquee-team-row">
                            <div class="relative w-6 h-6 flex-shrink-0">
                              <img class="ticker-logo w-full h-full object-contain" 
                                   alt="{game.awayTeam.name} logo" 
                                   src="/images/team-logos/{game.awayTeam.seoName}.svg"
                                   on:error={handleImageError}>
                            </div>
                            {#if game.awayTeam.seed}
                              <span class={getSeedClass(game.awayTeam)}>#{game.awayTeam.seed}</span>
                            {/if}
                            <span class="{getTeamNameClass(game.awayTeam, game.homeTeam)} whitespace-nowrap overflow-hidden text-ellipsis w-[7.5rem] flex-shrink-0"
                                  style={getTeamStyle(game.awayTeam)}>
                              {getDisplayName(game.awayTeam)}
                            </span>
                          </div>
                          <div class="ticker-score-slot">
                            <span class={getScoreClass(game.awayTeam)}>{game.awayTeam.scoreText}</span>
                          </div>
                        </div>
                        
                        <!-- Home Team - fixed widths to prevent flex layout thrashing -->
                        <div class="game-team ticker-team-row {isWinner(game.homeTeam) ? 'font-bold' : ''} group">
                          <div class="ticker-team-main marquee-team-row">
                            <div class="relative w-6 h-6 flex-shrink-0">
                              <img class="ticker-logo w-full h-full object-contain" 
                                   alt="{game.homeTeam.name} logo" 
                                   src="/images/team-logos/{game.homeTeam.seoName}.svg"
                                   on:error={handleImageError}>
                            </div>
                            {#if game.homeTeam.seed}
                              <span class={getSeedClass(game.homeTeam)}>#{game.homeTeam.seed}</span>
                            {/if}
                            <span class="{getTeamNameClass(game.homeTeam, game.awayTeam)} whitespace-nowrap overflow-hidden text-ellipsis w-[7.5rem] flex-shrink-0"
                                  style={getTeamStyle(game.homeTeam)}>
                              {getDisplayName(game.homeTeam)}
                            </span>
                          </div>
                          <div class="ticker-score-slot">
                            <span class={getScoreClass(game.homeTeam)}>{game.homeTeam.scoreText}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }

  .ticker-shell {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 0.65rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.28), 0 4px 6px -4px rgba(0, 0, 0, 0.24);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  .ticker-card {
    position: relative;
    overflow: hidden;
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(10, 10, 12, 0.48);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 10px 22px rgba(0, 0, 0, 0.18);
    transition:
      border-color 180ms ease,
      background-color 180ms ease,
      box-shadow 180ms ease;
  }

  a:hover .ticker-card,
  a:focus-visible .ticker-card {
    border-color: rgba(255, 255, 255, 0.18);
    background: rgba(14, 14, 16, 0.56);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 14px 28px rgba(0, 0, 0, 0.22);
  }

  .ticker-card__meta {
    min-height: 1.4rem;
    gap: 0.6rem;
  }

  .ticker-team-stack {
    display: grid;
    gap: 0.45rem;
  }

  .ticker-clock {
    color: var(--mm-subtle);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .ticker-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 4.75rem;
    padding: 0.26rem 0.68rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(39, 39, 42, 0.7);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    color: #d4d4d8;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    line-height: 1;
  }

  .ticker-status.is-live {
    border-color: rgba(253, 224, 71, 0.2);
    background: rgba(253, 224, 71, 0.1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    color: #fde047;
  }

  .ticker-status.is-final {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(50, 50, 56, 0.78);
    color: #f4f4f5;
  }

  .ticker-status.is-pre {
    color: #a1a1aa;
  }

  .ticker-team-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 2.7rem;
    align-items: center;
    column-gap: 0.55rem;
    min-height: 2.3rem;
  }

  .ticker-team-main {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
  }

  .marquee-team-row {
    gap: 0.4rem;
  }

  .ticker-logo {
    filter: url(#tickerLogoOutline) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.24));
  }

  .ticker-seed {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    min-width: 2rem;
    height: 1.35rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(63, 63, 70, 0.72);
    color: var(--mm-text);
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .ticker-seed.is-winner {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(82, 82, 91, 0.76);
  }

  .ticker-team-name {
    border-radius: 0.5rem;
    padding: 0.32rem 0.68rem;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.1;
    border: 0;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .ticker-team-name.is-winner {
    color: #ffffff;
  }

  .ticker-team-name.is-loser {
    color: rgba(255, 255, 255, 0.72);
    text-decoration: line-through;
    text-decoration-thickness: 1.5px;
    text-decoration-color: rgba(255, 255, 255, 0.24);
    filter: saturate(0.82);
  }

  .ticker-score-slot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 2.7rem;
    min-width: 2.7rem;
    min-height: 2.3rem;
  }

  .ticker-score {
    display: inline-block;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--mm-muted);
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 1.55rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }

  .ticker-score.is-winner {
    color: #ffffff;
  }

  .ticker-score.is-empty {
    color: transparent;
  }
  
  /* CSS mask replaces gradient overlay divs - reduces DOM and compositing */
  .marquee-mask {
    -webkit-mask-image: linear-gradient(to right, transparent 0, black 96px, black calc(100% - 96px), transparent 100%);
    mask-image: linear-gradient(to right, transparent 0, black 96px, black calc(100% - 96px), transparent 100%);
  }
  
  .marquee-container {
    width: 100%;
    overflow: hidden;
  }
  
  .marquee-content {
    display: flex;
    width: fit-content;
    white-space: nowrap;
    will-change: transform;
  }
  
  /* No per-card layer promotion - cards paint into marquee-content's single layer */
  .marquee-card {
    contain: layout;
  }
</style> 
