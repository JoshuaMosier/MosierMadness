import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';

export async function load({ depends, url }) {
  depends('app:tournament');
  const tournamentSettings = await getTournamentSettings();
  const tickerScores = url.pathname === '/scores' ? [] : await getTickerScores(tournamentSettings);
  return {
    tournamentSettings,
    tickerScores
  };
}
