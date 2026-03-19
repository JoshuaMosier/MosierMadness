import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { TournamentSnapshot } from '$lib/types';

function serializeScoreboardGame(snapshot: TournamentSnapshot, gameId: string): string {
  const game = snapshot.gamesById.get(gameId);
  if (!game) {
    return gameId;
  }

  return [
    game.gameId,
    game.status,
    game.displayClock,
    game.awayTeam.scoreText,
    game.homeTeam.scoreText,
    game.awayTeam.winner ? '1' : '0',
    game.homeTeam.winner ? '1' : '0',
  ].join('|');
}

export function getTournamentSnapshotFingerprint(snapshot: TournamentSnapshot): string {
  const gameIds = Array.from(snapshot.gamesById.keys()).sort();

  return JSON.stringify({
    stage: snapshot.settings.stage,
    displaySeasonYear: snapshot.settings.displaySeasonYear,
    firstRoundDates: snapshot.settings.firstRoundDates,
    firstFourReplacementCompletedAt: snapshot.settings.firstFourConfig?.replacementCompletedAt ?? null,
    masterBracket: snapshot.masterBracket,
    games: gameIds.map((gameId) => serializeScoreboardGame(snapshot, gameId)),
  });
}

export async function notifyTournamentRefresh(): Promise<void> {
  try {
    await supabaseAdmin
      .from('realtime_updates')
      .upsert({ scope: 'tournament', updated_at: new Date().toISOString() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Realtime notify failed:', message);
  }
}
