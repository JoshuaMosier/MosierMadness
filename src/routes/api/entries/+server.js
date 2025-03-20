import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export async function GET() {
  try {
    // Fetch all submitted brackets with user data
    const { data: brackets, error: bracketsError } = await supabase
      .from('brackets')
      .select(`
        id,
        user_id,
        selections,
        is_submitted,
        profiles:user_id (
          first_name,
          last_name
        )
      `)
      .eq('is_submitted', true);

    if (bracketsError) throw bracketsError;

    // Format entries for the scoring functions
    const entries = brackets.map(bracket => ({
      entryId: bracket.id, 
      id: bracket.id,
      user_id: bracket.user_id,
      first_name: bracket.profiles?.first_name || 'Unknown',
      last_name: bracket.profiles?.last_name || 'User',
      firstName: bracket.profiles?.first_name || 'Unknown',
      lastName: bracket.profiles?.last_name || 'User',
      selections: bracket.selections || [],
      is_submitted: bracket.is_submitted
    }));

    return json({ entries });
  } catch (err) {
    console.error('Error fetching entries:', err);
    return json({ error: err.message }, { status: 500 });
  }
} 