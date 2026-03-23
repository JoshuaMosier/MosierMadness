import { getDailyNcaaScoreboard } from '$lib/server/tournament/dailyScores';
import { getScoreboardGamesForDate } from '$lib/server/tournament/snapshot';
import { getCurrentOrNextTickerRound, getTodayEtDateString, getTournamentSettings } from '$lib/server/tournament/settings';
import { SCOREBOARD_DAY_START_HOUR_ET } from '$lib/server/tournament/dates';
import { sortScoreboardGames } from '$lib/utils/scoreboardUtils';
import { isTournamentLive, isBracketOpen, isArchive, isComplete } from '$lib/utils/stageUtils';
import { getErrorMessage } from '$lib/server/tournament/constants';
import type { TournamentSettings, ScoreboardGame, TickerRound } from '$lib/types';

function dedupeGames(games: ScoreboardGame[]): ScoreboardGame[] {
  return Array.from(new Map(games.map(game => [game.gameId, game])).values());
}

function isSweetSixteenRound(round: Pick<TickerRound, 'key' | 'label'>): boolean {
  return round.key === 'sweet-16' || /sweet\s*(16|sixteen)/i.test(round.label);
}

function isSweetSixteenOrLaterRound(settings: TournamentSettings, round: TickerRound): boolean {
  const configuredRounds = settings.tickerRounds || [];
  const sweetSixteenIndex = configuredRounds.findIndex(isSweetSixteenRound);
  const roundIndex = configuredRounds.findIndex(candidate => candidate.key === round.key);

  if (sweetSixteenIndex !== -1 && roundIndex !== -1) {
    return roundIndex >= sweetSixteenIndex;
  }

  return (
    isSweetSixteenRound(round)
    || round.key === 'elite-8'
    || round.key === 'final-four'
    || round.key === 'championship'
    || /elite\s*8|final\s*four|championship/i.test(round.label)
  );
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

function getDisplayDatesForRound(settings: TournamentSettings, round: TickerRound, date: Date = new Date()): string[] {
  const sortedDates = [...round.dates].sort();
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

  // Sweet Sixteen and later should only show the next slate of games, not both round days at once.
  if (isSweetSixteenOrLaterRound(settings, round)) {
    return [sortedDates.find(roundDate => roundDate >= today) || sortedDates[0]];
  }

  return sortedDates;
}

async function getCurrentRoundGames(settings: TournamentSettings, date: Date = new Date()): Promise<ScoreboardGame[]> {
  const round = getCurrentOrNextTickerRound(settings, date);
  if (!round) {
    return [];
  }

  const isFirstFour = round.key === 'first-four';
  const displayDates = getDisplayDatesForRound(settings, round, date);
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
