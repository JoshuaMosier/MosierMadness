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

export function sortScoreboardGames(games) {
  return [...games].sort((a, b) => {
    const priorityDiff = getStatusPriority(a.statusLabel || a.status) - getStatusPriority(b.statusLabel || b.status);
    if (priorityDiff !== 0) {
      return priorityDiff;
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
