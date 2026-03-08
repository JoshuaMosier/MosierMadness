import { getLiveBracketProjection } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTournamentSettings } from '$lib/server/tournament/settings';

export async function load({ depends }) {
  depends('app:tournament');
  const settings = await getTournamentSettings();
  const snapshot = await getTournamentSnapshot(settings);

  return {
    bracketData: getLiveBracketProjection(snapshot),
    tournamentSettings: settings,
  };
}
