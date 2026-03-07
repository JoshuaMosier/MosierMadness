import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';

export async function load() {
  const tournamentSettings = await getTournamentSettings();
  const tickerScores = await getTickerScores(tournamentSettings);
  return {
    tournamentSettings,
    tickerScores
  };
}
