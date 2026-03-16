import { getDailyNcaaScoreboard } from '$lib/server/tournament/dailyScores';
import { getScoreboardGamesForDate } from '$lib/server/tournament/snapshot';
import { getCurrentOrNextTickerRound, getTournamentSettings } from '$lib/server/tournament/settings';
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

async function getCurrentRoundGames(settings: TournamentSettings): Promise<ScoreboardGame[]> {
  const round = getCurrentOrNextTickerRound(settings);
  if (!round) {
    return [];
  }

  const isFirstFour = round.key === 'first-four';
  return sortScoreboardGames(
    await getGamesForDates(round.dates, { settings, allowNonTournament: isFirstFour }),
  );
}

export async function getTickerScores(explicitSettings: TournamentSettings | null = null): Promise<ScoreboardGame[]> {
  try {
    const settings = explicitSettings || await getTournamentSettings();

    if (isTournamentLive(settings.stage) || isBracketOpen(settings.stage)) {
      return getCurrentRoundGames(settings);
    }

    return sortScoreboardGames(
      await getDailyNcaaScoreboard(new Date()),
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
