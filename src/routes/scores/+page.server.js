import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';

export async function load({ depends }) {
  depends('app:tournament');
  const tournamentSettings = await getTournamentSettings();
  const scores = await getTickerScores(tournamentSettings);
  return {
    tournamentSettings,
    scores
  };
}
