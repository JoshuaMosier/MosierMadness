import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import type { Entry, Profile } from '$lib/types';

function hasCompleteSelections(selections: unknown): boolean {
  return Array.isArray(selections)
    && selections.length === 63
    && selections.every(selection => typeof selection === 'string' && selection.trim().length > 0);
}

export async function autoSubmitCompleteDraftBrackets(year: number): Promise<number> {
  const { data: draftBrackets, error: draftError } = await supabaseAdmin
    .from('brackets')
    .select('id, selections')
    .eq('year', year)
    .eq('is_submitted', false);

  if (draftError) {
    throw draftError;
  }

  const completedBracketIds = (draftBrackets || [])
    .filter((bracket: { id: string; selections: unknown }) => hasCompleteSelections(bracket.selections))
    .map((bracket: { id: string }) => bracket.id);

  if (completedBracketIds.length === 0) {
    return 0;
  }

  const { error: updateError } = await supabaseAdmin
    .from('brackets')
    .update({
      is_submitted: true,
      updated_at: new Date().toISOString(),
    })
    .in('id', completedBracketIds);

  if (updateError) {
    throw updateError;
  }

  return completedBracketIds.length;
}

async function maybeAutoSubmitLiveTournamentBrackets(year?: number): Promise<void> {
  const settings = await getTournamentSettings();
  if (settings.stage !== 'tournament-live') {
    return;
  }

  if (year && year !== settings.entrySeasonYear) {
    return;
  }

  try {
    await autoSubmitCompleteDraftBrackets(settings.entrySeasonYear);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to auto-submit complete draft brackets: ${message}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSubmittedBracket(bracket: Record<string, any>): Entry {
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

export async function getSubmittedEntries(year?: number): Promise<Entry[]> {
  await maybeAutoSubmitLiveTournamentBrackets(year);

  let query = supabaseAdmin
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEntriesWithProfiles(year?: number): Promise<any[]> {
  await maybeAutoSubmitLiveTournamentBrackets(year);

  const { data, error } = await supabaseAdmin
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((profile: any) => ({
    ...profile,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    brackets: (profile.brackets || []).filter((bracket: any) => bracket.year === year),
  }));
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, email, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
