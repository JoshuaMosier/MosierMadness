import { supabase } from '$lib/supabase';
import { getTodayEtDateString } from '$lib/server/tournament/dates';
import type { TournamentStage, TournamentSettings, TickerRound, FirstFourConfig, FirstFourGame } from '$lib/types';

export const TOURNAMENT_STAGES: readonly TournamentStage[] = ['archive', 'bracket-open', 'tournament-live', 'complete'];

function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}

function getNthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, occurrence: number): Date {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const firstWeekdayOffset = (weekday - firstOfMonth.getUTCDay() + 7) % 7;
  const date = 1 + firstWeekdayOffset + ((occurrence - 1) * 7);
  return new Date(Date.UTC(year, monthIndex, date));
}

function buildEasternTimestamp(date: Date, hour: number, minute: number = 0): string {
  const year = date.getUTCFullYear();
  const month = padNumber(date.getUTCMonth() + 1);
  const day = padNumber(date.getUTCDate());
  const formattedHour = padNumber(hour);
  const formattedMinute = padNumber(minute);
  return `${year}-${month}-${day}T${formattedHour}:${formattedMinute}:00-04:00`;
}

function getDefaultBracketRevealAt(entrySeasonYear: number): string {
  const selectionSunday = getNthWeekdayOfMonth(entrySeasonYear, 2, 0, 3);
  return buildEasternTimestamp(selectionSunday, 18);
}

function getDefaultEntryDeadlineAt(entrySeasonYear: number): string {
  const selectionSunday = getNthWeekdayOfMonth(entrySeasonYear, 2, 0, 3);
  const tipoffThursday = new Date(selectionSunday);
  tipoffThursday.setUTCDate(tipoffThursday.getUTCDate() + 4);
  return buildEasternTimestamp(tipoffThursday, 12);
}

export const DEFAULT_TICKER_ROUNDS: TickerRound[] = [
  { key: 'round-1', label: 'First Round', dates: ['2025-03-20', '2025-03-21'] },
  { key: 'round-2', label: 'Second Round', dates: ['2025-03-22', '2025-03-23'] },
  { key: 'sweet-16', label: 'Sweet 16', dates: ['2025-03-27', '2025-03-28'] },
  { key: 'elite-8', label: 'Elite 8', dates: ['2025-03-29', '2025-03-30'] },
  { key: 'final-four', label: 'Final Four', dates: ['2025-04-05'] },
  { key: 'championship', label: 'Championship', dates: ['2025-04-07'] },
];

export const DEFAULT_FIRST_FOUR_CONFIG: FirstFourConfig = {
  dates: [],
  games: [],
  replacementCompletedAt: null,
};

export const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  // Default to the upcoming entry season while still displaying the prior completed tournament in archive mode.
  entrySeasonYear: 2026,
  displaySeasonYear: 2025,
  stage: 'archive',
  archiveScoreboardDate: '2025-04-07',
  firstRoundDates: ['2025-03-20', '2025-03-21'],
  tickerRounds: DEFAULT_TICKER_ROUNDS,
  firstFourConfig: DEFAULT_FIRST_FOUR_CONFIG,
};

const settingsCache: { value: TournamentSettings | null; expiresAt: number } = {
  value: null,
  expiresAt: 0,
};

const SETTINGS_TTL_MS = 30_000;

function normalizeDateArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  return value.filter(Boolean) as string[];
}

function normalizeFirstFourConfig(value: unknown): FirstFourConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_FIRST_FOUR_CONFIG };
  }

  const obj = value as Record<string, unknown>;

  return {
    dates: normalizeDateArray(obj.dates, []),
    games: Array.isArray(obj.games)
      ? (obj.games as Record<string, unknown>[]).map((g): FirstFourGame => ({
          firstFourBracketId: String(g?.firstFourBracketId || ''),
          firstRoundBracketId: String(g?.firstRoundBracketId || ''),
          seed: Number(g?.seed) || 16,
          compositeDisplayName: String(g?.compositeDisplayName || ''),
        })).filter(g => g.firstFourBracketId && g.firstRoundBracketId && g.compositeDisplayName)
      : [],
    replacementCompletedAt: (obj.replacementCompletedAt as string | null) || null,
  };
}

function normalizeTickerRounds(value: unknown, fallback: TickerRound[]): TickerRound[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  return (value as Record<string, unknown>[])
    .map((round, index): TickerRound => ({
      key: (round?.key as string) || `round-${index + 1}`,
      label: (round?.label as string) || `Round ${index + 1}`,
      dates: normalizeDateArray(round?.dates, []),
    }))
    .filter(round => round.dates.length > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSettingsRow(row: Record<string, any> | null): TournamentSettings {
  if (!row) {
    return getDefaultTournamentSettings();
  }

  const entrySeasonYear = row.entry_season_year || DEFAULT_TOURNAMENT_SETTINGS.entrySeasonYear;
  const stage: TournamentStage = (TOURNAMENT_STAGES as readonly string[]).includes(row.stage)
    ? (row.stage as TournamentStage)
    : DEFAULT_TOURNAMENT_SETTINGS.stage;

  return {
    entrySeasonYear,
    displaySeasonYear: row.display_season_year || row.entry_season_year || DEFAULT_TOURNAMENT_SETTINGS.displaySeasonYear,
    stage,
    archiveScoreboardDate: row.archive_scoreboard_date || DEFAULT_TOURNAMENT_SETTINGS.archiveScoreboardDate,
    firstRoundDates: normalizeDateArray(row.first_round_dates, DEFAULT_TOURNAMENT_SETTINGS.firstRoundDates),
    tickerRounds: normalizeTickerRounds(row.ticker_rounds, DEFAULT_TOURNAMENT_SETTINGS.tickerRounds),
    firstFourConfig: normalizeFirstFourConfig(row.first_four_config),
  };
}

export function getDefaultTournamentSettings(): TournamentSettings {
  return {
    ...DEFAULT_TOURNAMENT_SETTINGS,
    firstRoundDates: [...DEFAULT_TOURNAMENT_SETTINGS.firstRoundDates],
    tickerRounds: DEFAULT_TOURNAMENT_SETTINGS.tickerRounds.map(round => ({
      ...round,
      dates: [...round.dates],
    })),
    firstFourConfig: { ...DEFAULT_FIRST_FOUR_CONFIG },
  };
}

export function invalidateSettingsCache(): void {
  settingsCache.value = null;
  settingsCache.expiresAt = 0;
}

export async function getTournamentSettings(): Promise<TournamentSettings> {
  const now = Date.now();
  if (settingsCache.value && settingsCache.expiresAt > now) {
    return settingsCache.value;
  }

  try {
    const { data, error } = await supabase
      .from('tournament_seasons')
      .select(`
        entry_season_year,
        display_season_year,
        stage,
        archive_scoreboard_date,
        first_round_dates,
        ticker_rounds,
        first_four_config
      `)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    settingsCache.value = normalizeSettingsRow(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Falling back to default tournament settings:', message);
    settingsCache.value = getDefaultTournamentSettings();
  }

  settingsCache.expiresAt = now + SETTINGS_TTL_MS;
  return settingsCache.value!;
}

export function getBracketRevealAt(entrySeasonYear: number): string {
  return getDefaultBracketRevealAt(entrySeasonYear);
}

export function getEntryDeadlineAt(entrySeasonYear: number): string {
  return getDefaultEntryDeadlineAt(entrySeasonYear);
}

export { getTodayEtDateString } from '$lib/server/tournament/dates';

export function getCurrentOrNextTickerRound(settings: TournamentSettings, date: Date = new Date()): TickerRound | null {
  const today = getTodayEtDateString(date);
  const rounds = settings.tickerRounds || [];

  for (const round of rounds) {
    const sortedDates = [...round.dates].sort();
    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];

    if (today >= firstDate && today <= lastDate) {
      return round;
    }

    if (today < firstDate) {
      return round;
    }
  }

  return rounds[rounds.length - 1] || null;
}
