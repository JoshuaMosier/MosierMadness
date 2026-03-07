import { getScoreboardGamesForDate } from '$lib/server/tournament/snapshot';
import { getCurrentOrNextTickerRound, getTournamentSettings } from '$lib/server/tournament/settings';
import { sortScoreboardGames } from '$lib/utils/scoreboardUtils';

function dedupeGames(games) {
  return Array.from(new Map(games.map(game => [game.gameId, game])).values());
}

async function getGamesForDates(dates, options = {}) {
  const gamesByDate = await Promise.all(
    dates.map(date => getScoreboardGamesForDate(date, options)),
  );

  return dedupeGames(gamesByDate.flat());
}

export async function getTickerScores() {
  const settings = await getTournamentSettings();

  if (settings.stage === 'tournament-live') {
    const round = getCurrentOrNextTickerRound(settings);
    if (!round) {
      return [];
    }

    return sortScoreboardGames(
      await getGamesForDates(round.dates, { settings, allowNonTournament: false }),
    );
  }

  return sortScoreboardGames(
    await getScoreboardGamesForDate(new Date(), { settings, allowNonTournament: true }),
  );
}

export async function getTournamentScores(dateValue = null) {
  const settings = await getTournamentSettings();

  if (dateValue) {
    return sortScoreboardGames(
      await getScoreboardGamesForDate(dateValue, { settings, allowNonTournament: false }),
    );
  }

  if (settings.stage === 'archive' || settings.stage === 'complete') {
    return sortScoreboardGames(
      await getScoreboardGamesForDate(settings.archiveScoreboardDate, {
        settings,
        allowNonTournament: false,
      }),
    );
  }

  if (settings.stage === 'tournament-live') {
    const round = getCurrentOrNextTickerRound(settings);
    if (!round) {
      return [];
    }

    return sortScoreboardGames(
      await getGamesForDates(round.dates, { settings, allowNonTournament: false }),
    );
  }

  return [];
}
