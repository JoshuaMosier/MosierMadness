import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { TEAM_COLORS_BY_SEO } from '../../teamColorData.js';
import { getDailyNcaaScoreboard } from '../tournament/dailyScores.js';
import { getTournamentSnapshot } from '../tournament/snapshot.js';

const LOGO_DIRECTORY = fileURLToPath(new URL('../../../../static/images/team-logos/', import.meta.url));
const IGNORED_LOGO_SLUGS = new Set([
  'placeholder-team',
  'tba',
]);

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function getLogoSlugs() {
  return fs.readdirSync(LOGO_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.svg'))
    .map((fileName) => fileName.replace(/\.svg$/i, ''))
    .filter((slug) => !IGNORED_LOGO_SLUGS.has(slug))
    .sort((a, b) => a.localeCompare(b));
}

export function getTeamColorCoverageSummary() {
  const logoSlugs = getLogoSlugs();
  const missingLogoSlugs = logoSlugs.filter((slug) => !TEAM_COLORS_BY_SEO[slug]);

  return {
    logoSlugCount: logoSlugs.length,
    coveredLogoSlugCount: logoSlugs.length - missingLogoSlugs.length,
    missingLogoSlugCount: missingLogoSlugs.length,
    missingLogoSlugs,
  };
}

function summarizeScoreboardTeams(games, logoSlugs) {
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
        .filter((team) => team.seoName && !TEAM_COLORS_BY_SEO[team.seoName])
        .map((team) => team.seoName)
    ),
    grayPrimaryFallbackTeams: uniqueSorted(
      teams
        .filter((team) => team.color === '#666666')
        .map((team) => `${team.name}${team.seoName ? ` (${team.seoName})` : ''}`)
    ),
  };
}

function getSnapshotAgeMinutes(fetchedAt) {
  if (!fetchedAt) {
    return null;
  }

  const fetchedMs = Date.parse(fetchedAt);
  if (!Number.isFinite(fetchedMs)) {
    return null;
  }

  return Math.round((Date.now() - fetchedMs) / 60000);
}

function validateSettings(settings) {
  const issues = [];

  if (!settings?.entrySeasonYear) {
    issues.push('Entry season year is missing.');
  }

  if (!settings?.displaySeasonYear) {
    issues.push('Display season year is missing.');
  }

  if (settings?.stage === 'archive' && !settings?.archiveScoreboardDate) {
    issues.push('Archive stage is active without an archive scoreboard date.');
  }

  if (settings?.stage === 'tournament-live' && (!settings?.tickerRounds || settings.tickerRounds.length === 0)) {
    issues.push('Tournament-live stage is active without ticker rounds.');
  }

  if (!settings?.firstRoundDates || settings.firstRoundDates.length === 0) {
    issues.push('First round dates are empty.');
  }

  return issues;
}

export async function getAdminHealthChecks(settings) {
  const checkedAt = new Date().toISOString();
  const logoSlugs = getLogoSlugs();
  const health = {
    checkedAt,
    coverage: getTeamColorCoverageSummary(),
    settingsIssues: validateSettings(settings),
    snapshot: null,
    dailyScoreboard: null,
  };

  try {
    const snapshot = await getTournamentSnapshot(settings);
    health.snapshot = {
      fetchedAt: snapshot.fetchedAt,
      ageMinutes: getSnapshotAgeMinutes(snapshot.fetchedAt),
      scoreboardGameCount: snapshot.scoreboardGames.length,
      firstRoundTeamCount: snapshot.firstRoundTeams.filter(Boolean).length,
      ...summarizeScoreboardTeams(snapshot.scoreboardGames, logoSlugs),
    };
  } catch (error) {
    health.snapshot = {
      error: error?.message || 'Failed to build tournament snapshot.',
    };
  }

  try {
    const dailyScoreboardGames = await getDailyNcaaScoreboard(new Date());
    health.dailyScoreboard = {
      checkedAt,
      gameCount: dailyScoreboardGames.length,
      ...summarizeScoreboardTeams(dailyScoreboardGames, logoSlugs),
    };
  } catch (error) {
    health.dailyScoreboard = {
      error: error?.message || 'Failed to fetch daily NCAA scoreboard.',
    };
  }

  return health;
}
