import { getDailyNcaaScoreboard } from '$lib/server/tournament/dailyScores';
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

  if (settings.stage === 'tournament-live') {
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

  if (settings.stage === 'archive' || settings.stage === 'complete') {
    return sortScoreboardGames(
      await getScoreboardGamesForDate(settings.archiveScoreboardDate, {
        settings,
        allowNonTournament: false,
      }),
    );
  }

  if (settings.stage === 'tournament-live') {
    return getCurrentRoundGames(settings);
  }

  return [];
}

export async function getScorePageScores(explicitSettings = null) {
  const settings = explicitSettings || await getTournamentSettings();

  if (settings.stage === 'tournament-live') {
    return getCurrentRoundGames(settings);
  }

  return sortScoreboardGames(
    await getDailyNcaaScoreboard(new Date()),
  );
}
