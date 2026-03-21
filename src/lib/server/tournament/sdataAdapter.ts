/**
 * Adapter to convert sdataprod contest format to casablanca-like scoreboard format.
 * Used when sdataprod is the primary source for tournament data.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sdataTeamToCasablancaTeam(team: any): { names: { short: string; char6: string; seo: string }; seed: string; score: string; winner: boolean; description: string } {
  const name = team.nameShort || 'TBA';
  return {
    names: {
      short: name,
      char6: team.name6Char || name.slice(0, 6).toUpperCase(),
      seo: team.seoname || name.toLowerCase().replace(/\s+/g, '-'),
    },
    seed: team.seed != null ? String(team.seed) : '',
    score: team.score != null ? String(team.score) : '',
    winner: team.isWinner === true,
    description: name,
  };
}

/** Placeholder team for contests where sdataprod returns only one team (e.g. TBA not yet in API). */
function createPlaceholderTeam(seed: number): ReturnType<typeof sdataTeamToCasablancaTeam> {
  return {
    names: { short: 'TBA', char6: 'TBA', seo: 'tba' },
    seed: String(seed),
    score: '',
    winner: false,
    description: 'TBA',
  };
}

/** First-round seed pairs sum to 17 (1-16, 8-9, 5-12, etc.). */
function getOpponentSeed(knownSeed: number): number {
  return 17 - knownSeed;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sdataContestToCasablancaGame(contest: any): { game: any } | null {
  if (contest.bracketId == null) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySource = contest.teams?.find((t: any) => t.isHome === false) || contest.teams?.[1];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeSource = contest.teams?.find((t: any) => t.isHome === true) || contest.teams?.[0];

  if (!awaySource && !homeSource) {
    return null;
  }

  const knownSeed = awaySource?.seed != null ? Number(awaySource.seed) : homeSource?.seed != null ? Number(homeSource.seed) : 16;
  const placeholderSeed = getOpponentSeed(knownSeed);
  const away = awaySource ? sdataTeamToCasablancaTeam(awaySource) : createPlaceholderTeam(placeholderSeed);
  const home = homeSource ? sdataTeamToCasablancaTeam(homeSource) : createPlaceholderTeam(placeholderSeed);

  const gameState = (contest.statusCodeDisplay || contest.gameState || 'pre').toLowerCase();
  const mappedState = gameState === 'final' ? 'final' : gameState === 'live' ? 'live' : 'pre';

  return {
    game: {
      contestId: contest.contestId != null ? String(contest.contestId) : null,
      url: contest.url || '',
      bracketId: String(contest.bracketId),
      bracketRound: contest.roundDescription || '',
      bracketRegion: contest.bracketRegion || null,
      gameState: mappedState,
      currentPeriod: contest.currentPeriod || '',
      contestClock: contest.contestClock || '',
      startTime: contest.startTime || '',
      away,
      home,
    },
  };
}

/**
 * Convert sdataprod contests to casablanca-like scoreboard day format.
 * Only includes tournament contests (those with bracketId).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sdataContestsToScoreboardDay(contests: any[]): { games: { game: any }[] } {
  const games = contests
    .map(sdataContestToCasablancaGame)
    .filter((g): g is { game: any } => g != null);
  return { games };
}
