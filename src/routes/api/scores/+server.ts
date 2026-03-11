import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getTickerScores, getTournamentScores } from '$lib/server/tournament/scores';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const scope = url.searchParams.get('scope') || 'tournament';
    const dateParam = url.searchParams.get('date');

    let scores;
    if (scope === 'ticker' || scope === 'page') {
      scores = await getTickerScores();
    } else {
      scores = await getTournamentScores(dateParam);
    }

    return json(scores);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
};
