import {
  NCAA_CONTESTS_WEB_SHA,
  NCAA_SDATA_API_URL,
} from '$lib/server/tournament/constants';
import { fetchJsonWithCache } from '$lib/server/tournament/httpCache';
import { formatContestDate, getSeasonYear } from '$lib/server/tournament/dates';
import { loadTeamColors, buildNormalizedTeam } from '$lib/server/tournament/teamColors';
import { resolveTeamSeoName } from '$lib/utils/teamColorUtils';
import { getStatusPriority } from '$lib/utils/scoreboardUtils';
import type { ScoreboardGame } from '$lib/types';

export function buildContestsUrl(dateValue: Date | string = new Date()): string {
  const url = new URL(NCAA_SDATA_API_URL);
  url.searchParams.set('meta', 'GetContests_web');
  url.searchParams.set('extensions', JSON.stringify({
    persistedQuery: {
      version: 1,
      sha256Hash: NCAA_CONTESTS_WEB_SHA,
    },
  }));
  url.searchParams.set('variables', JSON.stringify({
    sportCode: 'MBB',
    division: 1,
    seasonYear: getSeasonYear(dateValue),
    contestDate: formatContestDate(dateValue),
  }));
  return url.toString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTeam(team: any) {
  const name: string = team.nameShort || 'TBD';
  return buildNormalizedTeam({
    name,
    ncaaName: name,
    char6: team.name6Char || name.slice(0, 6).toUpperCase(),
    seoName: resolveTeamSeoName(name, team.seoname),
    score: Number.isFinite(team.score) ? team.score : null,
    scoreText: Number.isFinite(team.score) ? String(team.score) : '',
    seed: team.seed ? Number.parseInt(team.seed, 10) : null,
    winner: team.isWinner === true,
    description: name,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDisplayClock(contest: any): string {
  const status = (contest.statusCodeDisplay || '').toLowerCase();

  if (status === 'live') {
    if (contest.currentPeriod && contest.contestClock) {
      return `${contest.currentPeriod} ${contest.contestClock}`.trim();
    }
    return contest.currentPeriod || contest.contestClock || 'LIVE';
  }

  if (status === 'final') {
    return contest.finalMessage || 'FINAL';
  }

  return contest.startTime || '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeContest(contest: any): ScoreboardGame | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySource = contest.teams?.find((team: any) => team.isHome === false) || contest.teams?.[1];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeSource = contest.teams?.find((team: any) => team.isHome === true) || contest.teams?.[0];

  if (!awaySource || !homeSource) {
    return null;
  }

  const awayTeam = normalizeTeam(awaySource);
  const homeTeam = normalizeTeam(homeSource);
  const statusLabel = (contest.statusCodeDisplay || contest.gameState || '').toUpperCase();

  return {
    gameId: `daily-${contest.contestId}`,
    bracketId: null,
    bracketIndex: null,
    roundNumber: null,
    gameNumber: null,
    region: null,
    status: contest.gameState || statusLabel,
    statusLabel,
    displayClock: getDisplayClock(contest),
    period: contest.currentPeriod || '',
    clock: contest.contestClock || '',
    startTime: contest.startTime || '',
    awayTeam,
    homeTeam,
    matchup: `${awayTeam.name} vs ${homeTeam.name}`,
    sortPriority: getStatusPriority(statusLabel),
    isTournamentGame: false,
  };
}

/**
 * Fetch raw contests from sdataprod for a given date.
 * Returns tournament contests (with bracketId) and optionally all contests.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchContestsForDate(dateValue: Date | string = new Date()): Promise<any[]> {
  const url = buildContestsUrl(dateValue);
  const payload = await fetchJsonWithCache(url);
  return payload?.data?.contests || [];
}

export async function getDailyNcaaScoreboard(dateValue: Date | string = new Date()): Promise<ScoreboardGame[]> {
  await loadTeamColors();
  const url = buildContestsUrl(dateValue);
  const payload = await fetchJsonWithCache(url);
  return (payload?.data?.contests || [])
    .map(normalizeContest)
    .filter(Boolean) as ScoreboardGame[];
}
