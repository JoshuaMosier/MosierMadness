import type { TournamentStage } from '$lib/types';

export const isArchive = (stage: TournamentStage): boolean => stage === 'archive';

export const isBracketOpen = (stage: TournamentStage): boolean => stage === 'bracket-open';

export const isTournamentLive = (stage: TournamentStage): boolean => stage === 'tournament-live';

export const isComplete = (stage: TournamentStage): boolean => stage === 'complete';

/** Bracket submission is allowed only during bracket-open */
export const canSubmitBracket = (stage: TournamentStage): boolean => stage === 'bracket-open';

/** Entries are visible once brackets have opened */
export const canViewEntries = (stage: TournamentStage): boolean => stage !== 'archive';

/** Scenarios are available only during live tournament */
export const canViewScenarios = (stage: TournamentStage): boolean => stage === 'tournament-live';

/** Game detail pages stay hidden while brackets are open but games have not started */
export const canViewGameDetails = (stage: TournamentStage): boolean => stage !== 'bracket-open';

/** Leaderboard scores are relevant during live or complete stages */
export const hasLeaderboard = (stage: TournamentStage): boolean =>
  stage === 'tournament-live' || stage === 'complete';
