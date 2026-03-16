import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { loadTeamColors, getAllTeamColors } from '../tournament/teamColors';
import { getDailyNcaaScoreboard } from '../tournament/dailyScores';
import { getTournamentSnapshot } from '../tournament/snapshot';
import { isArchive, isTournamentLive } from '$lib/utils/stageUtils';
import type { TournamentSettings, ScoreboardGame } from '$lib/types';

const LOGO_DIRECTORY = fileURLToPath(new URL('../../../../static/images/team-logos/', import.meta.url));
const IGNORED_LOGO_SLUGS = new Set<string>([
  'placeholder-team',
  'tba',
]);

function uniqueSorted(values: (string | undefined | null)[]): string[] {
  return [...new Set(values.filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
}

export function getLogoSlugs(): string[] {
  try {
    return fs.readdirSync(LOGO_DIRECTORY)
      .filter((fileName) => fileName.endsWith('.svg'))
      .map((fileName) => fileName.replace(/\.svg$/i, ''))
      .filter((slug) => !IGNORED_LOGO_SLUGS.has(slug))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export function getTeamColorCoverageSummary() {
  const logoSlugs = getLogoSlugs();
  const teamColors = getAllTeamColors();
  const missingLogoSlugs = logoSlugs.filter((slug) => !teamColors.has(slug));

  return {
    logoSlugCount: logoSlugs.length,
    coveredLogoSlugCount: logoSlugs.length - missingLogoSlugs.length,
    missingLogoSlugCount: missingLogoSlugs.length,
    missingLogoSlugs,
  };
}

function summarizeScoreboardTeams(games: ScoreboardGame[], logoSlugs: string[]) {
  const logoSlugSet = new Set(logoSlugs);
  const teams = games.flatMap((game) => [game.awayTeam, game.homeTeam]).filter(Boolean);

  return {
    trackedTeamCount: teams.length,
    uniqueSeoNameCount: uniqueSorted(teams.map((team) => team.seoName)).length,
    missingSeoTeamNames: uniqueSorted(teams.filter((team) => !team.seoName).map((team) => team.name)),
    missingLogoSeoNames: uniqueSorted(
      teams
        .filter((team) => team.seoName && !logoSlugSet.has(team.seoName))
        .map((team) => team.seoName)
    ),
    missingColorSeoNames: uniqueSorted(
      teams
        .filter((team) => team.seoName && !getAllTeamColors().has(team.seoName))
        .map((team) => team.seoName)
    ),
    grayPrimaryFallbackTeams: uniqueSorted(
      teams
        .filter((team) => team.color === '#666666')
        .map((team) => `${team.name}${team.seoName ? ` (${team.seoName})` : ''}`)
    ),
  };
}

function getSnapshotAgeMinutes(fetchedAt: string | null | undefined): number | null {
  if (!fetchedAt) {
    return null;
  }

  const fetchedMs = Date.parse(fetchedAt);
  if (!Number.isFinite(fetchedMs)) {
    return null;
  }

  return Math.round((Date.now() - fetchedMs) / 60000);
}

function validateSettings(settings: TournamentSettings | null | undefined): string[] {
  const issues: string[] = [];

  if (!settings?.entrySeasonYear) {
    issues.push('Entry season year is missing.');
  }

  if (!settings?.displaySeasonYear) {
    issues.push('Display season year is missing.');
  }

  if (isArchive(settings?.stage) && !settings?.archiveScoreboardDate) {
    issues.push('Archive stage is active without an archive scoreboard date.');
  }

  if (isTournamentLive(settings?.stage) && (!settings?.tickerRounds || settings.tickerRounds.length === 0)) {
    issues.push('Tournament-live stage is active without ticker rounds.');
  }

  if (!settings?.firstRoundDates || settings.firstRoundDates.length === 0) {
    issues.push('First round dates are empty.');
  }

  return issues;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAdminHealthChecks(settings: TournamentSettings): Promise<any> {
  await loadTeamColors();
  const checkedAt = new Date().toISOString();
  const logoSlugs = getLogoSlugs();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const health: any = {
    checkedAt,
    coverage: getTeamColorCoverageSummary(),
    settingsIssues: validateSettings(settings),
    snapshot: null,
    dailyScoreboard: null,
  };

  try {
    const snapshot = await getTournamentSnapshot(settings);
    const firstRoundTeamCount = snapshot.firstRoundTeams.filter(Boolean).length;
    health.snapshot = {
      fetchedAt: snapshot.fetchedAt,
      ageMinutes: getSnapshotAgeMinutes(snapshot.fetchedAt),
      scoreboardGameCount: snapshot.scoreboardGames.length,
      firstRoundTeamCount,
      firstRoundDatesUsed: snapshot.settings.firstRoundDates || [],
      entrySeasonYear: snapshot.settings.entrySeasonYear,
      ...summarizeScoreboardTeams(snapshot.scoreboardGames, logoSlugs),
    };
  } catch (error: unknown) {
    health.snapshot = {
      error: error instanceof Error ? error.message : 'Failed to build tournament snapshot.',
    };
  }

  try {
    const dailyScoreboardGames = await getDailyNcaaScoreboard(new Date());
    health.dailyScoreboard = {
      checkedAt,
      gameCount: dailyScoreboardGames.length,
      ...summarizeScoreboardTeams(dailyScoreboardGames, logoSlugs),
    };
  } catch (error: unknown) {
    health.dailyScoreboard = {
      error: error instanceof Error ? error.message : 'Failed to fetch daily NCAA scoreboard.',
    };
  }

  return health;
}
