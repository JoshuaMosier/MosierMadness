import type { PageServerLoad } from './$types';
import { getEntriesWithProfiles } from '$lib/server/tournament/entries';
import { buildEntrantBracketData } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTournamentSettings } from '$lib/server/tournament/settings';

function isSubmittedEntry(entry: any): boolean {
  return Boolean(entry?.brackets?.[0]?.is_submitted);
}

function findEntryBySelection(entries: any[], selectedValue: string | null): any | null {
  if (!selectedValue) {
    return null;
  }

  const [firstName, lastName] = selectedValue.split('|');
  if (!firstName || !lastName) {
    return null;
  }

  return (
    entries.find(
      (entry: any) =>
        entry.first_name?.toLowerCase() === firstName.toLowerCase() &&
        entry.last_name?.toLowerCase() === lastName.toLowerCase(),
    ) || null
  );
}

function findDefaultEntry(entries: any[], userEmail: string | null): any | null {
  const submittedEntries = entries
    .filter(isSubmittedEntry)
    .sort((a, b) => a.first_name.localeCompare(b.first_name));

  if (submittedEntries.length === 0) {
    return null;
  }

  if (userEmail) {
    const currentUserEntry = submittedEntries.find(
      (entry: any) => entry.email?.toLowerCase() === userEmail.toLowerCase(),
    );
    if (currentUserEntry) {
      return currentUserEntry;
    }
  }

  return submittedEntries[0];
}

export const load: PageServerLoad = async ({ url, depends, locals }) => {
  depends('app:tournament');
  const settings = await getTournamentSettings();
  const [entries, snapshot, { data: { user } }] = await Promise.all([
    getEntriesWithProfiles(settings.displaySeasonYear),
    getTournamentSnapshot(settings),
    locals.supabase.auth.getUser(),
  ]);

  const selectedEntry =
    findEntryBySelection(entries, url.searchParams.get('selected')) ||
    findDefaultEntry(entries, user?.email ?? null);

  return {
    entries,
    selectedEntrantId: selectedEntry?.id || '',
    selectedBracketData: buildEntrantBracketData(selectedEntry?.brackets?.[0], snapshot),
    tournamentSettings: settings,
  };
};
