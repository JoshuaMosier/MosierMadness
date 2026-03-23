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
  let viewerTimeZone: string | null = null;

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

  function getDisplayTimeZone(): string {
    return viewerTimeZone || 'America/New_York';
  }

  function getTickerDateFormatter(): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      timeZone: getDisplayTimeZone(),
    });
  }

  function getTickerDateTimeFormatter(): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: getDisplayTimeZone(),
      timeZoneName: 'short',
    });
  }

  function getTimeZoneShortLabel(referenceDate: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: getDisplayTimeZone(),
      timeZoneName: 'short',
    }).formatToParts(referenceDate).find(part => part.type === 'timeZoneName')?.value || '';
  }

  function padTimePart(value: string): string {
    return value.padStart(2, '0');
  }

  function parseGameDateParts(value: string): { year: number; month: number; day: number } | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    return {
      year: Number.parseInt(match[1], 10),
      month: Number.parseInt(match[2], 10),
      day: Number.parseInt(match[3], 10),
    };
  }

  function getNthSundayOfMonth(year: number, monthIndex: number, occurrence: number): number {
    const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
    const firstSunday = 1 + ((7 - firstOfMonth.getUTCDay()) % 7);
    return firstSunday + ((occurrence - 1) * 7);
  }

  function getEasternUtcOffsetForDate(dateValue: string): string {
    const parts = parseGameDateParts(dateValue);
    if (!parts) {
      return '-04:00';
    }

    const dateKey = (parts.year * 10_000) + (parts.month * 100) + parts.day;
    const dstStartKey = (parts.year * 10_000) + 300 + getNthSundayOfMonth(parts.year, 2, 2);
    const dstEndKey = (parts.year * 10_000) + 1100 + getNthSundayOfMonth(parts.year, 10, 1);
    return dateKey >= dstStartKey && dateKey < dstEndKey ? '-04:00' : '-05:00';
  }

  function parseScheduledStart(game: ScoreboardGame): Date | null {
    const rawStartTime = String(game?.startTime || '').trim();
    const rawScheduledTime = rawStartTime || String(game?.displayClock || '').trim();
    const rawGameDate = String(game?.gameDate || '').trim();

    if (!rawScheduledTime) {
      return null;
    }

    if (/[zZ]|[+-]\d{2}:\d{2}$/.test(rawScheduledTime)) {
      const parsedDate = new Date(rawScheduledTime);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    const dateTimeMatch = rawScheduledTime.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (dateTimeMatch) {
      const dateValue = dateTimeMatch[1];
      const easternTimestamp = `${dateValue}T${padTimePart(dateTimeMatch[2])}:${dateTimeMatch[3]}:${dateTimeMatch[4] || '00'}${getEasternUtcOffsetForDate(dateValue)}`;
      const parsedDate = new Date(easternTimestamp);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    const timeOnlyMatch = rawScheduledTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeOnlyMatch && rawGameDate) {
      const easternTimestamp = `${rawGameDate}T${padTimePart(timeOnlyMatch[1])}:${timeOnlyMatch[2]}:${timeOnlyMatch[3] || '00'}${getEasternUtcOffsetForDate(rawGameDate)}`;
      const parsedDate = new Date(easternTimestamp);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    const fallbackParsedDate = new Date(rawScheduledTime);
    return Number.isNaN(fallbackParsedDate.getTime()) ? null : fallbackParsedDate;
  }

  function formatMilitaryTime(value: string | null | undefined): string {
    const rawValue = String(value || '').trim();
    const match = rawValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

    if (!match) {
      return rawValue;
    }

    const hour24 = Number.parseInt(match[1], 10);
    if (!Number.isFinite(hour24)) {
      return rawValue;
    }

    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${match[2]} ${hour24 >= 12 ? 'PM' : 'AM'}`;
  }

  function formatGameDate(game: ScoreboardGame): string {
    const rawDate = String(game?.gameDate || '').trim();
    if (!rawDate) {
      return '';
    }

    const parsedDate = new Date(`${rawDate}T12:00:00-04:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return getTickerDateFormatter().format(parsedDate);
  }

  function formatScheduledStart(game: ScoreboardGame): string {
    const parsedDate = parseScheduledStart(game);
    if (parsedDate) {
      const parts = getTickerDateTimeFormatter().formatToParts(parsedDate);
      const month = parts.find(part => part.type === 'month')?.value || '';
      const day = parts.find(part => part.type === 'day')?.value || '';
      const hour = parts.find(part => part.type === 'hour')?.value || '';
      const minute = parts.find(part => part.type === 'minute')?.value || '';
      const dayPeriod = parts.find(part => part.type === 'dayPeriod')?.value || '';
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';
      const dateLabel = month && day ? `${month}/${day}` : '';
      const timeLabel = hour && minute ? `${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ''}` : '';

      return [dateLabel, timeLabel, timeZoneName].filter(Boolean).join(' ');
    }

    const rawStartTime = String(game?.startTime || '').trim();
    const rawScheduledTime = rawStartTime || String(game?.displayClock || '').trim();
    const gameDateLabel = formatGameDate(game);
    const timeLabel = formatMilitaryTime(rawScheduledTime);
    const timeZoneLabel = getTimeZoneShortLabel();

    if (gameDateLabel && timeLabel && timeZoneLabel) {
      return `${gameDateLabel}, ${timeLabel} ${timeZoneLabel}`;
    }

    if (gameDateLabel && timeLabel) {
      return `${gameDateLabel}, ${timeLabel}`;
    }

    return gameDateLabel || timeLabel || rawStartTime;
  }

  function getGameClockLabel(game: ScoreboardGame): string {
    const status = (game?.statusLabel || game?.status || '').toUpperCase();

    if (status === 'FINAL') {
      return '';
    }

    if (status === 'PRE') {
      return formatScheduledStart(game);
    }

    return game?.displayClock || '';
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
    viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;

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
      <div class="relative">
        <div class="absolute -top-10 right-0 hidden md:block">
          <a href="/scores" class="bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl hover:transform hover:scale-[1.02]">
            <span>{viewAllLabel}</span>
          </a>
        </div>

        <div class="mb-3 flex justify-center md:hidden px-2 pt-2">
          <a href="/scores"
             on:click|preventDefault={() => { window.location.href = '/scores'; }}
             class="bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 shadow-lg active:bg-black/70 touch-manipulation">
            <span>{viewAllLabel}</span>
          </a>
        </div>

        <div class="p-2 pt-3 md:pt-2">
          <!-- Desktop: flex wrap layout -->
          <div class="hidden md:flex md:flex-wrap md:gap-2 md:justify-center">
            {#each sortedGames as game, index}
              <a href={getGameHref(game)} data-sveltekit-preload-data="tap" class="flex-shrink-0 w-[17rem]">
                <div class="game-box ticker-card px-3.5 py-2.5">
                  <div class="game-date ticker-card__meta flex justify-between items-center mb-2">
                    <span class="ticker-clock">{getGameClockLabel(game)}</span>
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
              <a href={getGameHref(game)} data-sveltekit-preload-data="tap" class="flex-shrink-0 mx-1 w-[17rem]">
                <div class="game-box ticker-card px-3.5 py-2.5">
                  <div class="game-date ticker-card__meta flex justify-between items-center mb-2">
                    <span class="ticker-clock">{getGameClockLabel(game)}</span>
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
              <a href={getGameHref(game)} data-sveltekit-preload-data="tap" class="flex-shrink-0 mx-1 w-[17rem]">
                <div class="game-box ticker-card px-3.5 py-2.5">
                  <div class="game-date ticker-card__meta flex justify-between items-center mb-2">
                    <span class="ticker-clock">{getGameClockLabel(game)}</span>
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
                  <a href={getGameHref(game)} data-sveltekit-preload-data="tap" class="flex-shrink-0 mx-2 w-[17rem] marquee-card">
                    <div class="game-box ticker-card px-3.5 py-2.5">
                      <div class="game-date ticker-card__meta flex justify-between items-center mb-2">
                        <span class="ticker-clock">{getGameClockLabel(game)}</span>
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
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    min-height: 1.4rem;
    gap: 0.6rem;
  }

  .ticker-team-stack {
    display: grid;
    gap: 0.45rem;
  }

  .ticker-clock {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--mm-subtle);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
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
