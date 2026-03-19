import type { Entry, EntryScore, LiveBracketData } from '$lib/types';
import {
  areEquivalentSelections,
  formatTeamSelection,
  getPointsForSelectionIndex,
  includesEquivalentSelection,
} from '$lib/utils/bracketUtils';

interface EntryLike {
  entryId?: string;
  id?: string;
  user_id?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  selections?: string[];
  is_submitted?: boolean;
  brackets?: { selections?: string[]; is_submitted?: boolean }[];
}

function getEntrySelections(entry: EntryLike): string[] {
  return entry.selections || entry.brackets?.[0]?.selections || [];
}

function isEntrySubmitted(entry: EntryLike): boolean | undefined {
  return entry.is_submitted !== undefined ? entry.is_submitted : entry.brackets?.[0]?.is_submitted;
}

function getEntryIdentity(entry: EntryLike): { entryId: string; firstName: string; lastName: string } {
  return {
    entryId: entry.entryId || entry.id || '',
    firstName: entry.firstName || entry.first_name || '',
    lastName: entry.lastName || entry.last_name || '',
  };
}

export function calculateScores(masterBracket: string[], entries: EntryLike[]): EntryScore[] {
  return entries.map(entry => {
    const selections = getEntrySelections(entry);
    const isSubmitted = isEntrySubmitted(entry);
    const identity = getEntryIdentity(entry);

    if (!isSubmitted) {
      return {
        ...identity,
        round1: 0,
        round2: 0,
        round3: 0,
        round4: 0,
        round5: 0,
        round6: 0,
        total: 0,
        correctGames: 0
      };
    }

    let score1 = 0, score2 = 0, score3 = 0, score4 = 0, score5 = 0, score6 = 0, games = 0;

    for (let i = 0; i < selections.length; i++) {
      if (masterBracket[i] !== '' && areEquivalentSelections(selections[i], masterBracket[i])) {
        const points = getPointsForSelectionIndex(i);
        if (i < 32) score1 += points;
        else if (i < 48) score2 += points;
        else if (i < 56) score3 += points;
        else if (i < 60) score4 += points;
        else if (i < 62) score5 += points;
        else if (i === 62) score6 += points;
        games += 1;
      }
    }

    const total = score1 + score2 + score3 + score4 + score5 + score6;

    return {
      ...identity,
      round1: score1,
      round2: score2,
      round3: score3,
      round4: score4,
      round5: score5,
      round6: score6,
      total: total,
      correctGames: games
    };
  });
}

export function calculatePotential(masterBracket: string[], eliminatedTeams: string[], entries: EntryLike[]): { entryId: string; firstName: string; lastName: string; potential: number }[] {
  const eliminatedTeamSet = new Set(eliminatedTeams);

  return entries.map(entry => {
    const selections = getEntrySelections(entry);
    const isSubmitted = isEntrySubmitted(entry);
    const identity = getEntryIdentity(entry);

    if (!isSubmitted) {
      return {
        ...identity,
        potential: 0
      };
    }

    let potential = 192;

    for (const teamStr of eliminatedTeamSet) {
      for (let i = 0; i < selections.length; i++) {
        if (areEquivalentSelections(selections[i], teamStr)) {
          potential -= getPointsForSelectionIndex(i);
        }
      }
    }

    for (let i = 0; i < selections.length; i++) {
      if (
        masterBracket[i] !== ''
        && areEquivalentSelections(selections[i], masterBracket[i])
        && !includesEquivalentSelection(eliminatedTeamSet, selections[i])
      ) {
        potential -= getPointsForSelectionIndex(i);
      }
    }

    return {
      ...identity,
      potential: potential
    };
  });
}

export function getEliminatedTeams(liveBracketData: LiveBracketData): string[] {
  const eliminatedTeams = new Set<string>();

  for (let i = 1; i <= 63; i++) {
    const match = liveBracketData.matches[i];
    if (match?.winner) {
      const losingTeam = match.winner === 'A' ? match.teamB : match.teamA;
      if (losingTeam) {
        eliminatedTeams.add(formatTeamSelection(losingTeam));
      }
    }
  }

  return Array.from(eliminatedTeams);
}

export function sortLeaderboardScores(scores: EntryScore[]): EntryScore[] {
  return [...scores].sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }

    if ((b.potential ?? 0) !== (a.potential ?? 0)) {
      return (b.potential ?? 0) - (a.potential ?? 0);
    }

    const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }

    return (a.firstName || '').localeCompare(b.firstName || '');
  });
}

export function buildLeaderboardRanks(sortedScores: EntryScore[]): (number | undefined)[] {
  const positions = assignPositions(sortedScores, { presorted: true });
  return sortedScores.map(score => positions.get(score.entryId));
}

export function assignPositions(scores: EntryScore[], { presorted = false } = {}): Map<string, number> {
  const sortedScores = presorted
    ? scores
    : [...scores].sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }

        return (b.potential ?? 0) - (a.potential ?? 0);
      });

  let currentPosition = 1;
  let currentScore: number | null = null;
  let currentPotential: number | null = null;
  let tieGroup: EntryScore[] = [];
  const positions = new Map<string, number>();

  for (const score of sortedScores) {
    if (currentScore === null || score.total !== currentScore || (score.potential ?? 0) !== currentPotential) {
      if (tieGroup.length > 0) {
        for (const tiedScore of tieGroup) {
          positions.set(tiedScore.entryId, currentPosition);
        }
        currentPosition += tieGroup.length;
      }

      currentScore = score.total;
      currentPotential = score.potential ?? 0;
      tieGroup = [score];
      continue;
    }

    tieGroup.push(score);
  }

  if (tieGroup.length > 0) {
    for (const tiedScore of tieGroup) {
      positions.set(tiedScore.entryId, currentPosition);
    }
  }

  return positions;
}
