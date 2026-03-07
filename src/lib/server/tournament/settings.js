import { supabase } from '$lib/supabase';

export const TOURNAMENT_STAGES = ['archive', 'bracket-open', 'tournament-live', 'complete'];

export const DEFAULT_TICKER_ROUNDS = [
  { key: 'round-1', label: 'First Round', dates: ['2025-03-20', '2025-03-21'] },
  { key: 'round-2', label: 'Second Round', dates: ['2025-03-22', '2025-03-23'] },
  { key: 'sweet-16', label: 'Sweet 16', dates: ['2025-03-27', '2025-03-28'] },
  { key: 'elite-8', label: 'Elite 8', dates: ['2025-03-29', '2025-03-30'] },
  { key: 'final-four', label: 'Final Four', dates: ['2025-04-05'] },
  { key: 'championship', label: 'Championship', dates: ['2025-04-07'] },
];

export const DEFAULT_TOURNAMENT_SETTINGS = {
  // Default to the upcoming entry season while still displaying the prior completed tournament in archive mode.
  entrySeasonYear: 2026,
  displaySeasonYear: 2025,
  stage: 'archive',
  archiveScoreboardDate: '2025-04-07',
  firstRoundDates: ['2025-03-20', '2025-03-21'],
  tickerRounds: DEFAULT_TICKER_ROUNDS,
};

const settingsCache = {
  value: null,
  expiresAt: 0,
};

const SETTINGS_TTL_MS = 30_000;

function normalizeDateArray(value, fallback) {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  return value.filter(Boolean);
}

function normalizeTickerRounds(value, fallback) {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  return value
    .map((round, index) => ({
      key: round?.key || `round-${index + 1}`,
      label: round?.label || `Round ${index + 1}`,
      dates: normalizeDateArray(round?.dates, []),
    }))
    .filter(round => round.dates.length > 0);
}

function normalizeSettingsRow(row) {
  if (!row) {
    return { ...DEFAULT_TOURNAMENT_SETTINGS };
  }

  const stage = TOURNAMENT_STAGES.includes(row.stage) ? row.stage : DEFAULT_TOURNAMENT_SETTINGS.stage;

  return {
    entrySeasonYear: row.entry_season_year || DEFAULT_TOURNAMENT_SETTINGS.entrySeasonYear,
    displaySeasonYear: row.display_season_year || row.entry_season_year || DEFAULT_TOURNAMENT_SETTINGS.displaySeasonYear,
    stage,
    archiveScoreboardDate: row.archive_scoreboard_date || DEFAULT_TOURNAMENT_SETTINGS.archiveScoreboardDate,
    firstRoundDates: normalizeDateArray(row.first_round_dates, DEFAULT_TOURNAMENT_SETTINGS.firstRoundDates),
    tickerRounds: normalizeTickerRounds(row.ticker_rounds, DEFAULT_TOURNAMENT_SETTINGS.tickerRounds),
  };
}

export function getDefaultTournamentSettings() {
  return {
    ...DEFAULT_TOURNAMENT_SETTINGS,
    firstRoundDates: [...DEFAULT_TOURNAMENT_SETTINGS.firstRoundDates],
    tickerRounds: DEFAULT_TOURNAMENT_SETTINGS.tickerRounds.map(round => ({
      ...round,
      dates: [...round.dates],
    })),
  };
}

export async function getTournamentSettings() {
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
        ticker_rounds
      `)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    settingsCache.value = normalizeSettingsRow(data);
  } catch (error) {
    console.warn('Falling back to default tournament settings:', error.message);
    settingsCache.value = getDefaultTournamentSettings();
  }

  settingsCache.expiresAt = now + SETTINGS_TTL_MS;
  return settingsCache.value;
}

export function getTodayEtDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

export function getCurrentOrNextTickerRound(settings, date = new Date()) {
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
