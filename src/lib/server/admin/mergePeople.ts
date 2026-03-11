import { clearHistoryCache } from '$lib/server/history/index';
import type { SupabaseClient } from '@supabase/supabase-js';

interface MergeRecord {
  primary: { id: string; name: string; results: number | null };
  duplicate: { id: string; name: string; results: number | null };
}

interface MergeResult {
  merged: MergeRecord[];
  dryRun: boolean;
}

/**
 * Find and merge duplicate people records in the database.
 * Duplicates are detected by: same last name + first name prefix match,
 * where one record has a linked_profile_id and the other doesn't.
 *
 * The record with the most season_results is kept as primary.
 * The duplicate's results, brackets, and winner references are reassigned,
 * then the duplicate record is deleted.
 */
export async function mergeDuplicatePeople(
  db: SupabaseClient,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<MergeResult> {
  // Load all people
  const { data: people, error: peopleError } = await db
    .from('people')
    .select('id, slug, display_name, canonical_first_name, canonical_last_name, linked_profile_id');

  if (peopleError) {
    throw new Error(`Failed to load people: ${peopleError.message}`);
  }

  // Group by lowercase last name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byLastName = new Map<string, any[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const person of (people as any[])) {
    const key = (person.canonical_last_name || '').toLowerCase();
    if (!key) continue;
    if (!byLastName.has(key)) byLastName.set(key, []);
    byLastName.get(key)!.push(person);
  }

  // Find merge candidates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mergePairs: Array<{ linked: any; unlinked: any }> = [];
  for (const [, group] of byLastName) {
    if (group.length < 2) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linked = group.filter((p: any) => p.linked_profile_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unlinked = group.filter((p: any) => !p.linked_profile_id);

    for (const lp of linked) {
      for (const up of unlinked) {
        const lFirst = (lp.canonical_first_name || '').toLowerCase();
        const uFirst = (up.canonical_first_name || '').toLowerCase();
        if (!lFirst || !uFirst) continue;
        if (lFirst.startsWith(uFirst) || uFirst.startsWith(lFirst)) {
          mergePairs.push({ linked: lp, unlinked: up });
        }
      }
    }
  }

  if (mergePairs.length === 0) {
    return { merged: [], dryRun };
  }

  // For each pair, determine primary (most results) and merge
  const merged: MergeRecord[] = [];
  for (const { linked, unlinked } of mergePairs) {
    const { count: linkedCount } = await db
      .from('season_results')
      .select('*', { count: 'exact', head: true })
      .eq('person_id', linked.id);

    const { count: unlinkedCount } = await db
      .from('season_results')
      .select('*', { count: 'exact', head: true })
      .eq('person_id', unlinked.id);

    // Primary = more results; if tied, prefer the one with linked_profile_id
    const primary = (unlinkedCount || 0) > (linkedCount || 0) ? unlinked : linked;
    const duplicate = primary.id === linked.id ? unlinked : linked;

    const mergeRecord: MergeRecord = {
      primary: { id: primary.id, name: primary.display_name, results: primary.id === linked.id ? linkedCount : unlinkedCount },
      duplicate: { id: duplicate.id, name: duplicate.display_name, results: primary.id === linked.id ? unlinkedCount : linkedCount },
    };

    if (!dryRun) {
      // Reassign season_results
      const { error: resultsErr } = await db
        .from('season_results')
        .update({ person_id: primary.id })
        .eq('person_id', duplicate.id);
      if (resultsErr) throw new Error(`Failed to reassign results: ${resultsErr.message}`);

      // Reassign archived_brackets
      const { error: bracketsErr } = await db
        .from('archived_brackets')
        .update({ person_id: primary.id })
        .eq('person_id', duplicate.id);
      if (bracketsErr) throw new Error(`Failed to reassign brackets: ${bracketsErr.message}`);

      // Update historical_seasons winner references
      const { error: seasonsErr } = await db
        .from('historical_seasons')
        .update({ winner_person_id: primary.id })
        .eq('winner_person_id', duplicate.id);
      if (seasonsErr) throw new Error(`Failed to update winner refs: ${seasonsErr.message}`);

      // Set linked_profile_id on primary if it doesn't have one
      if (!primary.linked_profile_id && duplicate.linked_profile_id) {
        await db
          .from('people')
          .update({ linked_profile_id: duplicate.linked_profile_id })
          .eq('id', primary.id);
      }

      // Delete the duplicate person record
      const { error: deleteErr } = await db
        .from('people')
        .delete()
        .eq('id', duplicate.id);
      if (deleteErr) throw new Error(`Failed to delete duplicate: ${deleteErr.message}`);
    }

    merged.push(mergeRecord);
  }

  if (!dryRun) {
    clearHistoryCache();
  }

  return { merged, dryRun };
}
