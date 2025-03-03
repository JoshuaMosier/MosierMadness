import { supabase } from './auth';

// Save a user's bracket
export async function saveBracket(userId, selections) {
  try {
    const currentYear = new Date().getFullYear();
    
    // Check if the user already has a bracket for this year
    const { data: existingBracket, error: fetchError } = await supabase
      .from('brackets')
      .select('*')
      .eq('user_id', userId)
      .eq('year', currentYear)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than "no rows returned"
      console.error('Error checking for existing bracket:', fetchError);
      return { error: fetchError };
    }
    
    let result;
    
    if (existingBracket) {
      // Update existing bracket
      result = await supabase
        .from('brackets')
        .update({ 
          selections: selections,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingBracket.id);
    } else {
      // Insert new bracket
      result = await supabase
        .from('brackets')
        .insert([
          {
            user_id: userId,
            year: currentYear,
            selections: selections
          }
        ]);
    }
    
    return { data: result.data, error: result.error };
  } catch (error) {
    console.error('Error saving bracket:', error);
    return { error };
  }
}

// Get a user's bracket
export async function getUserBracket(userId, year = null) {
  try {
    const currentYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('brackets')
      .select('*')
      .eq('user_id', userId)
      .eq('year', currentYear)
      .single();
    
    if (error) {
      console.error('Error fetching user bracket:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user bracket:', error);
    return { data: null, error };
  }
}

// Get all brackets for a specific year
export async function getAllBrackets(year = null) {
  try {
    const currentYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('brackets')
      .select(`
        *,
        users:user_id (
          id,
          firstname,
          lastname,
          email
        )
      `)
      .eq('year', currentYear);
    
    if (error) {
      console.error('Error fetching all brackets:', error);
      return { data: [], error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all brackets:', error);
    return { data: [], error };
  }
}

// Check if a bracket is valid (all selections filled)
export function isBracketValid(selections) {
  // Check if all 63 games have a selection
  return selections.length === 63 && !selections.some(selection => !selection);
}

// Check if bracket submission is still open
export function isBracketSubmissionOpen() {
  // In a real implementation, this would check against a configured deadline
  // For now, we'll just return true
  return true;
} 