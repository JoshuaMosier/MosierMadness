import { supabase } from '$lib/supabase';

function normalizeSubmittedBracket(bracket) {
  return {
    entryId: bracket.id,
    id: bracket.id,
    user_id: bracket.user_id,
    first_name: bracket.profiles?.first_name || 'Unknown',
    last_name: bracket.profiles?.last_name || 'User',
    firstName: bracket.profiles?.first_name || 'Unknown',
    lastName: bracket.profiles?.last_name || 'User',
    selections: bracket.selections || [],
    is_submitted: bracket.is_submitted,
  };
}

export async function getSubmittedEntries(year) {
  let query = supabase
    .from('brackets')
    .select(`
      id,
      user_id,
      year,
      selections,
      is_submitted,
      profiles:user_id (
        first_name,
        last_name
      )
    `)
    .eq('is_submitted', true);

  if (year) {
    query = query.eq('year', year);
  }

  const { data: brackets, error } = await query;

  if (error) {
    throw error;
  }

  return (brackets || []).map(normalizeSubmittedBracket);
}

export async function getEntriesWithProfiles(year) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      is_admin,
      brackets (
        id,
        user_id,
        year,
        is_submitted,
        selections,
        updated_at
      )
    `)
    .order('last_name', { ascending: true });

  if (error) {
    throw error;
  }

  if (!year) {
    return data || [];
  }

  return (data || []).map(profile => ({
    ...profile,
    brackets: (profile.brackets || []).filter(bracket => bracket.year === year),
  }));
}

export async function getProfileByUserId(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
