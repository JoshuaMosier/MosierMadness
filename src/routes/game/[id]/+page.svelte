<script lang="ts">
  import type { GameScenarioStakeBranch } from '$lib/types';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { handleImageError } from '$lib/utils/imageUtils';
  import { hexToRgb } from '$lib/utils/teamColorUtils';

  export let data: any;

  type PickEntry = {
    id: string;
    name: string;
    user_id: string | null;
  };

  type TeamSurface = {
    name: string;
    seed: number | null;
    seoName: string;
    color?: string;
    secondaryColor?: string;
    scoreText?: string;
    winner?: boolean;
    eliminated?: boolean;
  };

  type OtherTeamPick = {
    team: string;
    users: PickEntry[];
    count: number;
    seed: number;
    name: string;
    seoName: string;
    color: string;
    secondaryColor: string;
    eliminated: boolean;
  };

  type TeamSelectionState = {
    home: PickEntry[];
    away: PickEntry[];
    other: OtherTeamPick[];
  };

  type PickGroup = {
    key: string;
    side: 'away' | 'home' | 'other';
    label: string;
    team: TeamSurface;
    entries: PickEntry[];
    count: number;
  };

  type StakeCard = {
    key: 'away' | 'home';
    team: TeamSurface;
    branch: GameScenarioStakeBranch;
  };

  let gameData: any = null;
  let pageError: string | null = null;
  let teamSelections: TeamSelectionState = { home: [], away: [], other: [] };
  let scenarioStakes: { away: GameScenarioStakeBranch; home: GameScenarioStakeBranch; assumptionSummary: string } | null = null;
  let currentUserId: string | null = null;
  let tournamentStage = 'archive';
  let primaryGroups: PickGroup[] = [];
  let otherGroups: PickGroup[] = [];
  let pickGroups: PickGroup[] = [];
  let totalPickCount = 0;
  let directPickCount = 0;
  let otherPickCount = 0;
  let awayPickPercent = 50;
  let homePickPercent = 50;
  let stakeCards: StakeCard[] = [];

  $: gameData = data.gameDetail?.game || null;
  $: pageError = gameData ? null : 'No games available at this time';
  $: teamSelections = data.gameDetail?.teamSelections || { home: [], away: [], other: [] };
  $: scenarioStakes = data.gameDetail?.scenarioStakes || null;
  $: tournamentStage = data.tournamentSettings?.stage || 'archive';
  $: primaryGroups = gameData
    ? [
        {
          key: 'away',
          side: 'away',
          label: 'Away',
          team: gameData.awayTeam,
          entries: teamSelections.away || [],
          count: teamSelections.away?.length || 0
        },
        {
          key: 'home',
          side: 'home',
          label: 'Home',
          team: gameData.homeTeam,
          entries: teamSelections.home || [],
          count: teamSelections.home?.length || 0
        }
      ]
    : [];
  $: otherGroups = (teamSelections.other || []).map((group, index) => ({
    key: `other-${index}`,
    side: 'other' as const,
    label: 'Alternate',
      team: {
        name: group.name,
        seed: group.seed,
        seoName: group.seoName,
        color: group.color,
        secondaryColor: group.secondaryColor,
        scoreText: '',
        winner: false,
        eliminated: group.eliminated
      },
      entries: group.users,
      count: group.count
    }));
  $: pickGroups = [...primaryGroups, ...otherGroups];
  $: directPickCount = primaryGroups.reduce((total, group) => total + group.count, 0);
  $: otherPickCount = otherGroups.reduce((total, group) => total + group.count, 0);
  $: totalPickCount = pickGroups.reduce((total, group) => total + group.count, 0);
  $: awayPickPercent = directPickCount > 0 ? (primaryGroups[0]?.count || 0) / directPickCount * 100 : 50;
  $: homePickPercent = directPickCount > 0 ? 100 - awayPickPercent : 50;
  $: stakeCards = scenarioStakes && gameData
    ? [
        { key: 'away', team: gameData.awayTeam, branch: scenarioStakes.away },
        { key: 'home', team: gameData.homeTeam, branch: scenarioStakes.home }
      ]
    : [];

  onMount(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      currentUserId = user.id;
    }
  });

  function isCurrentUser(entry: PickEntry): boolean {
    return isCurrentUserId(entry.user_id);
  }

  function isCurrentUserId(userId: string | null | undefined): boolean {
    return Boolean(userId && userId === currentUserId);
  }

  function isWinner(team: TeamSurface | any): boolean {
    return team?.winner === true;
  }

  function getStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'LIVE':
        return 'game-status-pill is-live';
      case 'FINAL':
        return 'game-status-pill is-final';
      default:
        return 'game-status-pill is-pre';
    }
  }

  function getPickCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'entry' : 'entries'}`;
  }

  function getEntryHref(name: string): string {
    return `/entries?selected=${encodeURIComponent(name.replace(/\s+/g, '|'))}`;
  }

  function getTeamScoreText(team: TeamSurface | any): string {
    return String(team?.scoreText || '').trim() || '--';
  }

  function getTeamStateClass(team: TeamSurface | any, opponent: TeamSurface | any = null): string {
    if (isWinner(team)) {
      return 'is-winner';
    }

    if (isWinner(opponent)) {
      return 'is-eliminated';
    }

    return '';
  }

  function getPickGroupStateClass(group: PickGroup): string {
    if (group.side === 'away') {
      return getTeamStateClass(group.team, gameData?.homeTeam);
    }

    if (group.side === 'home') {
      return getTeamStateClass(group.team, gameData?.awayTeam);
    }

    return group.team.eliminated ? 'is-eliminated' : '';
  }

  function isPickGroupEliminated(group: PickGroup): boolean {
    return getPickGroupStateClass(group) === 'is-eliminated';
  }

  function getTeamColorVars(team: TeamSurface | any): string {
    const primaryRgb = hexToRgb(team?.color || '');
    const secondaryRgb = hexToRgb(team?.secondaryColor || '');
    const primary = primaryRgb ? `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}` : '161, 161, 170';
    const secondary = secondaryRgb ? `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}` : primary;
    return `--team-rgb: ${primary}; --team-secondary-rgb: ${secondary};`;
  }

  function getPickGroupStyle(group: PickGroup): string {
    return getTeamColorVars(group.team);
  }

  function getPickShareStyle(team: TeamSurface | any, width: number): string {
    return `${getTeamColorVars(team)} --pick-share-width: ${width.toFixed(2)}%;`;
  }

  function getTeamAccentStyle(team: TeamSurface | any): string {
    return getTeamColorVars(team);
  }

  function formatStakePercent(value: number): string {
    return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
  }

  function formatSwingPercent(value: number): string {
    return `+${value.toFixed(value >= 10 ? 1 : 2)}%`;
  }

  function formatDropPercent(value: number): string {
    return `${value.toFixed(Math.abs(value) >= 10 ? 1 : 2)}%`;
  }
</script>

<div class="mm-page game-detail-page">
  {#if pageError}
    <div class="mm-empty-state game-empty-state">
      <p class="panel-kicker">Game Detail</p>
      <h1 class="picks-panel-title">{pageError}</h1>
      <p class="panel-copy">
        {tournamentStage === 'bracket-open'
          ? 'Game details will populate once tournament games begin.'
          : 'There are no games scheduled at this time. Check back once scoreboard data is available.'}
      </p>
      <a href="/" class="mm-button-secondary">Return Home</a>
    </div>
  {:else if gameData}
    <div class="game-detail-shell mm-shell">
      <div class="game-detail-layout">
        <section class="game-matchup-panel">
          <div class="pick-share-panel">
            <div class="pick-share-panel-header">
              <p class="panel-kicker">Pick Share</p>
              <div class="pick-share-chip-group">
                <div class="pick-total-chip">{getPickCountLabel(totalPickCount)}</div>
                {#if otherPickCount > 0}
                  <div class="pick-other-chip">Other {otherPickCount}</div>
                {/if}
              </div>
            </div>

            <div class="pick-share-track">
              <div class="pick-share-segment" style={getPickShareStyle(gameData.awayTeam, awayPickPercent)}></div>
              <div class="pick-share-segment" style={getPickShareStyle(gameData.homeTeam, homePickPercent)}></div>
            </div>

            <div class="pick-share-legend">
              <div class="pick-share-item">
                <span class="pick-share-swatch" style={getTeamColorVars(gameData.awayTeam)}></span>
                <span class="pick-share-name">{gameData.awayTeam.name}</span>
                <strong class="pick-share-count">{teamSelections.away.length}</strong>
              </div>

              <div class="pick-share-item is-home">
                <span class="pick-share-swatch" style={getTeamColorVars(gameData.homeTeam)}></span>
                <span class="pick-share-name">{gameData.homeTeam.name}</span>
                <strong class="pick-share-count">{teamSelections.home.length}</strong>
              </div>
            </div>
          </div>

          <div class="matchup-board">
            <div class="matchup-status-band">
              <span class={getStatusClass(gameData.statusLabel)}>{gameData.statusLabel}</span>
            </div>

            <article
              class={`matchup-side is-away ${getTeamStateClass(gameData.awayTeam, gameData.homeTeam)}`}
              style={getTeamColorVars(gameData.awayTeam)}
            >
              <div class="matchup-side-top">
                <span class="matchup-seed-chip">#{gameData.awayTeam.seed}</span>
              </div>

              <div class="matchup-side-main">
                <div class="matchup-logo-wrap">
                  <img
                    class="matchup-logo"
                    src="/images/team-logos/{gameData.awayTeam.seoName}.svg"
                    alt="{gameData.awayTeam.name} logo"
                    on:error={handleImageError}
                  />
                </div>

                <h3 class="matchup-team-name">{gameData.awayTeam.name}</h3>
              </div>

              <div class="matchup-score-wrap">
                <span class="matchup-score-label">Score</span>
                <span class="matchup-score">{getTeamScoreText(gameData.awayTeam)}</span>
              </div>
            </article>

            <div class="matchup-center">
              <div class="matchup-center-badge">VS</div>
            </div>

            <article
              class={`matchup-side is-home ${getTeamStateClass(gameData.homeTeam, gameData.awayTeam)}`}
              style={getTeamColorVars(gameData.homeTeam)}
            >
              <div class="matchup-side-top">
                <span class="matchup-seed-chip">#{gameData.homeTeam.seed}</span>
              </div>

              <div class="matchup-side-main">
                <div class="matchup-logo-wrap">
                  <img
                    class="matchup-logo"
                    src="/images/team-logos/{gameData.homeTeam.seoName}.svg"
                    alt="{gameData.homeTeam.name} logo"
                    on:error={handleImageError}
                  />
                </div>

                <h3 class="matchup-team-name">{gameData.homeTeam.name}</h3>
              </div>

              <div class="matchup-score-wrap">
                <span class="matchup-score-label">Score</span>
                <span class="matchup-score">{getTeamScoreText(gameData.homeTeam)}</span>
              </div>
            </article>
          </div>

          {#if scenarioStakes && stakeCards.length > 0}
            <div class="stakes-panel">
              <div class="stakes-panel-header">
                <p class="stakes-panel-title">What's At Stake</p>
              </div>

              <div class="stakes-grid">
                {#each stakeCards as card}
                  <article class="stakes-card" style={getTeamAccentStyle(card.team)}>
                    <div class="stakes-card-header">
                      <div class="stakes-card-main">
                        <div class="stakes-card-team">If {card.team.name} wins</div>

                        {#if card.branch.favoriteEntry}
                          <div class="stakes-card-favorite-row">
                            <span class="stakes-card-favorite-label">Top Title Odds</span>
                            <div class="stakes-card-favorite-summary">
                              <strong class="stakes-card-favorite-name">{card.branch.favoriteEntry.displayName}</strong>
                              <span class="stakes-card-favorite-value">{formatStakePercent(card.branch.favoriteEntry.firstPlacePct)}</span>
                            </div>
                          </div>
                        {/if}
                      </div>
                    </div>

                    <div class="stakes-list-stack">
                      <div class="stakes-list-block">
                        <div class="stakes-list-heading">Chance for 1st at Stake</div>

                        {#if card.branch.mustHaveEntries.length > 0}
                          <div class="stakes-entry-list">
                            {#each card.branch.mustHaveEntries as entry}
                              <div class={`stakes-entry-row ${isCurrentUserId(entry.userId) ? 'is-current-user' : ''}`}>
                                <div class="stakes-entry-copy">
                                  <span class="stakes-entry-name">{entry.displayName}</span>
                                </div>
                                <strong class="stakes-entry-value">{formatStakePercent(entry.firstPlacePct)}</strong>
                              </div>
                            {/each}
                          </div>
                        {:else}
                          <div class="stakes-empty">No first-place paths are exclusive to this result.</div>
                        {/if}
                      </div>

                      <div class="stakes-list-block">
                        <div class="stakes-list-heading">Biggest Lifts</div>

                        {#if card.branch.biggestSwingEntries.length > 0}
                          <div class="stakes-entry-list">
                            {#each card.branch.biggestSwingEntries as entry}
                              <div class={`stakes-entry-row ${isCurrentUserId(entry.userId) ? 'is-current-user' : ''}`}>
                                <div class="stakes-entry-copy">
                                  <span class="stakes-entry-name">{entry.displayName}</span>
                                </div>
                                <strong class="stakes-entry-value is-lift">{formatSwingPercent(entry.swingPct)}</strong>
                              </div>
                            {/each}
                          </div>
                        {:else}
                          <div class="stakes-empty">No meaningful first-place lift in this result.</div>
                        {/if}
                      </div>

                      <div class="stakes-list-block">
                        <div class="stakes-list-heading">Biggest Drops</div>

                        {#if card.branch.biggestDropEntries.length > 0}
                          <div class="stakes-entry-list">
                            {#each card.branch.biggestDropEntries as entry}
                              <div class={`stakes-entry-row ${isCurrentUserId(entry.userId) ? 'is-current-user' : ''}`}>
                                <div class="stakes-entry-copy">
                                  <span class="stakes-entry-name">{entry.displayName}</span>
                                </div>
                                <strong class="stakes-entry-value is-drop">{formatDropPercent(entry.swingPct)}</strong>
                              </div>
                            {/each}
                          </div>
                        {:else}
                          <div class="stakes-empty">No meaningful first-place drop in this result.</div>
                        {/if}
                      </div>
                    </div>
                  </article>
                {/each}
              </div>
            </div>
          {/if}
        </section>

        <section class="game-picks-panel">
          <div class="pick-group-stack">
            {#each pickGroups as group}
              <article
                class={`pick-group ${group.side === 'other' ? 'is-other' : ''} ${getPickGroupStateClass(group)}`}
                style={getPickGroupStyle(group)}
              >
                <div class="pick-group-header">
                  <div class="pick-group-brand">
                    <div class="pick-group-logo-wrap">
                      <img
                        class="pick-group-logo"
                        src="/images/team-logos/{group.team.seoName}.svg"
                        alt="{group.team.name} logo"
                        on:error={handleImageError}
                      />
                    </div>

                    <div class="pick-group-copy">
                      {#if isPickGroupEliminated(group)}
                        <span class="pick-group-status">Already Eliminated</span>
                      {/if}
                      <h3 class="pick-group-name">{group.team.name}</h3>
                    </div>
                  </div>

                  <div class="pick-group-count">{getPickCountLabel(group.count)}</div>
                </div>

                <div class="pick-group-chip-cloud">
                  {#if group.entries.length === 0}
                    <div class="pick-empty-state">No entries picked this team.</div>
                  {:else}
                    {#each group.entries as entry}
                      <a
                        href={getEntryHref(entry.name)}
                        class={`pick-chip ${isCurrentUser(entry) ? 'is-current-user' : ''}`}
                        title={entry.name}
                      >
                        {entry.name}
                      </a>
                    {/each}
                  {/if}
                </div>
              </article>
            {/each}
          </div>
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .game-detail-page {
    max-width: 90rem;
  }

  .game-detail-shell {
    overflow: hidden;
    padding: 0.9rem;
    background: rgba(10, 10, 11, 0.96);
  }

  .game-detail-layout {
    display: grid;
    gap: 0.9rem;
    align-items: start;
  }

  .game-matchup-panel,
  .game-picks-panel {
    min-width: 0;
    min-height: 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1.7rem;
    background: rgba(14, 14, 15, 0.92);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    overflow: hidden;
  }

  .game-matchup-panel {
    padding: 0.95rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.78rem;
  }

  .game-picks-panel {
    padding: 0.95rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .panel-kicker {
    margin: 0;
    color: var(--mm-subtle);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .game-status-pill,
  .pick-total-chip,
  .pick-other-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.15rem;
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.03);
    color: var(--mm-text);
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .game-status-pill.is-live {
    color: #facc15;
    border-color: rgba(250, 204, 21, 0.28);
    background: rgba(250, 204, 21, 0.12);
    animation: status-live-pulse 1.8s ease-in-out infinite;
  }

  .game-status-pill.is-final {
    background: rgba(255, 255, 255, 0.05);
    color: var(--mm-text);
  }

  .game-status-pill.is-pre,
  .pick-total-chip,
  .pick-other-chip {
    color: var(--mm-muted);
  }

  .picks-panel-title {
    margin: 0.28rem 0 0;
    color: var(--mm-text);
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.05;
  }

  .pick-share-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.58rem;
  }

  .pick-share-chip-group {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .pick-other-chip {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
    letter-spacing: 0.1em;
  }

  .matchup-board {
    position: relative;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 0.72rem;
    align-items: stretch;
    padding-top: 1.35rem;
  }

  .matchup-status-band {
    position: absolute;
    top: 0.32rem;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);
  }

  .matchup-status-band .game-status-pill {
    min-height: 1.9rem;
    padding-inline: 0.78rem;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
  }

  .matchup-side {
    position: relative;
    min-width: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 0.65rem;
    padding: 0.8rem;
    border: 1px solid rgba(var(--team-rgb), 0.22);
    border-radius: 1.45rem;
    background: rgba(12, 12, 13, 0.82);
    overflow: hidden;
  }

  .matchup-side::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: rgb(var(--team-rgb));
    opacity: 0.9;
  }

  .matchup-side::after {
    content: '';
    position: absolute;
    inset: auto 12% 28% 12%;
    height: 48%;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(var(--team-rgb), 0.18) 0%, rgba(var(--team-rgb), 0.08) 32%, rgba(var(--team-rgb), 0) 72%);
    filter: blur(10px);
    opacity: 0.95;
    pointer-events: none;
  }

  .matchup-side.is-home::before {
    inset: 0 0 0 auto;
  }

  .matchup-side.is-winner {
    box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.12);
  }

  .matchup-side.is-eliminated {
    opacity: 0.88;
  }

  .matchup-side-top {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .matchup-side.is-home .matchup-side-top {
    justify-content: flex-end;
  }

  .matchup-seed-chip,
  .pick-group-label,
  .pick-group-seed {
    display: inline-flex;
    align-items: center;
    min-height: 1.5rem;
    padding: 0.14rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pick-group-label {
    background: rgba(255, 255, 255, 0.08);
    color: var(--mm-muted);
  }

  .matchup-seed-chip,
  .pick-group-seed {
    background: rgba(var(--team-rgb), 0.16);
    color: var(--mm-text);
  }

  .matchup-side-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.7rem;
    padding-block: 0.3rem 0.5rem;
    z-index: 1;
  }

  .matchup-side.is-home .matchup-side-main {
    text-align: center;
  }

  .matchup-logo-wrap,
  .pick-group-logo-wrap {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid rgba(var(--team-rgb), 0.24);
    background: rgba(var(--team-rgb), 0.06);
  }

  .matchup-logo-wrap {
    position: relative;
    width: 6.8rem;
    aspect-ratio: 1;
    border-radius: 1.2rem;
    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);
  }

  .matchup-logo-wrap::before {
    content: '';
    position: absolute;
    inset: 12%;
    border-radius: 1rem;
    background: radial-gradient(circle, rgba(var(--team-rgb), 0.18) 0%, rgba(var(--team-rgb), 0) 72%);
    filter: blur(8px);
    opacity: 0.9;
    pointer-events: none;
  }

  .pick-group-logo-wrap {
    width: 3rem;
    aspect-ratio: 1;
    border-radius: 0.95rem;
  }

  .matchup-logo,
  .pick-group-logo {
    width: 78%;
    height: 78%;
    object-fit: contain;
  }

  .matchup-logo {
    position: relative;
    z-index: 1;
  }

  .matchup-team-name {
    margin: 0;
    max-width: 8.8rem;
    color: var(--mm-text);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.05;
    text-align: center;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-wrap: balance;
  }

  .pick-group-copy {
    min-width: 0;
  }

  .matchup-score-wrap {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.65rem;
    padding-top: 0.58rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;
    z-index: 1;
  }

  .matchup-side.is-home .matchup-score-wrap {
    flex-direction: row-reverse;
  }

  .matchup-score-label {
    color: var(--mm-subtle);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .matchup-score {
    color: var(--mm-text);
    font-family: 'Barlow Condensed', sans-serif;
    font-size: clamp(2.2rem, 3.2vw, 3rem);
    font-weight: 700;
    line-height: 0.9;
  }

  .matchup-center {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 0.2rem;
  }

  .matchup-center::before,
  .matchup-center::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 1.15rem;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.15));
    transform: translateY(-50%);
  }

  .matchup-center::before {
    right: calc(100% - 0.1rem);
  }

  .matchup-center::after {
    left: calc(100% - 0.1rem);
    transform: translateY(-50%) scaleX(-1);
  }

  .matchup-center-badge {
    display: grid;
    place-items: center;
    width: 3.7rem;
    aspect-ratio: 1;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.025));
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .pick-share-panel {
    display: flex;
    flex-direction: column;
    padding: 0;
  }

  .stakes-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 0.2rem;
  }

  .stakes-panel-header {
    display: flex;
    justify-content: center;
    text-align: center;
  }

  .stakes-panel-title {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .stakes-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .stakes-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.85rem;
    border: 1px solid rgba(var(--team-rgb), 0.26);
    border-radius: 1.22rem;
    background:
      linear-gradient(180deg, rgba(var(--team-rgb), 0.12), rgba(11, 11, 12, 0.96) 34%),
      rgba(11, 11, 12, 0.94);
    overflow: hidden;
  }

  .stakes-card::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: rgb(var(--team-rgb));
    opacity: 0.92;
  }

  .stakes-card-header {
    display: block;
  }

  .stakes-card-main {
    min-width: 0;
    display: grid;
    gap: 0.5rem;
  }

  .stakes-card-team {
    color: var(--mm-text);
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.05;
  }

  .stakes-card-favorite-row {
    display: grid;
    gap: 0.2rem;
  }

  .stakes-card-favorite-label,
  .stakes-list-heading {
    color: var(--mm-subtle);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .stakes-card-favorite-summary {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.55rem;
    min-width: 0;
    width: 100%;
  }

  .stakes-card-favorite-name {
    max-width: 11rem;
    overflow: hidden;
    color: var(--mm-text);
    font-size: 0.84rem;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stakes-card-favorite-value {
    color: var(--mm-text);
    font-size: 0.82rem;
    font-weight: 700;
  }

  .stakes-list-stack {
    display: grid;
    gap: 0.6rem;
  }

  .stakes-list-block {
    display: grid;
    gap: 0.55rem;
    padding: 0.7rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.025);
  }

  .stakes-entry-list {
    display: flex;
    flex-direction: column;
    gap: 0.48rem;
  }

  .stakes-entry-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.7rem;
  }

  .stakes-entry-row.is-current-user .stakes-entry-name,
  .stakes-entry-row.is-current-user .stakes-entry-value {
    color: #fde68a;
  }

  .stakes-entry-copy {
    min-width: 0;
    display: grid;
    gap: 0.12rem;
  }

  .stakes-entry-name {
    overflow: hidden;
    color: var(--mm-text);
    font-size: 0.85rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stakes-entry-meta {
    color: var(--mm-muted);
    font-size: 0.74rem;
    line-height: 1.25;
  }

  .stakes-entry-value {
    flex-shrink: 0;
    color: var(--mm-text);
    font-size: 0.82rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .stakes-entry-value.is-lift {
    color: #86efac;
  }

  .stakes-entry-value.is-drop {
    color: #fca5a5;
  }

  .stakes-empty {
    color: var(--mm-muted);
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .pick-share-track {
    display: flex;
    width: 100%;
    height: 0.72rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.03);
    overflow: hidden;
  }

  .pick-share-segment {
    width: var(--pick-share-width);
    background: rgb(var(--team-rgb));
  }

  .pick-share-legend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-top: 0.7rem;
  }

  .pick-share-item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
    color: var(--mm-muted);
    font-size: 0.92rem;
  }

  .pick-share-item.is-home {
    justify-content: flex-end;
    margin-left: auto;
  }

  .pick-share-swatch {
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 999px;
    flex-shrink: 0;
    background: rgb(var(--team-rgb));
  }

  .pick-share-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pick-share-count {
    color: var(--mm-text);
    font-weight: 700;
  }

  .pick-group-stack {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .pick-group {
    position: relative;
    min-height: 0;
    min-width: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.6rem;
    padding: 0.78rem 0.88rem 0.88rem;
    border: 1px solid rgba(var(--team-rgb), 0.24);
    border-radius: 1.35rem;
    background: rgba(12, 12, 13, 0.9);
    overflow: hidden;
  }

  .pick-group::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: rgb(var(--team-rgb));
    opacity: 0.88;
  }

  .pick-group.is-winner {
    box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.12);
  }

  .pick-group.is-eliminated {
    border-color: rgba(248, 113, 113, 0.26);
    background: linear-gradient(180deg, rgba(42, 16, 16, 0.44) 0%, rgba(12, 12, 13, 0.94) 58%);
    box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.08);
  }

  .pick-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .pick-group-brand {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .pick-group-name {
    margin: 0;
    color: var(--mm-text);
    font-size: 1.08rem;
    font-weight: 700;
    line-height: 1.05;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pick-group-status {
    display: block;
    margin-bottom: 0.22rem;
    color: #fca5a5;
    font-size: 0.67rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .pick-group-count {
    flex-shrink: 0;
    color: var(--mm-text);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .pick-group-chip-cloud {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 0.42rem;
    overflow: visible;
  }

  .pick-chip {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    min-height: 1.9rem;
    padding: 0.24rem 0.72rem;
    border-radius: 999px;
    border: 1px solid rgba(var(--team-rgb), 0.24);
    background: rgba(var(--team-rgb), 0.12);
    color: var(--mm-text);
    font-size: 0.87rem;
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background-color 160ms ease, border-color 160ms ease;
  }

  .pick-chip:hover {
    background: rgba(var(--team-rgb), 0.2);
    border-color: rgba(var(--team-rgb), 0.34);
  }

  .pick-chip.is-current-user {
    border-color: rgba(245, 158, 11, 0.36);
    background: rgba(245, 158, 11, 0.16);
    color: #fde68a;
  }

  .pick-empty-state {
    width: 100%;
    min-height: 3.6rem;
    display: grid;
    place-items: center;
    padding: 1rem;
    border: 1px dashed rgba(255, 255, 255, 0.12);
    border-radius: 1rem;
    color: var(--mm-subtle);
    text-align: center;
  }

  .game-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .game-empty-state .panel-copy,
  .game-empty-state .picks-panel-title {
    text-align: center;
  }

  @keyframes status-live-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.14);
    }

    50% {
      box-shadow: 0 0 0 7px rgba(250, 204, 21, 0);
    }
  }

  @media (min-width: 1024px) {
    .game-detail-page {
      padding-top: 1rem;
      padding-bottom: 1rem;
    }

    .game-detail-layout {
      grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
    }
  }

  @media (max-width: 1023px) {
    .pick-share-panel-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .pick-share-chip-group {
      justify-content: flex-start;
    }

    .pick-group {
      flex: none;
      min-height: 0;
    }
  }

  @media (max-width: 767px) {
    .game-detail-shell {
      padding: 0;
      background: transparent;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      overflow: visible;
    }

    .pick-share-panel-header {
      flex-direction: row;
      align-items: center;
    }

    .pick-share-chip-group {
      justify-content: flex-end;
      gap: 0.45rem;
    }

    .stakes-panel {
      gap: 0.9rem;
      padding-top: 0.1rem;
    }

    .stakes-panel-header {
      display: block;
    }

    .stakes-panel-title {
      font-size: 0.94rem;
    }

    .stakes-grid {
      grid-template-columns: 1fr;
    }

    .stakes-card {
      padding: 0.78rem;
    }

    .stakes-card-favorite-summary {
      justify-content: space-between;
    }

    .matchup-board {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.6rem;
      padding-top: 2.35rem;
    }

    .matchup-center {
      display: none;
    }

    .matchup-status-band {
      top: 0.55rem;
    }

    .matchup-side {
      gap: 0.5rem;
      padding: 0.68rem 0.62rem 0.62rem;
      border-radius: 1.2rem;
      background: rgba(255, 255, 255, 0.015);
      box-shadow: none;
    }

    .matchup-side::after {
      display: none;
    }

    .matchup-side-main {
      gap: 0.5rem;
      padding-block: 0.1rem 0.2rem;
    }

    .matchup-logo-wrap {
      width: 4.8rem;
      border-radius: 0.95rem;
      box-shadow: none;
    }

    .matchup-logo-wrap::before {
      inset: 14%;
      border-radius: 0.8rem;
    }

    .matchup-team-name {
      max-width: 100%;
      min-height: 1.95rem;
      font-size: 0.9rem;
      line-height: 1.05;
    }

    .matchup-score-wrap {
      gap: 0.45rem;
      padding-top: 0.42rem;
    }

    .matchup-score-label {
      font-size: 0.64rem;
      letter-spacing: 0.14em;
    }

    .matchup-score {
      font-size: clamp(1.9rem, 8vw, 2.35rem);
    }

    .pick-share-legend {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 0.7rem;
    }

    .pick-share-item {
      flex: 1 1 0;
      min-width: 0;
    }

    .pick-share-item.is-home {
      margin-left: 0;
      justify-content: flex-end;
    }

    .pick-share-name {
      min-width: 0;
    }

    .matchup-center::before,
    .matchup-center::after {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .game-matchup-panel,
    .game-picks-panel {
      border-radius: 1.35rem;
      padding: 0.9rem;
    }

    .matchup-side {
      padding: 0.85rem;
    }

    .matchup-logo-wrap {
      width: 4.55rem;
      border-radius: 1rem;
    }

    .pick-group {
      padding: 0.76rem 0.82rem 0.82rem;
    }

    .pick-group-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .pick-group-count {
      font-size: 0.74rem;
    }
  }
</style>
