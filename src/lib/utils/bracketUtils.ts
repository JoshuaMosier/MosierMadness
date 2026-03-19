import type { TeamSelection } from '$lib/types';
import { resolveTeamSeoName } from '$lib/utils/teamColorUtils';

export const ROUND_POINT_VALUES: readonly number[] = [1, 2, 4, 8, 16, 32];

export function formatTeamSelection(team: { seed?: number | null; name?: string | null } | null | undefined): string {
  if (!team?.seed || !team?.name) {
    return '';
  }

  return `${team.seed} ${team.name}`;
}

export function parseTeamSelection(selection: string | null | undefined): TeamSelection | null {
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

export function areEquivalentSelections(selectionA: string | null | undefined, selectionB: string | null | undefined): boolean {
  if (!selectionA || !selectionB) {
    return false;
  }

  if (selectionA === selectionB) {
    return true;
  }

  const parsedA = parseTeamSelection(selectionA);
  const parsedB = parseTeamSelection(selectionB);
  if (!parsedA || !parsedB || parsedA.seed !== parsedB.seed) {
    return false;
  }

  const seoNameA = resolveTeamSeoName(parsedA.name);
  const seoNameB = resolveTeamSeoName(parsedB.name);

  return Boolean(seoNameA && seoNameB && seoNameA === seoNameB);
}

export function includesEquivalentSelection(
  selections: Iterable<string>,
  target: string | null | undefined,
): boolean {
  for (const selection of selections) {
    if (areEquivalentSelections(selection, target)) {
      return true;
    }
  }

  return false;
}

export function getTeamNameFromSelection(selection: string | null | undefined): string | null {
  return parseTeamSelection(selection)?.name ?? null;
}

export function getRoundIndexForSelection(selectionIndex: number): number {
  if (selectionIndex < 32) return 0;
  if (selectionIndex < 48) return 1;
  if (selectionIndex < 56) return 2;
  if (selectionIndex < 60) return 3;
  if (selectionIndex < 62) return 4;
  return 5;
}

export function getPointsForSelectionIndex(selectionIndex: number): number {
  return ROUND_POINT_VALUES[getRoundIndexForSelection(selectionIndex)] ?? 0;
}
