<script lang="ts">
  import type {
    GameScenarioStakeBranch,
    GeneratedScenarioArtifact,
    NcaaBasketballBoxscore,
    NcaaBasketballBoxscoreTeam,
    NcaaBasketballTeamStats,
    SimulationConfig,
  } from '$lib/types';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { buildBrowserScenarioArtifact } from '$lib/utils/browserScenarioArtifact';
  import { getGameScenarioStakesProjection } from '$lib/utils/gameStakes';
  import { handleImageError } from '$lib/utils/imageUtils';
  import { runSimulation } from '$lib/utils/scenarioEngine';
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

  type ContextCard = {
    key: string;
    label: string;
    value: string;
    detail: string;
    team: TeamSurface | null;
    tone?: 'winner' | 'loss' | 'neutral';
  };

  type PostgameStatRow = {
    key: string;
    label: string;
    awayValue: string;
    homeValue: string;
  };

  type PostgameStatSection = {
    key: string;
    label: string;
    rows: PostgameStatRow[];
  };

  const POSTGAME_STAT_SECTION_TEMPLATES: Array<{ key: string; label: string; rowKeys: string[] }> = [
    {
      key: 'shooting',
      label: 'Shooting',
      rowKeys: ['fg', '3pt', 'ft']
    },
    {
      key: 'control',
      label: 'Control',
      rowKeys: ['reb', 'oreb', 'ast', 'to']
    },
    {
      key: 'pressure',
      label: 'Pressure',
      rowKeys: ['stl', 'blk', 'pf']
    }
  ];

  let gameData: any = null;
  let pageError: string | null = null;
  let teamSelections: TeamSelectionState = { home: [], away: [], other: [] };
  let scenarioStakes: { away: GameScenarioStakeBranch; home: GameScenarioStakeBranch; assumptionSummary: string } | null = null;
  let currentUserId: string | null = null;
  let tournamentStage = 'archive';
  let primaryGroups: PickGroup[] = [];
  let otherGroups: PickGroup[] = [];
  let pickGroups: PickGroup[] = [];
  let directPickCount = 0;
  let awayPickPercent = 50;
  let homePickPercent = 50;
  let stakeCards: StakeCard[] = [];
  let isFinalResult = false;
  let hasResolvedResult = false;
  let winnerGroup: PickGroup | null = null;
  let loserGroup: PickGroup | null = null;
  let otherPickTotal = 0;
  let fallbackPanelTitle = 'Pick Breakdown';
  let fallbackPanelCopy = '';
  let fallbackCards: ContextCard[] = [];
  let postgameStats: NcaaBasketballBoxscore | null = null;
  let postgameHomeTeam: NcaaBasketballBoxscoreTeam | null = null;
  let postgameAwayTeam: NcaaBasketballBoxscoreTeam | null = null;
  let postgameTeams: NcaaBasketballBoxscoreTeam[] = [];
  let postgameStatRows: PostgameStatRow[] = [];
  let postgameStatSections: PostgameStatSection[] = [];
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

  $: gameData = data.gameDetail?.game || null;
  $: pageError = gameData ? null : 'No games available at this time';
  $: teamSelections = data.gameDetail?.teamSelections || { home: [], away: [], other: [] };
  $: postgameStats = data.postgameStats || null;
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
  $: awayPickPercent = directPickCount > 0 ? (primaryGroups[0]?.count || 0) / directPickCount * 100 : 50;
  $: homePickPercent = directPickCount > 0 ? 100 - awayPickPercent : 50;
  $: stakeCards = scenarioStakes && gameData
    ? [
        { key: 'away', team: gameData.awayTeam, branch: scenarioStakes.away },
        { key: 'home', team: gameData.homeTeam, branch: scenarioStakes.home }
      ]
    : [];
  $: isFinalResult = Boolean(gameData && String(gameData.statusLabel || '').toUpperCase() === 'FINAL');
  $: winnerGroup = primaryGroups.find((group) => isWinner(group.team)) ?? null;
  $: loserGroup = isFinalResult && winnerGroup
    ? primaryGroups.find((group) => group.key !== winnerGroup?.key) ?? null
    : null;
  $: hasResolvedResult = Boolean(isFinalResult && winnerGroup && loserGroup);
  $: otherPickTotal = otherGroups.reduce((total, group) => total + group.count, 0);
  $: fallbackPanelTitle = hasResolvedResult ? 'Pick Outcome' : 'Pick Breakdown';
  $: fallbackPanelCopy = hasResolvedResult
    ? 'Scenario previews move on once a result is locked in. This page now mainly shows who had the winner, who had the loser, and who was already on another team.'
    : 'This matchup is outside the current generated scenario snapshot, but the pick groups below still show who backed each side and who chose another team from this path.';
  $: fallbackCards = gameData
    ? hasResolvedResult
      ? [
          {
            key: 'winner',
            label: 'Picked Winner',
            value: getPickCountLabel(winnerGroup?.count ?? 0),
            detail: winnerGroup?.team.name || 'Winning team',
            team: winnerGroup?.team ?? null,
            tone: 'winner'
          },
          {
            key: 'loser',
            label: 'Picked Loser',
            value: getPickCountLabel(loserGroup?.count ?? 0),
            detail: loserGroup?.team.name || 'Losing team',
            team: loserGroup?.team ?? null,
            tone: 'loss'
          },
          {
            key: 'other',
            label: 'Other Teams',
            value: getPickCountLabel(otherPickTotal),
            detail: otherPickTotal > 0 ? 'Picked teams that did not reach this game' : 'No alternate-team picks',
            team: null,
            tone: 'neutral'
          }
        ]
      : [
          {
            key: 'away',
            label: 'Picked Away',
            value: getPickCountLabel(primaryGroups[0]?.count || 0),
            detail: gameData.awayTeam.name,
            team: gameData.awayTeam
          },
          {
            key: 'home',
            label: 'Picked Home',
            value: getPickCountLabel(primaryGroups[1]?.count || 0),
            detail: gameData.homeTeam.name,
            team: gameData.homeTeam
          },
          {
            key: 'other',
            label: 'Other Teams',
            value: getPickCountLabel(otherPickTotal),
            detail: otherPickTotal > 0 ? 'Picked teams that did not reach this game' : 'No alternate-team picks',
            team: null,
            tone: 'neutral'
          }
        ]
    : [];
  $: postgameHomeTeam = postgameStats?.teams.find((team) => team.isHome) ?? null;
  $: postgameAwayTeam = postgameStats?.teams.find((team) => !team.isHome) ?? null;
  $: postgameTeams = postgameAwayTeam && postgameHomeTeam ? [postgameAwayTeam, postgameHomeTeam] : [];
  $: postgameStatRows = postgameAwayTeam?.teamStats && postgameHomeTeam?.teamStats
    ? buildPostgameStatRows(postgameAwayTeam.teamStats, postgameHomeTeam.teamStats)
    : [];
  $: postgameStatSections = buildPostgameStatSections(postgameStatRows);

  onMount(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      currentUserId = user.id;
    }
  });

  let cachedSeedData: any = null;
  let cachedArtifact: GeneratedScenarioArtifact | null = null;

  function getScenarioArtifact(seedData: any): GeneratedScenarioArtifact | null {
    if (!seedData) {
      return null;
    }

    if (seedData === cachedSeedData && cachedArtifact) {
      return cachedArtifact;
    }

    try {
      const { entries, liveBracketData, masterBracket, teamSeoMap, weighting } = seedData;
      const SCENARIO_GAME_START = 32;
      const SCENARIO_GAME_END = 62;
      const filteredRemainingGames: number[] = [];
      for (let g = SCENARIO_GAME_START; g <= SCENARIO_GAME_END; g++) {
        if (!masterBracket[g]) {
          filteredRemainingGames.push(g);
        }
      }

      const result = runSimulation({
        masterBracket,
        entries,
        filteredRemainingGames,
        selectedWinners: {},
        liveBracketData,
        teamSeoMap,
        weighting,
      });

      cachedSeedData = seedData;
      cachedArtifact = buildBrowserScenarioArtifact({
        entries,
        liveBracketData,
        masterBracket,
        result,
        teamSeoMap,
        weighting,
      });

      return cachedArtifact;
    } catch (err) {
      console.warn('Failed to compute scenario artifact:', err);
      return null;
    }
  }

  $: scenarioStakes = gameData
    ? getGameScenarioStakesProjection(gameData, getScenarioArtifact(data.scenarioSeedData) ?? data.generatedScenarioArtifact)
    : null;

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

  function getPickGroupOpponent(group: PickGroup): TeamSurface | any {
    if (group.side === 'away') {
      return gameData?.homeTeam ?? null;
    }

    if (group.side === 'home') {
      return gameData?.awayTeam ?? null;
    }

    return null;
  }

  function getPickGroupStateClass(group: PickGroup): string {
    if (group.side === 'other') {
      return group.team.eliminated ? 'is-eliminated' : '';
    }

    if (isWinner(group.team)) {
      return 'is-winner';
    }

    const opponent = getPickGroupOpponent(group);
    if (hasResolvedResult && isWinner(opponent)) {
      return 'is-result-loss';
    }

    return '';
  }

  function getPickGroupStatusLabel(group: PickGroup): string | null {
    if (group.side === 'other') {
      return group.team.eliminated ? "Didn't Reach This Game" : 'Different Path';
    }

    if (!hasResolvedResult) {
      return null;
    }

    if (isWinner(group.team)) {
      return 'Winner';
    }

    const opponent = getPickGroupOpponent(group);
    return isWinner(opponent) ? 'Loser' : null;
  }

  function getPickGroupStatusClass(group: PickGroup): string {
    if (group.side === 'other') {
      return 'is-neutral';
    }

    if (!hasResolvedResult) {
      return '';
    }

    return isWinner(group.team) ? 'is-winner' : 'is-loss';
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

  function getTeamLogoFilter(stateClass: string): string {
    if (stateClass === 'is-result-loss') {
      return 'filter: url(#teamLogoOutline) grayscale(0.14) saturate(0.55) brightness(0.96);';
    }

    if (stateClass === 'is-eliminated') {
      return 'filter: url(#teamLogoOutline) grayscale(0.28) saturate(0.15) brightness(0.92);';
    }

    return 'filter: url(#teamLogoOutline);';
  }

  function getPickShareStyle(team: TeamSurface | any, width: number): string {
    return `${getTeamColorVars(team)} --pick-share-width: ${width.toFixed(2)}%;`;
  }

  function getTeamAccentStyle(team: TeamSurface | any): string {
    return getTeamColorVars(team);
  }

  function getContextCardStyle(card: ContextCard): string {
    return card.team
      ? getTeamAccentStyle(card.team)
      : '--team-rgb: 161, 161, 170; --team-secondary-rgb: 161, 161, 170;';
  }

  function formatTeamStatLine(made: string, attempted: string, percentage: string): string {
    return `${made}-${attempted} (${percentage || '--'})`;
  }

  function buildPostgameStatRows(
    awayStats: NcaaBasketballTeamStats,
    homeStats: NcaaBasketballTeamStats,
  ): PostgameStatRow[] {
    return [
      {
        key: 'fg',
        label: 'FG',
        awayValue: formatTeamStatLine(awayStats.fieldGoalsMade, awayStats.fieldGoalsAttempted, awayStats.fieldGoalPercentage),
        homeValue: formatTeamStatLine(homeStats.fieldGoalsMade, homeStats.fieldGoalsAttempted, homeStats.fieldGoalPercentage),
      },
      {
        key: '3pt',
        label: '3PT',
        awayValue: formatTeamStatLine(awayStats.threePointsMade, awayStats.threePointsAttempted, awayStats.threePointPercentage),
        homeValue: formatTeamStatLine(homeStats.threePointsMade, homeStats.threePointsAttempted, homeStats.threePointPercentage),
      },
      {
        key: 'ft',
        label: 'FT',
        awayValue: formatTeamStatLine(awayStats.freeThrowsMade, awayStats.freeThrowsAttempted, awayStats.freeThrowPercentage),
        homeValue: formatTeamStatLine(homeStats.freeThrowsMade, homeStats.freeThrowsAttempted, homeStats.freeThrowPercentage),
      },
      {
        key: 'reb',
        label: 'Rebounds',
        awayValue: awayStats.totalRebounds,
        homeValue: homeStats.totalRebounds,
      },
      {
        key: 'oreb',
        label: 'Off Reb',
        awayValue: awayStats.offensiveRebounds,
        homeValue: homeStats.offensiveRebounds,
      },
      {
        key: 'ast',
        label: 'Assists',
        awayValue: awayStats.assists,
        homeValue: homeStats.assists,
      },
      {
        key: 'to',
        label: 'Turnovers',
        awayValue: awayStats.turnovers,
        homeValue: homeStats.turnovers,
      },
      {
        key: 'stl',
        label: 'Steals',
        awayValue: awayStats.steals,
        homeValue: homeStats.steals,
      },
      {
        key: 'blk',
        label: 'Blocks',
        awayValue: awayStats.blockedShots,
        homeValue: homeStats.blockedShots,
      },
      {
        key: 'pf',
        label: 'Fouls',
        awayValue: awayStats.personalFouls,
        homeValue: homeStats.personalFouls,
      },
    ];
  }

  function buildPostgameStatSections(rows: PostgameStatRow[]): PostgameStatSection[] {
    return POSTGAME_STAT_SECTION_TEMPLATES.map((section) => ({
      key: section.key,
      label: section.label,
      rows: section.rowKeys
        .map((rowKey) => rows.find((row) => row.key === rowKey) ?? null)
        .filter((row): row is PostgameStatRow => Boolean(row))
    })).filter((section) => section.rows.length > 0);
  }

  function getPostgameFallbackTeam(team: NcaaBasketballBoxscoreTeam): TeamSurface | any {
    return team.isHome ? gameData?.homeTeam ?? null : gameData?.awayTeam ?? null;
  }

  function getPostgameTeamName(team: NcaaBasketballBoxscoreTeam): string {
    return team.nameShort || team.nameFull || team.teamName || getPostgameFallbackTeam(team)?.name || 'Team';
  }

  function isPostgameWinner(team: NcaaBasketballBoxscoreTeam): boolean {
    return isWinner(getPostgameFallbackTeam(team));
  }


  function getPostgameTeamStyle(team: NcaaBasketballBoxscoreTeam): string {
    const fallbackTeam = team.isHome ? gameData?.homeTeam : gameData?.awayTeam;
    return getTeamColorVars({
      color: team.color || fallbackTeam?.color || '',
      secondaryColor: fallbackTeam?.secondaryColor || team.color || fallbackTeam?.color || '',
    });
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

{@html svgFilter}

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
            <p class="panel-kicker pick-share-kicker">Pick Share</p>

            <div class="pick-share-row">
              <div class="pick-share-item">
                <span class="pick-share-swatch" style={getTeamColorVars(gameData.awayTeam)}></span>
                <span class="pick-share-name">{gameData.awayTeam.name}</span>
                <strong class="pick-share-count">{teamSelections.away.length}</strong>
              </div>

              <div class="pick-share-track">
                <div class="pick-share-segment" style={getPickShareStyle(gameData.awayTeam, awayPickPercent)}></div>
                <div class="pick-share-segment" style={getPickShareStyle(gameData.homeTeam, homePickPercent)}></div>
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
                    style={getTeamLogoFilter(getTeamStateClass(gameData.awayTeam, gameData.homeTeam))}
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
                    style={getTeamLogoFilter(getTeamStateClass(gameData.homeTeam, gameData.awayTeam))}
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
          {:else if postgameStatRows.length > 0 && postgameTeams.length === 2}
            <div class="stakes-panel">
              <div class="stakes-panel-header">
                <p class="stakes-panel-title">Postgame Stats</p>
              </div>

              <div class="stakes-grid postgame-team-grid">
                {#each postgameTeams as team (team.teamId)}
                  <article class={`stakes-card postgame-team-card ${isPostgameWinner(team) ? 'is-winner' : ''}`} style={getPostgameTeamStyle(team)}>
                    <div class="postgame-team-card-header">
                      <h3 class="postgame-team-card-title">{getPostgameTeamName(team)}</h3>
                    </div>

                    <div class="postgame-section-stack">
                      {#each postgameStatSections as section (section.key)}
                        <section class="postgame-section">
                          <div class="postgame-section-heading">{section.label}</div>

                          <div class="postgame-stat-list">
                            {#each section.rows as row (row.key)}
                              <div class="postgame-stat-item">
                                <span class="postgame-stat-item-label">{row.label}</span>
                                <strong class="postgame-stat-item-value">{team.isHome ? row.homeValue : row.awayValue}</strong>
                              </div>
                            {/each}
                          </div>
                        </section>
                      {/each}
                    </div>
                  </article>
                {/each}
              </div>
            </div>
          {:else}
            <div class="context-panel">
              <div class="context-panel-header">
                <p class="context-panel-title">{fallbackPanelTitle}</p>
                <p class="context-panel-copy">{fallbackPanelCopy}</p>
              </div>

              <div class="context-grid">
                {#each fallbackCards as card}
                  <article class={`context-card ${card.tone ? `is-${card.tone}` : ''}`} style={getContextCardStyle(card)}>
                    <div class="context-card-label">{card.label}</div>
                    <div class="context-card-value">{card.value}</div>
                    <div class="context-card-detail">{card.detail}</div>
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
                        style={getTeamLogoFilter(getPickGroupStateClass(group))}
                        on:error={handleImageError}
                      />
                    </div>

                    <div class="pick-group-copy">
                      {#if getPickGroupStatusLabel(group)}
                        <span class={`pick-group-status ${getPickGroupStatusClass(group)}`}>{getPickGroupStatusLabel(group)}</span>
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
    display: grid;
    gap: 0.9rem;
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

  .game-status-pill {
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

  .game-status-pill.is-pre {
    color: var(--mm-muted);
  }

  .picks-panel-title {
    margin: 0.28rem 0 0;
    color: var(--mm-text);
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.05;
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
    inset: 0 0 auto 0;
    height: 4px;
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
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background-color: rgb(var(--team-rgb));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .matchup-logo-wrap {
    position: relative;
    width: 6.8rem;
    aspect-ratio: 1;
    border-radius: 1.2rem;
    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);
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
    align-items: center;
    gap: 0.85rem;
    padding: 0;
    min-width: 0;
  }

  .pick-share-kicker {
    flex-shrink: 0;
  }

  .pick-share-row {
    min-width: 0;
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 1.25fr) minmax(0, 1fr);
    align-items: center;
    gap: 0.8rem;
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
    inset: 0 0 auto 0;
    height: 3px;
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

  .context-panel {
    display: grid;
    gap: 0.85rem;
    padding-top: 0.2rem;
  }

  .context-panel-header {
    display: grid;
    gap: 0.32rem;
  }

  .context-panel-title {
    margin: 0;
    color: rgba(255, 255, 255, 0.72);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .context-panel-copy {
    margin: 0;
    max-width: 44rem;
    color: var(--mm-muted);
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .context-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .context-card {
    position: relative;
    display: grid;
    gap: 0.2rem;
    padding: 0.82rem;
    border: 1px solid rgba(var(--team-rgb), 0.22);
    border-radius: 1.05rem;
    background:
      linear-gradient(180deg, rgba(var(--team-rgb), 0.12), rgba(11, 11, 12, 0.96) 44%),
      rgba(11, 11, 12, 0.94);
    overflow: hidden;
  }

  .context-card::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: rgb(var(--team-rgb));
    opacity: 0.86;
  }

  .context-card.is-loss {
    box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.08);
  }

  .context-card.is-neutral {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.025);
  }

  .context-card.is-neutral::before {
    background: rgba(255, 255, 255, 0.14);
  }

  .context-card-label {
    color: var(--mm-subtle);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .context-card-value {
    color: var(--mm-text);
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.08;
  }

  .context-card-detail {
    color: var(--mm-muted);
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .postgame-team-grid {
    align-items: start;
  }

  .postgame-team-card {
    min-width: 0;
  }

  .postgame-team-card.is-winner {
    box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.14);
  }

  .postgame-team-card-header {
    display: flex;
    align-items: center;
    min-height: 1.6rem;
  }

  .postgame-team-card-title {
    margin: 0;
    color: var(--mm-text);
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.05;
  }

  .postgame-team-card.is-winner .postgame-team-card-title {
    color: #fde68a;
  }

  .postgame-section-stack {
    display: grid;
    gap: 0.8rem;
  }

  .postgame-section {
    display: grid;
    gap: 0.45rem;
  }

  .postgame-section + .postgame-section {
    padding-top: 0.8rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .postgame-section-heading {
    color: var(--mm-subtle);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .postgame-stat-list {
    display: grid;
    gap: 0.38rem;
  }

  .postgame-stat-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.8rem;
    padding: 0.08rem 0;
  }

  .postgame-stat-item + .postgame-stat-item {
    padding-top: 0.42rem;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .postgame-stat-item-label {
    color: var(--mm-muted);
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .postgame-stat-item-value {
    color: var(--mm-text);
    font-size: 0.81rem;
    font-weight: 800;
    line-height: 1.2;
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
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
    inset: 0 0 auto 0;
    height: 3px;
    background: rgb(var(--team-rgb));
    opacity: 0.88;
  }

  .pick-group.is-winner {
    box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.12);
  }

  .pick-group.is-result-loss {
    border-color: rgba(248, 113, 113, 0.2);
    background: linear-gradient(180deg, rgba(42, 16, 16, 0.24) 0%, rgba(12, 12, 13, 0.94) 58%);
    box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.05);
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
    color: var(--mm-subtle);
    font-size: 0.67rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .pick-group-status.is-winner {
    color: #fde68a;
  }

  .pick-group-status.is-loss {
    color: #fca5a5;
  }

  .pick-group-status.is-neutral {
    color: var(--mm-subtle);
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
    .pick-share-row {
      grid-template-columns: minmax(0, 1fr) minmax(6.5rem, 1fr) minmax(0, 1fr);
      gap: 0.65rem;
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

    .pick-share-panel {
      gap: 0.6rem;
    }

    .pick-share-row {
      grid-template-columns: minmax(0, 1fr) minmax(5rem, 0.9fr) minmax(0, 1fr);
      gap: 0.45rem;
    }

    .pick-share-item {
      gap: 0.35rem;
      font-size: 0.82rem;
    }

    .pick-share-swatch {
      width: 0.62rem;
      height: 0.62rem;
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

    .context-grid {
      grid-template-columns: 1fr;
    }

    .postgame-team-card-title {
      font-size: 0.94rem;
    }

    .postgame-stat-item {
      gap: 0.65rem;
    }

    .postgame-section + .postgame-section {
      padding-top: 0.72rem;
    }

    .postgame-stat-item-label,
    .postgame-stat-item-value {
      font-size: 0.78rem;
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
