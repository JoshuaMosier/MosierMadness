import type { PageServerLoad } from './$types';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';

export const load: PageServerLoad = async ({ depends }) => {
  depends('app:tournament');
  const tournamentSettings = await getTournamentSettings();
  const scores = await getTickerScores(tournamentSettings);
  return {
    tournamentSettings,
    scores
  };
};
