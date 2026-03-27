import { dev } from '$app/environment';
import { formatTeamSelection } from '$lib/utils/bracketUtils';
import type { BracketMatch, TeamInfo, TournamentSnapshot } from '$lib/types';

const SCENARIO_DATE_PARAM = 'scenarioDate';
const SCENARIO_ASSUMPTION_PARAM = 'scenarioAssumeRound2';
const ROUND_OF_32_START_INDEX = 33;
const ROUND_OF_32_END_INDEX = 48;
const SWEET_SIXTEEN_START_INDEX = 49;
const SWEET_SIXTEEN_END_INDEX = 56;

export type ScenarioPreviewAssumption = 'higher-seed';

function isValidYyyyMmDd(value: string | null): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  return normalized.getUTCFullYear() === year
    && normalized.getUTCMonth() === month - 1
    && normalized.getUTCDate() === day;
}

export function getScenarioPreviewDate(url: URL): string | null {
  if (!dev) {
    return null;
  }

  const candidate = url.searchParams.get(SCENARIO_DATE_PARAM);
  return isValidYyyyMmDd(candidate) ? candidate : null;
}

export function getScenarioPreviewAssumption(url: URL): ScenarioPreviewAssumption | null {
  if (!dev) {
    return null;
  }

  return url.searchParams.get(SCENARIO_ASSUMPTION_PARAM) === 'higher-seed'
    ? 'higher-seed'
    : null;
}

export function isRoundOf32FieldReady(
  snapshot: Pick<TournamentSnapshot, 'bracketMatches'>,
): boolean {
  for (let bracketIndex = ROUND_OF_32_START_INDEX; bracketIndex <= ROUND_OF_32_END_INDEX; bracketIndex += 1) {
    const match = snapshot.bracketMatches[bracketIndex];
    if (!match?.teamA || !match?.teamB) {
      return false;
    }
  }

  return true;
}


function cloneTeam(team: TeamInfo | null): TeamInfo | null {
  return team ? { ...team } : null;
}

function cloneBracketMatch(match: BracketMatch): BracketMatch {
  return {
    ...match,
    teamA: cloneTeam(match.teamA),
    teamB: cloneTeam(match.teamB),
  };
}

function getHigherSeedWinner(match: BracketMatch): 'A' | 'B' | null {
  if (!match.teamA || !match.teamB) {
    return null;
  }

  return match.teamA.seed <= match.teamB.seed ? 'A' : 'B';
}

function getWinningTeam(match: BracketMatch, winner: 'A' | 'B' | null): TeamInfo | null {
  if (winner === 'A') {
    return cloneTeam(match.teamA);
  }

  if (winner === 'B') {
    return cloneTeam(match.teamB);
  }

  return null;
}

function getResolvedWinnerFromMatch(match: BracketMatch, winnerSelection: string): TeamInfo | null {
  if (match.winner) {
    return getWinningTeam(match, match.winner);
  }

  if (!winnerSelection) {
    return null;
  }

  if (match.teamA && formatTeamSelection(match.teamA) === winnerSelection) {
    return cloneTeam(match.teamA);
  }

  if (match.teamB && formatTeamSelection(match.teamB) === winnerSelection) {
    return cloneTeam(match.teamB);
  }

  return null;
}

function applyHigherSeedRoundOf32Assumption(snapshot: TournamentSnapshot): TournamentSnapshot {
  const assumedSnapshot: TournamentSnapshot = {
    ...snapshot,
    masterBracket: [...snapshot.masterBracket],
    bracketMatches: Object.fromEntries(
      Object.entries(snapshot.bracketMatches).map(([key, match]) => [key, cloneBracketMatch(match)]),
    ) as Record<number, BracketMatch>,
  };

  for (let bracketIndex = ROUND_OF_32_START_INDEX; bracketIndex <= ROUND_OF_32_END_INDEX; bracketIndex += 1) {
    const match = assumedSnapshot.bracketMatches[bracketIndex];
    if (!match?.teamA || !match?.teamB || match.winner) {
      continue;
    }

    const winner = getHigherSeedWinner(match);
    const winningTeam = getWinningTeam(match, winner);
    if (!winner || !winningTeam) {
      continue;
    }

    assumedSnapshot.masterBracket[bracketIndex - 1] = formatTeamSelection(winningTeam);
    assumedSnapshot.bracketMatches[bracketIndex] = {
      ...match,
      winner,
    };
  }

  for (let gameOffset = 0; gameOffset <= SWEET_SIXTEEN_END_INDEX - SWEET_SIXTEEN_START_INDEX; gameOffset += 1) {
    const bracketIndex = SWEET_SIXTEEN_START_INDEX + gameOffset;
    const existingMatch = assumedSnapshot.bracketMatches[bracketIndex];
    const sourceMatchA = assumedSnapshot.bracketMatches[ROUND_OF_32_START_INDEX + (gameOffset * 2)];
    const sourceMatchB = assumedSnapshot.bracketMatches[ROUND_OF_32_START_INDEX + (gameOffset * 2) + 1];
    const teamA = getResolvedWinnerFromMatch(sourceMatchA, assumedSnapshot.masterBracket[sourceMatchA.bracketIndex! - 1]);
    const teamB = getResolvedWinnerFromMatch(sourceMatchB, assumedSnapshot.masterBracket[sourceMatchB.bracketIndex! - 1]);
    const winnerSelection = assumedSnapshot.masterBracket[bracketIndex - 1];
    const winner =
      teamA && winnerSelection === formatTeamSelection(teamA)
        ? 'A'
        : teamB && winnerSelection === formatTeamSelection(teamB)
          ? 'B'
          : null;

    assumedSnapshot.bracketMatches[bracketIndex] = {
      ...existingMatch,
      teamA,
      teamB,
      winner,
    };
  }

  return assumedSnapshot;
}

export function applyScenarioPreviewAssumption(
  snapshot: TournamentSnapshot,
  assumption: ScenarioPreviewAssumption | null,
): TournamentSnapshot {
  if (assumption !== 'higher-seed') {
    return snapshot;
  }

  return applyHigherSeedRoundOf32Assumption(snapshot);
}
