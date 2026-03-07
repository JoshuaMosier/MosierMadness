import { json } from '@sveltejs/kit';
import { getTickerScores, getTournamentScores } from '$lib/server/tournament/scores';

/**
 * GET handler for /api/scores endpoint
 */
export async function GET({ url }) {
  try {
    const scope = url.searchParams.get('scope') || 'tournament';
    // Check for date parameter in query string (format: YYYY-MM-DD)
    const dateParam = url.searchParams.get('date');

    let scores;
    if (scope === 'ticker') {
      scores = await getTickerScores();
    } else if (scope === 'page') {
      scores = await getTickerScores();
    } else {
      scores = await getTournamentScores(dateParam);
    }

    return json(scores);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 