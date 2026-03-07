import {
  NCAA_CONTESTS_WEB_SHA,
  NCAA_SDATA_API_URL,
  RESPONSE_TTL_MS,
} from '$lib/server/tournament/constants';
import { getTeamColorSet, resolveTeamSeoName } from '$lib/utils/teamColorUtils';
import { getStatusPriority } from '$lib/utils/scoreboardUtils';

const responseCache = new Map();

function getEasternDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [month, day, year] = formatter.format(date).split('/');
  return { year, month, day };
}

function getContestDateString(dateValue = new Date()) {
  if (typeof dateValue === 'string') {
    const [year, month, day] = dateValue.split('-');
    return `${month}/${day}/${year}`;
  }

  const { year, month, day } = getEasternDateParts(dateValue);
  return `${month}/${day}/${year}`;
}

function getSeasonYear(dateValue = new Date()) {
  const { year, month } = typeof dateValue === 'string'
    ? (() => {
        const [rawYear, rawMonth] = dateValue.split('-');
        return { year: rawYear, month: rawMonth };
      })()
    : getEasternDateParts(dateValue);

  const numericYear = Number.parseInt(year, 10);
  const numericMonth = Number.parseInt(month, 10);

  if (!Number.isFinite(numericYear) || !Number.isFinite(numericMonth)) {
    return new Date().getFullYear();
  }

  return numericMonth >= 11 ? numericYear : numericYear - 1;
}

function buildContestsUrl(dateValue = new Date()) {
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
    contestDate: getContestDateString(dateValue),
  }));
  return url.toString();
}

async function fetchJsonWithCache(url) {
  const now = Date.now();
  const cached = responseCache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NCAA sdata API responded with status ${response.status} for ${url}`);
  }

  const value = await response.json();
  responseCache.set(url, {
    value,
    expiresAt: now + RESPONSE_TTL_MS,
  });

  return value;
}

function normalizeTeam(team) {
  const name = team.nameShort || 'TBD';
  const seoName = resolveTeamSeoName(name, team.seoname);
  const { primaryColor: color, secondaryColor } = getTeamColorSet(seoName);

  return {
    name,
    ncaaName: name,
    char6: team.name6Char || name.slice(0, 6).toUpperCase(),
    displayName: name.length > 14 ? (team.name6Char || name) : name,
    score: Number.isFinite(team.score) ? team.score : null,
    scoreText: Number.isFinite(team.score) ? String(team.score) : '',
    seed: team.seed ? Number.parseInt(team.seed, 10) : null,
    winner: team.isWinner === true,
    description: name,
    seoName,
    color,
    secondaryColor,
  };
}

function getDisplayClock(contest) {
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

function normalizeContest(contest) {
  const awaySource = contest.teams?.find(team => team.isHome === false) || contest.teams?.[1];
  const homeSource = contest.teams?.find(team => team.isHome === true) || contest.teams?.[0];

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

export async function getDailyNcaaScoreboard(dateValue = new Date()) {
  const url = buildContestsUrl(dateValue);
  const payload = await fetchJsonWithCache(url);
  return (payload?.data?.contests || [])
    .map(normalizeContest)
    .filter(Boolean);
}
