import { json } from '@sveltejs/kit';

export async function GET({ url, locals: { supabase } }) {
  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit'), 10) || 10, 50);

    const { data, error } = await supabase
      .from('game_scores')
      .select('high_score, total_points, games_played, user_id, profiles:user_id (first_name, last_name)')
      .order('high_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return json(data);
  } catch (err) {
    console.error('Error fetching game scores:', err);
    return json({ error: err.message }, { status: 500 });
  }
}

export async function POST({ request, locals: { supabase } }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const score = Math.min(Math.max(Math.round(body.score || 0), 0), 30);

    // Fetch existing row to compute new totals
    const { data: existing } = await supabase
      .from('game_scores')
      .select('high_score, total_points, games_played')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('game_scores')
        .update({
          high_score: Math.max(existing.high_score, score),
          total_points: existing.total_points + score,
          games_played: existing.games_played + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('game_scores')
        .insert({
          user_id: user.id,
          high_score: score,
          total_points: score,
          games_played: 1
        });

      if (error) throw error;
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error saving game score:', err);
    return json({ error: err.message }, { status: 500 });
  }
}
