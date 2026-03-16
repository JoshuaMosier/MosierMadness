export const NCAA_SCOREBOARD_BASE_URL =
  'https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1';
export const NCAA_SDATA_API_URL = 'https://sdataprod.ncaa.com';
export const NCAA_CONTESTS_WEB_SHA = '7287cda610a9326931931080cb3a604828febe6fe3c9016a7e4a36db99efdb7c';

export const SNAPSHOT_TTL_MS = 30_000;
export const RESPONSE_TTL_MS = 30_000;
export const HTTP_FETCH_TIMEOUT_MS = 8_000;

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
