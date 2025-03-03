import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function GET() {
  try {
    // First check if our tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('entries')
      .select('count');

    if (tablesError) {
      console.error('Database tables not set up:', tablesError);
      return json({ 
        error: 'Database not initialized. Please run the database setup first.',
        details: tablesError.message 
      }, { status: 500 });
    }

    // If we get here, tables exist but might be empty
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*');

    if (entriesError) throw entriesError;

    return json(entries || []);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return json({ 
      error: 'Failed to fetch leaderboard data',
      details: error.message 
    }, { status: 500 });
  }
} 