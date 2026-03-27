import type { TournamentSettings, TournamentStage } from '$lib/types';

export const isArchive = (stage: TournamentStage): boolean => stage === 'archive';

export const isBracketOpen = (stage: TournamentStage): boolean => stage === 'bracket-open';

export const isTournamentLive = (stage: TournamentStage): boolean => stage === 'tournament-live';

export const isComplete = (stage: TournamentStage): boolean => stage === 'complete';

/** Bracket submission is allowed only during bracket-open */
export const canSubmitBracket = (stage: TournamentStage): boolean => stage === 'bracket-open';

/** Entries are visible once brackets have opened */
export const canViewEntries = (stage: TournamentStage): boolean => stage !== 'archive';

function getRoundStartDate(settings: Pick<TournamentSettings, 'tickerRounds'>, key: string, labelPattern: RegExp): string | null {
  const round = (settings.tickerRounds || []).find(r =>
    r.key === key || labelPattern.test(r.label)
  );

  if (!round?.dates?.length) {
    return null;
  }

  return [...round.dates].sort()[0];
}

/** Scenarios open once the live tournament reaches the Second Round (Round of 32) window. */
export const canViewScenarios = (
  settings: Pick<TournamentSettings, 'stage' | 'tickerRounds'>,
  todayEt: string,
): boolean => {
  if (settings.stage !== 'tournament-live') {
    return false;
  }

  const roundOf32StartDate = getRoundStartDate(settings, 'round-2', /second\s*round|round\s*(of\s*)?32/i);
  return roundOf32StartDate ? todayEt >= roundOf32StartDate : false;
};

/** Game detail pages stay hidden while brackets are open but games have not started */
export const canViewGameDetails = (stage: TournamentStage): boolean => stage !== 'bracket-open';

/** Leaderboard scores are relevant during live or complete stages */
export const hasLeaderboard = (stage: TournamentStage): boolean =>
  stage === 'tournament-live' || stage === 'complete';
