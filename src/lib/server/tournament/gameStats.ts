import {
  NCAA_GAMECENTER_TEAM_STATS_BASKETBALL_WEB_SHA,
  NCAA_SDATA_API_URL,
} from '$lib/server/tournament/constants';
import { fetchJsonWithCache } from '$lib/server/tournament/httpCache';
import type {
  NcaaBasketballBoxscore,
  NcaaBasketballBoxscoreTeam,
  NcaaBasketballPlayerStats,
  NcaaBasketballTeamStats,
} from '$lib/types';

const NCAA_GAMECENTER_TEAM_STATS_BASKETBALL_META = 'NCAA_GetGamecenterTeamStatsBasketballById_web';

function buildPersistedQueryUrl(meta: string, sha256Hash: string, variables: Record<string, unknown>): string {
  const url = new URL(NCAA_SDATA_API_URL);
  url.searchParams.set('meta', meta);
  url.searchParams.set('extensions', JSON.stringify({
    persistedQuery: {
      version: 1,
      sha256Hash,
    },
  }));
  url.searchParams.set('variables', JSON.stringify(variables));
  return url.toString();
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTeamStats(raw: any): NcaaBasketballTeamStats | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return {
    fieldGoalsMade: toStringValue(raw.fieldGoalsMade),
    fieldGoalsAttempted: toStringValue(raw.fieldGoalsAttempted),
    freeThrowsMade: toStringValue(raw.freeThrowsMade),
    freeThrowsAttempted: toStringValue(raw.freeThrowsAttempted),
    threePointsMade: toStringValue(raw.threePointsMade),
    threePointsAttempted: toStringValue(raw.threePointsAttempted),
    offensiveRebounds: toStringValue(raw.offensiveRebounds),
    totalRebounds: toStringValue(raw.totalRebounds),
    assists: toStringValue(raw.assists),
    turnovers: toStringValue(raw.turnovers),
    personalFouls: toStringValue(raw.personalFouls),
    steals: toStringValue(raw.steals),
    blockedShots: toStringValue(raw.blockedShots),
    points: toStringValue(raw.points),
    fieldGoalPercentage: toStringValue(raw.fieldGoalPercentage),
    threePointPercentage: toStringValue(raw.threePointPercentage),
    freeThrowPercentage: toStringValue(raw.freeThrowPercentage),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePlayerStats(raw: any): NcaaBasketballPlayerStats {
  return {
    id: toStringValue(raw?.id),
    number: toStringValue(raw?.number),
    firstName: toStringValue(raw?.firstName),
    lastName: toStringValue(raw?.lastName),
    position: toStringValue(raw?.position),
    minutesPlayed: toStringValue(raw?.minutesPlayed),
    starter: raw?.starter === true,
    fieldGoalsMade: toStringValue(raw?.fieldGoalsMade),
    fieldGoalsAttempted: toStringValue(raw?.fieldGoalsAttempted),
    freeThrowsMade: toStringValue(raw?.freeThrowsMade),
    freeThrowsAttempted: toStringValue(raw?.freeThrowsAttempted),
    threePointsMade: toStringValue(raw?.threePointsMade),
    threePointsAttempted: toStringValue(raw?.threePointsAttempted),
    offensiveRebounds: toStringValue(raw?.offensiveRebounds),
    totalRebounds: toStringValue(raw?.totalRebounds),
    assists: toStringValue(raw?.assists),
    turnovers: toStringValue(raw?.turnovers),
    personalFouls: toStringValue(raw?.personalFouls),
    steals: toStringValue(raw?.steals),
    blockedShots: toStringValue(raw?.blockedShots),
    points: toStringValue(raw?.points),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBoxscoreTeam(rawTeam: any, rawDetail: any): NcaaBasketballBoxscoreTeam {
  return {
    teamId: toStringValue(rawTeam?.teamId),
    isHome: rawTeam?.isHome === true,
    seoname: toStringValue(rawTeam?.seoname),
    name6Char: toStringValue(rawTeam?.name6Char),
    nameFull: toStringValue(rawTeam?.nameFull),
    nameShort: toStringValue(rawTeam?.nameShort),
    teamName: toStringValue(rawTeam?.teamName),
    color: rawTeam?.color ? String(rawTeam.color) : null,
    playerStats: Array.isArray(rawDetail?.playerStats) ? rawDetail.playerStats.map(normalizePlayerStats) : [],
    teamStats: normalizeTeamStats(rawDetail?.teamStats),
  };
}

export async function getNcaaBasketballBoxscore(
  contestId: string | number | null | undefined,
): Promise<NcaaBasketballBoxscore | null> {
  if (!contestId) {
    return null;
  }

  try {
    const payload = await fetchJsonWithCache(
      buildPersistedQueryUrl(
        NCAA_GAMECENTER_TEAM_STATS_BASKETBALL_META,
        NCAA_GAMECENTER_TEAM_STATS_BASKETBALL_WEB_SHA,
        { contestId: String(contestId) },
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boxscore = payload?.data?.boxscore as any;
    if (!boxscore || !Array.isArray(boxscore.teams) || !Array.isArray(boxscore.teamBoxscore)) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detailByTeamId = new Map<string, any>(
      boxscore.teamBoxscore.map((detail: any) => [toStringValue(detail?.teamId), detail]),
    );

    return {
      contestId: toStringValue(boxscore.contestId || contestId),
      description: toStringValue(boxscore.description),
      status: toStringValue(boxscore.status),
      period: toStringValue(boxscore.period),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teams: boxscore.teams.map((team: any) => normalizeBoxscoreTeam(team, detailByTeamId.get(toStringValue(team?.teamId)))),
    };
  } catch {
    return null;
  }
}
