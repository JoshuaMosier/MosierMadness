import type { TournamentSettings, TournamentStage } from '$lib/types';

export const isArchive = (stage: TournamentStage): boolean => stage === 'archive';

export const isBracketOpen = (stage: TournamentStage): boolean => stage === 'bracket-open';

export const isTournamentLive = (stage: TournamentStage): boolean => stage === 'tournament-live';

export const isComplete = (stage: TournamentStage): boolean => stage === 'complete';

/** Bracket submission is allowed only during bracket-open */
export const canSubmitBracket = (stage: TournamentStage): boolean => stage === 'bracket-open';

/** Entries are visible once brackets have opened */
export const canViewEntries = (stage: TournamentStage): boolean => stage !== 'archive';

function getSweetSixteenStartDate(settings: Pick<TournamentSettings, 'tickerRounds'>): string | null {
  const sweetSixteenRound = (settings.tickerRounds || []).find(round =>
    round.key === 'sweet-16' || /sweet\s*(16|sixteen)/i.test(round.label)
  );

  if (!sweetSixteenRound?.dates?.length) {
    return null;
  }

  return [...sweetSixteenRound.dates].sort()[0];
}

/** Scenarios open once the live tournament reaches the Sweet Sixteen window. */
export const canViewScenarios = (
  settings: Pick<TournamentSettings, 'stage' | 'tickerRounds'>,
  todayEt: string,
): boolean => {
  if (settings.stage !== 'tournament-live') {
    return false;
  }

  const sweetSixteenStartDate = getSweetSixteenStartDate(settings);
  return sweetSixteenStartDate ? todayEt >= sweetSixteenStartDate : false;
};

/** Game detail pages stay hidden while brackets are open but games have not started */
export const canViewGameDetails = (stage: TournamentStage): boolean => stage !== 'bracket-open';

/** Leaderboard scores are relevant during live or complete stages */
export const hasLeaderboard = (stage: TournamentStage): boolean =>
  stage === 'tournament-live' || stage === 'complete';
