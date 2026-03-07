import { getEntriesWithProfiles } from '$lib/server/tournament/entries';
import { buildEntrantBracketData } from '$lib/server/tournament/projections';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getTournamentSettings } from '$lib/server/tournament/settings';

function findEntryBySelection(entries, selectedValue) {
  if (!selectedValue) {
    return null;
  }

  const [firstName, lastName] = selectedValue.split('|');
  if (!firstName || !lastName) {
    return null;
  }

  return (
    entries.find(
      entry =>
        entry.first_name?.toLowerCase() === firstName.toLowerCase() &&
        entry.last_name?.toLowerCase() === lastName.toLowerCase(),
    ) || null
  );
}

export async function load({ url, depends }) {
  depends('app:tournament');
  const settings = await getTournamentSettings();
  const [entries, snapshot] = await Promise.all([
    getEntriesWithProfiles(settings.displaySeasonYear),
    getTournamentSnapshot(settings),
  ]);

  const selectedEntry = findEntryBySelection(entries, url.searchParams.get('selected'));

  return {
    entries,
    selectedEntrantId: selectedEntry?.id || '',
    selectedBracketData: buildEntrantBracketData(selectedEntry?.brackets?.[0], snapshot),
    tournamentSettings: settings,
  };
}
