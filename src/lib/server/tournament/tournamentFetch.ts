/**
 * Fetches tournament data for a date. Tries sdataprod first (primary source),
 * falls back to casablanca if no tournament contests returned.
 */
import { NCAA_SCOREBOARD_BASE_URL } from '$lib/server/tournament/constants';
import { fetchContestsForDate } from '$lib/server/tournament/dailyScores';
import { sdataContestsToScoreboardDay } from '$lib/server/tournament/sdataAdapter';
import { fetchScoreboardOrEmpty } from '$lib/server/tournament/httpCache';

/** Normalize date to YYYY-MM-DD (handles PostgreSQL/Supabase returning ISO timestamps). */
function normalizeDateStr(value: unknown): string {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return String(value);
}

function getCasablancaScoreboardUrl(dateStr: string): string {
  const normalized = normalizeDateStr(dateStr);
  const [year, month, day] = normalized.split('-');
  return `${NCAA_SCOREBOARD_BASE_URL}/${year}/${month}/${day}/scoreboard.json`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchTournamentDayForDate(dateStr: string): Promise<{ games: any[] }> {
  const normalizedDate = normalizeDateStr(dateStr);
  try {
    const contests = await fetchContestsForDate(normalizedDate);
    const tournamentContests = contests.filter((c: { bracketId?: number | null }) => c.bracketId != null);
    if (tournamentContests.length > 0) {
      return sdataContestsToScoreboardDay(tournamentContests);
    }
  } catch {
    // sdataprod failed, fall through to casablanca
  }
  return fetchScoreboardOrEmpty(getCasablancaScoreboardUrl(normalizedDate));
}
