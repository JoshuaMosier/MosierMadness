import { getDailyNcaaScoreboard } from '$lib/server/tournament/dailyScores';
import { getScoreboardGamesForDate } from '$lib/server/tournament/snapshot';
import { getCurrentOrNextTickerRound, getTodayEtDateString, getTournamentSettings } from '$lib/server/tournament/settings';
import { SCOREBOARD_DAY_START_HOUR_ET } from '$lib/server/tournament/dates';
import { sortScoreboardGames } from '$lib/utils/scoreboardUtils';
import { isTournamentLive, isBracketOpen, isArchive, isComplete } from '$lib/utils/stageUtils';
import { getErrorMessage } from '$lib/server/tournament/constants';
import type { TournamentSettings, ScoreboardGame } from '$lib/types';

function dedupeGames(games: ScoreboardGame[]): ScoreboardGame[] {
  return Array.from(new Map(games.map(game => [game.gameId, game])).values());
}

async function getGamesForDates(
  dates: string[],
  options: { settings?: TournamentSettings; allowNonTournament?: boolean } = {},
): Promise<ScoreboardGame[]> {
  const gamesByDate = await Promise.all(
    dates.map(date => getScoreboardGamesForDate(date, options)),
  );

  return dedupeGames(gamesByDate.flat());
}

function getDisplayDatesForRound(roundDates: string[], date: Date = new Date()): string[] {
  const sortedDates = [...roundDates].sort();
  if (sortedDates.length <= 1) {
    return sortedDates;
  }

  const today = getTodayEtDateString(date, { dayStartsAtHourEt: SCOREBOARD_DAY_START_HOUR_ET });
  if (sortedDates.includes(today)) {
    return [today];
  }

  if (today > sortedDates[sortedDates.length - 1]) {
    return [sortedDates[sortedDates.length - 1]];
  }

  return sortedDates;
}

async function getCurrentRoundGames(settings: TournamentSettings, date: Date = new Date()): Promise<ScoreboardGame[]> {
  const round = getCurrentOrNextTickerRound(settings, date);
  if (!round) {
    return [];
  }

  const isFirstFour = round.key === 'first-four';
  const displayDates = getDisplayDatesForRound(round.dates, date);
  return sortScoreboardGames(
    await getGamesForDates(displayDates, { settings, allowNonTournament: isFirstFour }),
  );
}

export async function getTickerScores(explicitSettings: TournamentSettings | null = null): Promise<ScoreboardGame[]> {
  try {
    const settings = explicitSettings || await getTournamentSettings();

    if (isTournamentLive(settings.stage) || isBracketOpen(settings.stage)) {
      return getCurrentRoundGames(settings);
    }

    return sortScoreboardGames(
      await getDailyNcaaScoreboard(
        getTodayEtDateString(new Date(), { dayStartsAtHourEt: SCOREBOARD_DAY_START_HOUR_ET }),
      ),
    );
  } catch (error: unknown) {
    console.warn(`Falling back to empty ticker scores: ${getErrorMessage(error)}`);
    return [];
  }
}

export async function getTournamentScores(
  dateValue: Date | string | null = null,
  explicitSettings: TournamentSettings | null = null,
): Promise<ScoreboardGame[]> {
  try {
    const settings = explicitSettings || await getTournamentSettings();

    if (dateValue) {
      return sortScoreboardGames(
        await getScoreboardGamesForDate(dateValue, { settings, allowNonTournament: false }),
      );
    }

    if (isArchive(settings.stage) || isComplete(settings.stage)) {
      return sortScoreboardGames(
        await getScoreboardGamesForDate(settings.archiveScoreboardDate, {
          settings,
          allowNonTournament: false,
        }),
      );
    }

    if (isTournamentLive(settings.stage) || isBracketOpen(settings.stage)) {
      return getCurrentRoundGames(settings);
    }

    return [];
  } catch (error: unknown) {
    console.warn(`Falling back to empty tournament scores: ${getErrorMessage(error)}`);
    return [];
  }
}
