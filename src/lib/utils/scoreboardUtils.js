export function getStatusPriority(status) {
  switch ((status || '').toUpperCase()) {
    case 'LIVE':
      return 0;
    case 'PRE':
      return 1;
    case 'FINAL':
      return 2;
    default:
      return 3;
  }
}

export function getStatusColor(status) {
  switch ((status || '').toUpperCase()) {
    case 'LIVE':
      return 'text-yellow-300';
    case 'FINAL':
      return 'text-white';
    case 'PRE':
      return 'text-gray-400';
    default:
      return 'text-white';
  }
}

/** Period priority for live games: OT > 2nd > HALFTIME > 1st > PRE > FINAL (lower = higher priority) */
function getPeriodPriority(game) {
  const period = (game.period || game.displayClock || '').toUpperCase();
  const status = (game.statusLabel || game.status || '').toUpperCase();
  if (status === 'FINAL') return 5;
  if (status === 'PRE') return 4;
  if (/HALF/.test(period)) return 2; // Check before OT so "HALFTIME" doesn't match OT
  if (/OT|2OT|3OT|\d+OT/.test(period)) return 0;
  if (/2ND/.test(period)) return 1;
  if (/1ST/.test(period)) return 3;
  return 4; // unknown live
}

/** Parse MM:SS (or M:S) to seconds remaining. Lower = less time left = more urgent. */
function parseTimeRemainingSeconds(game) {
  const clock = game.clock || '';
  const displayClock = String(game.displayClock || '');
  // Match MM:SS or M:S (allow single-digit seconds for formats like "0:8")
  const match = (displayClock + ' ' + clock).match(/(\d{1,2}):(\d{1,2})(?:\.\d+)?/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  return 9999; // no clock (HALFTIME, etc.) - stable sort
}

export function sortScoreboardGames(games) {
  return [...games].sort((a, b) => {
    const periodA = getPeriodPriority(a);
    const periodB = getPeriodPriority(b);
    if (periodA !== periodB) {
      return periodA - periodB;
    }

    // Same period: sort by time remaining (ascending - less time first)
    const timeA = parseTimeRemainingSeconds(a);
    const timeB = parseTimeRemainingSeconds(b);
    if (timeA !== timeB) {
      return timeA - timeB;
    }

    if (a.bracketIndex != null && b.bracketIndex != null) {
      return a.bracketIndex - b.bracketIndex;
    }

    if ((a.startTime || '') !== (b.startTime || '')) {
      return (a.startTime || '').localeCompare(b.startTime || '');
    }

    return (a.gameId || '').localeCompare(b.gameId || '');
  });
}
