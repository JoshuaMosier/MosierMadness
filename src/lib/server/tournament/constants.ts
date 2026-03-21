export const NCAA_SCOREBOARD_BASE_URL =
  'https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1';
export const NCAA_SDATA_API_URL = 'https://sdataprod.ncaa.com';
export const NCAA_CONTESTS_WEB_SHA = '7287cda610a9326931931080cb3a604828febe6fe3c9016a7e4a36db99efdb7c';
export const NCAA_GAMECENTER_BOX_SCORE_BASKETBALL_WEB_SHA =
  '4a7fa26398db33de3ff51402a90eb5f25acef001cca28d239fe5361315d1419a';
export const NCAA_GAMECENTER_TEAM_STATS_BASKETBALL_WEB_SHA =
  '5fcf84602d59c003f37ddd1185da542578080e04fe854e935cbcaee590a0e8a2';

export const SNAPSHOT_TTL_MS = 30_000;
export const RESPONSE_TTL_MS = 30_000;
export const HTTP_FETCH_TIMEOUT_MS = 8_000;

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
