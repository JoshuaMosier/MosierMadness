import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$lib/config';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication functions
export async function signUp(email, password, firstname, lastname) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstname,
        lastname
      }
    }
  });
  
  if (!error && data.user) {
    // Create a profile in the users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        { 
          id: data.user.id,
          firstname,
          lastname,
          email
        }
      ]);
      
    if (profileError) {
      console.error('Error creating profile:', profileError);
      return { data: null, error: profileError };
    }
  }
  
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function updatePassword(password) {
  const { data, error } = await supabase.auth.updateUser({
    password
  });
  
  return { data, error };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
} 