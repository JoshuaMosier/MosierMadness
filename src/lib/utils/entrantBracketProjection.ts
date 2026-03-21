import {
  areEquivalentSelections,
  formatTeamSelection,
  includesEquivalentSelection,
} from '$lib/utils/bracketUtils';
import { getEliminatedTeams } from '$lib/utils/scoringUtils';
import type {
  BracketMatch,
  LiveBracketData,
  TeamInfo,
} from '$lib/types';

type BracketLike = {
  selections?: string[] | null;
} | null | undefined;

function cloneTeam(team: TeamInfo | null): TeamInfo | null {
  return team ? { ...team } : null;
}

function styleProjectedTeam(team: TeamInfo | null, status: string): TeamInfo | null {
  if (!team) {
    return null;
  }

  if (status === 'correct') {
    return {
      ...team,
      color: '#22c55e',
      secondaryColor: '#16a34a',
    };
  }

  if (status === 'eliminated') {
    return {
      ...team,
      color: '#ef4444',
      secondaryColor: '#dc2626',
    };
  }

  return {
    ...team,
    color: '#666666',
    secondaryColor: '#666666',
  };
}

export function buildEntrantBracketData(
  selectedBracket: BracketLike,
  liveBracketData: LiveBracketData | null,
): LiveBracketData | null {
  if (!selectedBracket || !liveBracketData) {
    return null;
  }

  const selections = selectedBracket.selections || [];
  const eliminatedTeams = new Set(getEliminatedTeams(liveBracketData));
  const matches: Record<number, BracketMatch> = {};

  for (let i = 0; i < 32; i++) {
    const liveMatch = liveBracketData.matches[i + 1];
    matches[i + 1] = {
      ...liveMatch,
      teamA: cloneTeam(liveMatch?.teamA),
      teamB: cloneTeam(liveMatch?.teamB),
      winner: selections[i]
        ? areEquivalentSelections(selections[i], formatTeamSelection(liveMatch?.teamA))
          ? 'A'
          : areEquivalentSelections(selections[i], formatTeamSelection(liveMatch?.teamB))
            ? 'B'
            : null
        : null,
    };
  }

  for (let i = 32; i < 63; i++) {
    const prevRoundMatchA = Math.floor((i - 32) * 2) + 1;
    const prevRoundMatchB = prevRoundMatchA + 1;
    const prevMatchA = matches[prevRoundMatchA];
    const prevMatchB = matches[prevRoundMatchB];
    const projectedTeamA = prevMatchA?.winner === 'A' ? prevMatchA.teamA : prevMatchA?.winner === 'B' ? prevMatchA.teamB : null;
    const projectedTeamB = prevMatchB?.winner === 'A' ? prevMatchB.teamA : prevMatchB?.winner === 'B' ? prevMatchB.teamB : null;
    const liveMatch = liveBracketData.matches[i + 1];

    const projectedSelectionA = formatTeamSelection(projectedTeamA);
    const projectedSelectionB = formatTeamSelection(projectedTeamB);
    const liveSelectionA = formatTeamSelection(liveMatch?.teamA);
    const liveSelectionB = formatTeamSelection(liveMatch?.teamB);

    const teamAStatus = !projectedSelectionA
      ? 'pending'
      : areEquivalentSelections(projectedSelectionA, liveSelectionA)
        ? 'correct'
        : includesEquivalentSelection(eliminatedTeams, projectedSelectionA)
          ? 'eliminated'
          : 'pending';
    const teamBStatus = !projectedSelectionB
      ? 'pending'
      : areEquivalentSelections(projectedSelectionB, liveSelectionB)
        ? 'correct'
        : includesEquivalentSelection(eliminatedTeams, projectedSelectionB)
          ? 'eliminated'
          : 'pending';

    matches[i + 1] = {
      gameId: liveMatch?.gameId || null,
      bracketIndex: liveMatch?.bracketIndex || null,
      roundNumber: liveMatch?.roundNumber || null,
      region: liveMatch?.region || null,
      teamA: styleProjectedTeam(projectedTeamA, teamAStatus),
      teamB: styleProjectedTeam(projectedTeamB, teamBStatus),
      winner: selections[i]
        ? areEquivalentSelections(selections[i], projectedSelectionA)
          ? 'A'
          : areEquivalentSelections(selections[i], projectedSelectionB)
            ? 'B'
            : null
        : null,
      gameState: liveMatch?.gameState || null,
      period: liveMatch?.period || '',
      clock: liveMatch?.clock || '',
      startTime: liveMatch?.startTime || '',
      displayClock: liveMatch?.displayClock || '',
    };
  }

  const finalMatch = matches[63];
  const champion = finalMatch?.winner === 'A' ? finalMatch.teamA : finalMatch?.winner === 'B' ? finalMatch.teamB : null;

  return {
    matches,
    champion,
  };
}
