import type { LayoutServerLoad } from './$types';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getTickerScores } from '$lib/server/tournament/scores';

export const load: LayoutServerLoad = async ({ depends, url }) => {
  depends('app:tournament');
  const tournamentSettings = await getTournamentSettings();
  const tickerScores = url.pathname === '/scores' ? [] : await getTickerScores(tournamentSettings);
  return {
    tournamentSettings,
    tickerScores
  };
};
