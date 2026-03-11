import type { ScoreboardGame } from '$lib/types';

export function getStatusPriority(status: string | null | undefined): number {
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

export function getStatusColor(status: string | null | undefined): string {
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
function getPeriodPriority(game: ScoreboardGame): number {
  const period = (game.period || game.displayClock || '').toUpperCase();
  const status = (game.statusLabel || game.status || '').toUpperCase();
  if (status === 'FINAL') return 5;
  if (status === 'PRE') return 4;
  if (/HALF/.test(period)) return 2;
  if (/OT|2OT|3OT|\d+OT/.test(period)) return 0;
  if (/2ND/.test(period)) return 1;
  if (/1ST/.test(period)) return 3;
  return 4;
}

/** Parse MM:SS (or M:S) to seconds remaining. Lower = less time left = more urgent. */
function parseTimeRemainingSeconds(game: ScoreboardGame): number {
  const clock = game.clock || '';
  const displayClock = String(game.displayClock || '');
  const match = (displayClock + ' ' + clock).match(/(\d{1,2}):(\d{1,2})(?:\.\d+)?/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  return 9999;
}

export function sortScoreboardGames(games: ScoreboardGame[]): ScoreboardGame[] {
  return [...games].sort((a, b) => {
    const periodA = getPeriodPriority(a);
    const periodB = getPeriodPriority(b);
    if (periodA !== periodB) {
      return periodA - periodB;
    }

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
