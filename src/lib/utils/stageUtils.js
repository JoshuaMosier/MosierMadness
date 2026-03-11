/** @param {string} stage */
export const isArchive = (stage) => stage === 'archive';

/** @param {string} stage */
export const isBracketOpen = (stage) => stage === 'bracket-open';

/** @param {string} stage */
export const isTournamentLive = (stage) => stage === 'tournament-live';

/** @param {string} stage */
export const isComplete = (stage) => stage === 'complete';

/** Bracket submission is allowed only during bracket-open */
export const canSubmitBracket = (stage) => stage === 'bracket-open';

/** Entries are visible once brackets have opened */
export const canViewEntries = (stage) => stage !== 'archive';

/** Scenarios are available only during live tournament */
export const canViewScenarios = (stage) => stage === 'tournament-live';

/** Leaderboard scores are relevant during live or complete stages */
export const hasLeaderboard = (stage) =>
  stage === 'tournament-live' || stage === 'complete';
