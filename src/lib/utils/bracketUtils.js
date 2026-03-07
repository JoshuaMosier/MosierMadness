export const ROUND_POINT_VALUES = [1, 2, 4, 8, 16, 32];

export function formatTeamSelection(team) {
  if (!team?.seed || !team?.name) {
    return '';
  }

  return `${team.seed} ${team.name}`;
}

export function parseTeamSelection(selection) {
  if (!selection || typeof selection !== 'string') {
    return null;
  }

  const spaceIndex = selection.indexOf(' ');
  if (spaceIndex === -1) {
    return null;
  }

  const seed = Number.parseInt(selection.slice(0, spaceIndex), 10);
  const name = selection.slice(spaceIndex + 1);

  if (!Number.isFinite(seed) || !name) {
    return null;
  }

  return { seed, name };
}

export function getTeamNameFromSelection(selection) {
  return parseTeamSelection(selection)?.name ?? null;
}

export function getRoundIndexForSelection(selectionIndex) {
  if (selectionIndex < 32) return 0;
  if (selectionIndex < 48) return 1;
  if (selectionIndex < 56) return 2;
  if (selectionIndex < 60) return 3;
  if (selectionIndex < 62) return 4;
  return 5;
}

export function getPointsForSelectionIndex(selectionIndex) {
  return ROUND_POINT_VALUES[getRoundIndexForSelection(selectionIndex)] ?? 0;
}
