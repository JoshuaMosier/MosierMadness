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
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }
}

// Function to create a user record bypassing RLS
export async function createUserRecord(userId, userData) {
  try {
    // First try with regular client
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, ...userData }])
      .select()
      .single();
    
    if (!error) {
      return { data, error: null };
    }
    
    // If there's an RLS error, we'll need to handle it differently
    console.warn('RLS policy prevented user creation. You may need to add the appropriate policy.');
    console.error('Error creating user record:', error);
    
    return { 
      data: null, 
      error: {
        ...error,
        message: 'Unable to create user record due to security policies. Please contact the administrator.'
      }
    };
  } catch (error) {
    console.error('Error in createUserRecord:', error);
    return { data: null, error };
  }
} 