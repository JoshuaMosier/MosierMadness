import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';
import { getSubmittedEntries } from '$lib/server/tournament/entries';
import { calculateScores, sortLeaderboardScores, assignPositions } from '$lib/utils/scoringUtils';
import { clearHistoryCache } from '$lib/server/history/index.js';

function generateSlug(firstName, lastName) {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'unknown';
}

async function findOrCreatePerson(db, firstName, lastName, profileId) {
  const normalizedFirst = (firstName || '').trim();
  const normalizedLast = (lastName || '').trim();

  // Look for existing person by name match (case-insensitive)
  const { data: existing } = await db
    .from('people')
    .select('id, slug, linked_profile_id')
    .ilike('canonical_first_name', normalizedFirst)
    .ilike('canonical_last_name', normalizedLast);

  if (existing && existing.length === 1) {
    const person = existing[0];
    // Link profile if not already linked
    if (!person.linked_profile_id && profileId) {
      await db
        .from('people')
        .update({ linked_profile_id: profileId })
        .eq('id', person.id);
    }
    return person.id;
  }

  // Create new person
  let slug = generateSlug(normalizedFirst, normalizedLast);

  // Check for slug collisions
  const { data: slugCheck } = await db
    .from('people')
    .select('slug')
    .like('slug', `${slug}%`);

  if (slugCheck && slugCheck.length > 0) {
    const existingSlugs = new Set(slugCheck.map(row => row.slug));
    if (existingSlugs.has(slug)) {
      let counter = 2;
      while (existingSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }
  }

  const displayName = `${normalizedFirst} ${normalizedLast}`.trim();
  const { data: newPerson, error } = await db
    .from('people')
    .insert({
      slug,
      display_name: displayName,
      canonical_first_name: normalizedFirst,
      canonical_last_name: normalizedLast,
      linked_profile_id: profileId || null,
      is_active_recently: true,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create person record for ${displayName}: ${error.message}`);
  }

  return newPerson.id;
}

/**
 * Archive a completed tournament season into historical records.
 * @param {object} db - Authenticated Supabase client (must have admin RLS permissions)
 * @param {object} settings - Tournament settings
 */
export async function archiveSeason(db, settings) {
  const displayYear = settings.displaySeasonYear;
  const entryYear = settings.entrySeasonYear;

  // Check if already archived
  const { data: existingSeason } = await db
    .from('historical_seasons')
    .select('year')
    .eq('year', displayYear)
    .maybeSingle();

  if (existingSeason) {
    throw new Error(`Season ${displayYear} has already been archived.`);
  }

  // Get tournament snapshot (master bracket)
  const snapshot = await getTournamentSnapshot(settings);
  const { masterBracket, firstRoundTeams, canonicalByNcaaName } = snapshot;

  // Validate champion exists
  if (!masterBracket[62]) {
    throw new Error('Cannot archive: tournament has no champion (bracket index 62 is empty).');
  }

  // Get all submitted entries
  const entries = await getSubmittedEntries(entryYear);
  if (entries.length === 0) {
    throw new Error('Cannot archive: no submitted entries found.');
  }

  // Calculate scores
  const scores = calculateScores(masterBracket, entries);
  const sortedScores = sortLeaderboardScores(scores);
  const positions = assignPositions(sortedScores, { presorted: true });

  // Build person records for each participant
  const personMap = new Map(); // entryId -> personId
  for (const score of sortedScores) {
    const personId = await findOrCreatePerson(
      db,
      score.firstName,
      score.lastName,
      // Find the original entry to get user_id
      entries.find(e => e.entryId === score.entryId || e.id === score.entryId)?.user_id || null,
    );
    personMap.set(score.entryId, personId);
  }

  // Determine winner
  const winner = sortedScores[0];
  const winnerPersonId = personMap.get(winner.entryId);

  // Insert historical_seasons
  const { error: seasonError } = await db
    .from('historical_seasons')
    .insert({
      year: displayYear,
      status: 'completed',
      label: `${displayYear} NCAA Tournament`,
      winner_person_id: winnerPersonId,
      winning_score: winner.total,
      field_size: sortedScores.length,
      source: 'site-archive',
    });

  if (seasonError) {
    throw new Error(`Failed to insert historical season: ${seasonError.message}`);
  }

  // Insert season_results
  const resultRows = sortedScores.map(score => {
    const rank = positions.get(score.entryId);
    const entry = entries.find(e => e.entryId === score.entryId || e.id === score.entryId);
    return {
      year: displayYear,
      person_id: personMap.get(score.entryId),
      final_rank: rank,
      total_points: score.total,
      correct_games: score.correctGames,
      round1_points: score.round1,
      round2_points: score.round2,
      round3_points: score.round3,
      round4_points: score.round4,
      round5_points: score.round5,
      round6_points: score.round6,
      source_display_name: `${score.firstName} ${score.lastName}`.trim(),
      source_standard_name: `${score.firstName} ${score.lastName}`.trim(),
    };
  });

  const { error: resultsError } = await db
    .from('season_results')
    .insert(resultRows);

  if (resultsError) {
    throw new Error(`Failed to insert season results: ${resultsError.message}`);
  }

  // Insert archived_seasons
  const canonicalTeamMap = {};
  if (canonicalByNcaaName) {
    for (const [ncaaName, canonical] of canonicalByNcaaName.entries()) {
      canonicalTeamMap[ncaaName] = canonical;
    }
  }

  const { error: archivedSeasonError } = await db
    .from('archived_seasons')
    .insert({
      year: displayYear,
      first_round_teams: firstRoundTeams || [],
      master_bracket: masterBracket,
      canonical_team_map: canonicalTeamMap,
      metadata: {
        archivedAt: new Date().toISOString(),
        entrySeasonYear: entryYear,
        archiveScoreboardDate: settings.archiveScoreboardDate,
      },
    });

  if (archivedSeasonError) {
    throw new Error(`Failed to insert archived season: ${archivedSeasonError.message}`);
  }

  // Insert archived_brackets
  const bracketRows = entries.map(entry => ({
    year: displayYear,
    person_id: personMap.get(entry.entryId || entry.id),
    linked_bracket_id: entry.entryId || entry.id,
    selections: entry.selections || [],
    source: 'site-archive',
  }));

  const { error: bracketsError } = await db
    .from('archived_brackets')
    .insert(bracketRows);

  if (bracketsError) {
    throw new Error(`Failed to insert archived brackets: ${bracketsError.message}`);
  }

  // Clear the history cache so pages reflect the new data
  clearHistoryCache();

  return {
    year: displayYear,
    entriesArchived: sortedScores.length,
    winner: `${winner.firstName} ${winner.lastName}`.trim(),
    winningScore: winner.total,
  };
}
