import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getScorePageScores } from '$lib/server/tournament/scores';

export async function load() {
  const [tournamentSettings, scores] = await Promise.all([
    getTournamentSettings(),
    getScorePageScores()
  ]);
  return {
    tournamentSettings,
    scores
  };
}
