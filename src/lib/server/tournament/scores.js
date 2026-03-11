import { getDailyNcaaScoreboard } from '$lib/server/tournament/dailyScores';
import { getScoreboardGamesForDate } from '$lib/server/tournament/snapshot';
import { getCurrentOrNextTickerRound, getTournamentSettings } from '$lib/server/tournament/settings';
import { sortScoreboardGames } from '$lib/utils/scoreboardUtils';
import { isTournamentLive, isArchive, isComplete } from '$lib/utils/stageUtils';

function dedupeGames(games) {
  return Array.from(new Map(games.map(game => [game.gameId, game])).values());
}

async function getGamesForDates(dates, options = {}) {
  const gamesByDate = await Promise.all(
    dates.map(date => getScoreboardGamesForDate(date, options)),
  );

  return dedupeGames(gamesByDate.flat());
}

async function getCurrentRoundGames(settings) {
  const round = getCurrentOrNextTickerRound(settings);
  if (!round) {
    return [];
  }

  return sortScoreboardGames(
    await getGamesForDates(round.dates, { settings, allowNonTournament: false }),
  );
}

export async function getTickerScores(explicitSettings = null) {
  const settings = explicitSettings || await getTournamentSettings();

  if (isTournamentLive(settings.stage)) {
    return getCurrentRoundGames(settings);
  }

  return sortScoreboardGames(
    await getDailyNcaaScoreboard(new Date()),
  );
}

export async function getTournamentScores(dateValue = null, explicitSettings = null) {
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

  if (isTournamentLive(settings.stage)) {
    return getCurrentRoundGames(settings);
  }

  return [];
}
