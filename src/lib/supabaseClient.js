import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$lib/config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to execute Supabase queries with error handling
export async function query(tableName, queryFn) {
  try {
    const query = supabase.from(tableName);
    const { data, error } = await queryFn(query);
    
    if (error) {
      console.error('Database query error:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
} 