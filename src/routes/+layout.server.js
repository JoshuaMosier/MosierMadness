import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';

export async function load() {
  const [tournamentSettings, tickerScores] = await Promise.all([
    getTournamentSettings(),
    getTickerScores()
  ]);
  return {
    tournamentSettings,
    tickerScores
  };
}
