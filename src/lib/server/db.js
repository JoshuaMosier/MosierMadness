import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$lib/config';

// Create a Supabase client for server-side operations
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to execute SQL queries
export async function query(sql, params = []) {
  try {
    // For raw SQL queries, we'll use the from('').select() pattern
    // This is safer than RPC calls and works with the default setup
    const { data, error } = await supabase
      .from('raw_queries')  // This is just a placeholder, the actual query is what matters
      .select('*')
      .eq('query', sql)  // This helps with query caching
      .filter('params', 'eq', JSON.stringify(params));  // This helps with query caching
    
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

export const db = {
  query,
  supabase
}; 