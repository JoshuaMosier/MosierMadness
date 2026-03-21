import { supabase } from '$lib/supabase';
import generatedHistory from './generated-history.json';
import type {
  HistoricalPerson,
  PersonAlias,
  HistoricalSeason,
  SeasonResult,
  HistoryState,
} from '$lib/types';

const HISTORY_CACHE_TTL_MS = 30_000;

const historyCache: { value: HistoryState | null; expiresAt: number } = {
  value: null,
  expiresAt: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePeople(rows: any[] = []): HistoricalPerson[] {
  return rows.map(row => ({
    id: row.id,
    slug: row.slug,
    displayName: row.display_name ?? row.displayName ?? '',
    canonicalFirstName: row.canonical_first_name ?? row.canonicalFirstName ?? '',
    canonicalLastName: row.canonical_last_name ?? row.canonicalLastName ?? '',
    linkedProfileId: row.linked_profile_id ?? row.linkedProfileId ?? null,
    bio: row.bio ?? null,
    isFamily: row.is_family ?? row.isFamily ?? false,
    isActiveRecently: row.is_active_recently ?? row.isActiveRecently ?? false,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAliases(rows: any[] = []): PersonAlias[] {
  return rows.map(row => ({
    id: row.id,
    personId: row.person_id ?? row.personId,
    aliasName: row.alias_name ?? row.aliasName ?? '',
    normalizedAlias: row.normalized_alias ?? row.normalizedAlias ?? '',
    source: row.source ?? 'manual',
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSeasons(rows: any[] = []): HistoricalSeason[] {
  return rows.map(row => ({
    year: Number(row.year),
    status: row.status,
    label: row.label ?? '',
    notes: row.notes ?? null,
    winnerPersonId: row.winner_person_id ?? row.winnerPersonId ?? null,
    winningScore: row.winning_score ?? row.winningScore ?? null,
    fieldSize: row.field_size ?? row.fieldSize ?? null,
    source: row.source ?? 'manual',
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeResults(rows: any[] = []): SeasonResult[] {
  return rows.map(row => ({
    id: row.id,
    year: Number(row.year),
    personId: row.person_id ?? row.personId,
    finalRank: Number(row.final_rank ?? row.finalRank),
    totalPoints: row.total_points ?? row.totalPoints ?? null,
    correctGames: row.correct_games ?? row.correctGames ?? null,
    round1Points: row.round1_points ?? row.round1Points ?? null,
    round2Points: row.round2_points ?? row.round2Points ?? null,
    round3Points: row.round3_points ?? row.round3Points ?? null,
    round4Points: row.round4_points ?? row.round4Points ?? null,
    round5Points: row.round5_points ?? row.round5Points ?? null,
    round6Points: row.round6_points ?? row.round6Points ?? null,
    sourceDisplayName: row.source_display_name ?? row.sourceDisplayName ?? '',
    sourceStandardName: row.source_standard_name ?? row.sourceStandardName ?? '',
  }));
}

function mapById<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map(row => [row.id, row]));
}

function groupBy<T, K>(rows: T[], getKey: (row: T) => K): Map<K, T[]> {
  return rows.reduce((map, row) => {
    const key = getKey(row);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(row);
    return map;
  }, new Map<K, T[]>());
}

function sortSeasonsDescending(rows: HistoricalSeason[]): HistoricalSeason[] {
  return [...rows].sort((a, b) => b.year - a.year);
}

interface RawHistoryData {
  people: unknown[];
  personAliases: unknown[];
  historicalSeasons: unknown[];
  seasonResults: unknown[];
}

function buildHistoryState(rawData: RawHistoryData): HistoryState {
  const people = normalizePeople(rawData.people);
  const aliases = normalizeAliases(rawData.personAliases);
  const seasons = normalizeSeasons(rawData.historicalSeasons);
  const results = normalizeResults(rawData.seasonResults);
  const peopleById = mapById(people);
  const peopleBySlug = new Map(people.map(person => [person.slug, person]));
  const aliasesByPersonId = groupBy(aliases, alias => alias.personId);
  const resultsByPersonId = groupBy(results, result => result.personId);
  const resultsByYear = groupBy(results, result => result.year);

  // Merge duplicate people that share the same linked_profile_id.
  const profileIdToPeople = new Map<string, HistoricalPerson[]>();
  for (const person of people) {
    if (!person.linkedProfileId) continue;
    if (!profileIdToPeople.has(person.linkedProfileId)) {
      profileIdToPeople.set(person.linkedProfileId, []);
    }
    profileIdToPeople.get(person.linkedProfileId)!.push(person);
  }

  // Also detect duplicates where the original person has no linkedProfileId
  // but a newer archive-created person does.
  const byLastName = groupBy(people, p => (p.canonicalLastName || '').toLowerCase());
  for (const [lastName, group] of byLastName) {
    if (!lastName || group.length < 2) continue;
    const linked = group.filter(p => p.linkedProfileId);
    const unlinked = group.filter(p => !p.linkedProfileId);
    for (const lp of linked) {
      for (const up of unlinked) {
        const lFirst = (lp.canonicalFirstName || '').toLowerCase();
        const uFirst = (up.canonicalFirstName || '').toLowerCase();
        if (!lFirst || !uFirst) continue;
        if (lFirst.startsWith(uFirst) || uFirst.startsWith(lFirst)) {
          if (!profileIdToPeople.has(lp.linkedProfileId!)) {
            profileIdToPeople.set(lp.linkedProfileId!, [lp]);
          }
          const arr = profileIdToPeople.get(lp.linkedProfileId!)!;
          if (!arr.includes(up)) {
            arr.push(up);
          }
        }
      }
    }
  }

  const mergedAwayIds = new Set<string>();
  for (const [, dupes] of profileIdToPeople) {
    if (dupes.length <= 1) continue;

    // Primary = the one with the most results (the original spreadsheet record)
    dupes.sort((a, b) => {
      const aCount = (resultsByPersonId.get(a.id) || []).length;
      const bCount = (resultsByPersonId.get(b.id) || []).length;
      return bCount - aCount;
    });

    const primary = dupes[0];
    for (let i = 1; i < dupes.length; i++) {
      const duplicate = dupes[i];
      // Move duplicate's results to primary
      const dupResults = resultsByPersonId.get(duplicate.id) || [];
      for (const result of dupResults) {
        result.personId = primary.id;
      }
      const primaryResults = resultsByPersonId.get(primary.id) || [];
      resultsByPersonId.set(primary.id, [...primaryResults, ...dupResults]);
      resultsByPersonId.delete(duplicate.id);

      // Move duplicate's aliases to primary
      const dupAliases = aliasesByPersonId.get(duplicate.id) || [];
      if (dupAliases.length) {
        const primaryAliases = aliasesByPersonId.get(primary.id) || [];
        aliasesByPersonId.set(primary.id, [...primaryAliases, ...dupAliases]);
        aliasesByPersonId.delete(duplicate.id);
      }

      // Update season winner references
      for (const season of seasons) {
        if (season.winnerPersonId === duplicate.id) {
          season.winnerPersonId = primary.id;
        }
      }

      mergedAwayIds.add(duplicate.id);
    }
  }

  // Remove merged-away people from lookups
  const filteredPeople = mergedAwayIds.size > 0
    ? people.filter(p => !mergedAwayIds.has(p.id))
    : people;
  const filteredPeopleById = mergedAwayIds.size > 0
    ? mapById(filteredPeople)
    : peopleById;
  const filteredPeopleBySlug = mergedAwayIds.size > 0
    ? new Map(filteredPeople.map(p => [p.slug, p]))
    : peopleBySlug;

  // Rebuild resultsByYear since personIds may have changed
  const finalResultsByYear = mergedAwayIds.size > 0
    ? groupBy(results, result => result.year)
    : resultsByYear;

  return {
    people: filteredPeople,
    aliases,
    seasons: sortSeasonsDescending(seasons),
    results,
    peopleById: filteredPeopleById,
    peopleBySlug: filteredPeopleBySlug,
    aliasesByPersonId,
    resultsByPersonId,
    resultsByYear: finalResultsByYear,
  };
}

function getFallbackHistoryState(): HistoryState {
  return buildHistoryState(generatedHistory as unknown as RawHistoryData);
}

async function fetchHistoricalRows(): Promise<RawHistoryData | null> {
  const [peopleResponse, aliasResponse, seasonResponse, resultsResponse] = await Promise.all([
    supabase
      .from('people')
      .select('id, slug, display_name, canonical_first_name, canonical_last_name, linked_profile_id, bio, is_family, is_active_recently')
      .order('display_name', { ascending: true }),
    supabase
      .from('person_aliases')
      .select('id, person_id, alias_name, normalized_alias, source')
      .order('alias_name', { ascending: true }),
    supabase
      .from('historical_seasons')
      .select('year, status, label, notes, winner_person_id, winning_score, field_size, source')
      .order('year', { ascending: false }),
    supabase
      .from('season_results')
      .select('id, year, person_id, final_rank, total_points, correct_games, round1_points, round2_points, round3_points, round4_points, round5_points, round6_points, source_display_name, source_standard_name')
      .order('year', { ascending: false })
      .order('final_rank', { ascending: true }),
  ]);

  const firstError = [peopleResponse, aliasResponse, seasonResponse, resultsResponse]
    .map(response => response.error)
    .find(Boolean);

  if (firstError) {
    throw firstError;
  }

  if (!peopleResponse.data?.length || !seasonResponse.data?.length) {
    return null;
  }

  return {
    people: peopleResponse.data,
    personAliases: aliasResponse.data || [],
    historicalSeasons: seasonResponse.data,
    seasonResults: resultsResponse.data || [],
  };
}

export function clearHistoryCache(): void {
  historyCache.value = null;
  historyCache.expiresAt = 0;
}

export async function getHistoricalData(): Promise<HistoryState> {
  const now = Date.now();
  if (historyCache.value && historyCache.expiresAt > now) {
    return historyCache.value;
  }

  try {
    const rows = await fetchHistoricalRows();
    if (rows) {
      historyCache.value = buildHistoryState(rows);
    } else {
      historyCache.value = getFallbackHistoryState();
      console.warn('[history] Database returned empty data, using generated fallback');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[history] Falling back to generated data:', message);
    historyCache.value = getFallbackHistoryState();
  }

  historyCache.expiresAt = now + HISTORY_CACHE_TTL_MS;
  return historyCache.value;
}

function formatStatNumber(value: number | null | undefined, digits: number = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }

  const fixed = Number(value).toFixed(digits);
  return fixed
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
}

function buildTitleCounts(seasons: HistoricalSeason[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const season of seasons) {
    if (season.status !== 'completed' || !season.winnerPersonId) {
      continue;
    }

    counts.set(season.winnerPersonId, (counts.get(season.winnerPersonId) || 0) + 1);
  }

  return counts;
}

interface PersonAggregate {
  person: HistoricalPerson;
  results: SeasonResult[];
  appearances: number;
  titles: number;
  averageFinish: number | null;
  bestFinish: number | null;
  bestScore: number | null;
  bestGames: number | null;
}

function buildPersonAggregates(data: HistoryState): PersonAggregate[] {
  const titleCounts = buildTitleCounts(data.seasons);

  return data.people.map(person => {
    const results = [...(data.resultsByPersonId.get(person.id) || [])].sort((a, b) => a.year - b.year);
    const completedRanks = results
      .map(result => result.finalRank)
      .filter(rank => Number.isFinite(rank));
    const averageFinish = completedRanks.length
      ? completedRanks.reduce((sum, rank) => sum + rank, 0) / completedRanks.length
      : null;
    const bestFinish = completedRanks.length ? Math.min(...completedRanks) : null;
    const bestScore = results.length
      ? Math.max(...results.map(result => result.totalPoints || 0))
      : null;
    const bestGames = results.length
      ? Math.max(...results.map(result => result.correctGames || 0))
      : null;

    return {
      person,
      results,
      appearances: results.length,
      titles: titleCounts.get(person.id) || 0,
      averageFinish,
      bestFinish,
      bestScore,
      bestGames,
    };
  });
}

interface SeasonRecord {
  stat: string;
  numericValue: number;
  participant: string;
  slug: string;
  year: number;
  finalRank: number;
}

function buildSeasonRecord(result: SeasonResult, person: HistoricalPerson, statLabel: string, value: number): SeasonRecord {
  return {
    stat: statLabel,
    numericValue: value,
    participant: person.displayName,
    slug: person.slug,
    year: result.year,
    finalRank: result.finalRank,
  };
}

interface TopSeasonCategoryInput {
  title: string;
  results: SeasonResult[];
  peopleById: Map<string, HistoricalPerson>;
  valueAccessor: (result: SeasonResult) => number | null | undefined;
  statFormatter: (result: SeasonResult, value: number) => string;
  limit?: number;
}

function buildTopSeasonCategory({ title, results, peopleById, valueAccessor, statFormatter, limit = 10 }: TopSeasonCategoryInput) {
  const records = results
    .map(result => {
      const person = peopleById.get(result.personId);
      const value = valueAccessor(result);
      if (!person || value === null || value === undefined) {
        return null;
      }

      return buildSeasonRecord(result, person, statFormatter(result, value), value);
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b!.numericValue !== a!.numericValue) {
        return b!.numericValue - a!.numericValue;
      }
      if (a!.finalRank !== b!.finalRank) {
        return a!.finalRank - b!.finalRank;
      }
      return b!.year - a!.year;
    })
    .slice(0, limit);

  return { category: title, records };
}

interface AggregateRow {
  participant: string;
  slug: string;
  numericValue: number;
  appearances: number;
  titles: number;
}

interface AggregateCategoryInput {
  title: string;
  rows: AggregateRow[];
  statLabel: (row: AggregateRow) => string;
  limit?: number;
}

function buildAggregateCategory({ title, rows, statLabel, limit = 10 }: AggregateCategoryInput) {
  return {
    category: title,
    records: [...rows]
      .sort((a, b) => {
        if (a.numericValue !== b.numericValue) {
          return a.numericValue - b.numericValue;
        }
        if (b.appearances !== a.appearances) {
          return b.appearances - a.appearances;
        }
        return a.participant.localeCompare(b.participant);
      })
      .map(row => ({
        stat: statLabel(row),
        numericValue: row.numericValue,
        participant: row.participant,
        slug: row.slug,
        yearsPlayed: row.appearances,
        isChampion: row.titles > 0,
      }))
      .slice(0, limit),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStatsPageData(): Promise<any> {
  const data = await getHistoricalData();
  const aggregates = buildPersonAggregates(data);
  const titleCounts = buildTitleCounts(data.seasons);
  const completedSeasons = data.seasons.filter(season => season.status === 'completed' && season.winnerPersonId);

  const categories = [
    buildTopSeasonCategory({
      title: 'Most Overall Games',
      results: data.results,
      peopleById: data.peopleById,
      valueAccessor: result => result.correctGames,
      statFormatter: (_result, value) => `${value} of 63`,
    }),
    buildTopSeasonCategory({
      title: 'Most Games Round of 64',
      results: data.results,
      peopleById: data.peopleById,
      valueAccessor: result => result.round1Points,
      statFormatter: (_result, value) => `${value} of 32`,
    }),
    buildTopSeasonCategory({
      title: 'Most Games Round of 32',
      results: data.results,
      peopleById: data.peopleById,
      valueAccessor: result => (result.round2Points === null ? null : result.round2Points / 2),
      statFormatter: (_result, value) => `${value} of 16`,
    }),
    buildTopSeasonCategory({
      title: 'Most Games Sweet Sixteen',
      results: data.results,
      peopleById: data.peopleById,
      valueAccessor: result => (result.round3Points === null ? null : result.round3Points / 4),
      statFormatter: (_result, value) => `${value} of 8`,
    }),
    buildTopSeasonCategory({
      title: 'Most Games Elite Eight',
      results: data.results,
      peopleById: data.peopleById,
      valueAccessor: result => (result.round4Points === null ? null : result.round4Points / 8),
      statFormatter: (_result, value) => `${value} of 4`,
    }),
    buildTopSeasonCategory({
      title: 'Most Games Final Four',
      results: data.results,
      peopleById: data.peopleById,
      valueAccessor: result => (result.round5Points === null ? null : result.round5Points / 16),
      statFormatter: (_result, value) => `${value} of 2`,
    }),
    buildTopSeasonCategory({
      title: 'Most Games Championship',
      results: data.results,
      peopleById: data.peopleById,
      valueAccessor: result => (result.round6Points === null ? null : result.round6Points / 32),
      statFormatter: (_result, value) => `${value} of 1`,
    }),
    buildTopSeasonCategory({
      title: 'Highest Score',
      results: data.results,
      peopleById: data.peopleById,
      valueAccessor: result => result.totalPoints,
      statFormatter: (_result, value) => String(value),
    }),
    {
      category: 'Most Tournament Wins',
      records: [...titleCounts.entries()]
        .map(([personId, titles]) => {
          const person = data.peopleById.get(personId);
          return person
            ? {
                stat: String(titles),
                numericValue: titles,
                participant: person.displayName,
                slug: person.slug,
              }
            : null;
        })
        .filter(Boolean)
        .sort((a, b) => b!.numericValue - a!.numericValue || a!.participant.localeCompare(b!.participant))
        .slice(0, 10),
    },
    buildAggregateCategory({
      title: 'Best Average Finish (3+ Years)',
      rows: aggregates
        .filter(aggregate => aggregate.appearances >= 3 && aggregate.averageFinish !== null)
        .map(aggregate => ({
          participant: aggregate.person.displayName,
          slug: aggregate.person.slug,
          numericValue: aggregate.averageFinish!,
          appearances: aggregate.appearances,
          titles: aggregate.titles,
        })),
      statLabel: row => formatStatNumber(row.numericValue),
    }),
  ];

  const mostGamesCorrect = categories[0]?.records[0] || null;
  const highestScore = categories[7]?.records[0] || null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topWinCount = (categories[8]?.records[0] as any)?.numericValue || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topWinners = categories[8]?.records?.filter((record: any) => record.numericValue === topWinCount) || [];

  return {
    categories,
    summary: {
      mostGamesCorrect,
      highestScore,
      mostTournamentWins: {
        value: topWinCount,
        leaders: topWinners,
      },
      completedTournamentCount: completedSeasons.length,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPastWinnersPageData(): Promise<any> {
  const data = await getHistoricalData();
  const completedSeasons = data.seasons.filter(season => season.status === 'completed' && season.winnerPersonId);
  const latestCompletedYear = Math.max(...completedSeasons.map(season => season.year));
  const titleCounts = buildTitleCounts(data.seasons);

  const winners = data.seasons.map(season => {
    const winner = season.winnerPersonId ? data.peopleById.get(season.winnerPersonId) : null;

    return {
      year: season.year,
      status: season.status,
      notes: season.notes,
      name: winner?.displayName || null,
      slug: winner?.slug || null,
      winningScore: season.winningScore,
      fieldSize: season.fieldSize,
      isChampionYear: season.status === 'completed',
      highlight: season.year === latestCompletedYear && season.status === 'completed',
      special: season.status !== 'completed',
    };
  });

  const leaderboard: Array<{ name: string; slug: string; count: number; rank?: number }> = [...titleCounts.entries()]
    .map(([personId, count]) => {
      const person = data.peopleById.get(personId);
      return person
        ? {
            name: person.displayName,
            slug: person.slug,
            count,
          }
        : null;
    })
    .filter(Boolean) as Array<{ name: string; slug: string; count: number }>;

  leaderboard.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  let currentRank = 1;
  let previousCount = leaderboard[0]?.count ?? 0;
  leaderboard.forEach((entry, index) => {
    if (index > 0 && entry.count < previousCount) {
      currentRank = index + 1;
    }
    entry.rank = currentRank;
    previousCount = entry.count;
  });

  const maxWins = leaderboard[0]?.count || 0;
  const topWinners = leaderboard.filter(entry => entry.count === maxWins);

  // Build season standings keyed by year
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasonStandings: Record<number, any[]> = {};
  for (const season of data.seasons) {
    const yearResults = data.resultsByYear.get(season.year);
    if (!yearResults || yearResults.length === 0) {
      continue;
    }

    const rows = [...yearResults].map(result => {
        const person = data.peopleById.get(result.personId);
        return {
          personId: result.personId,
          rank: result.finalRank,
          name: person?.displayName || result.sourceDisplayName || 'Unknown',
          slug: person?.slug || null,
          totalPoints: result.totalPoints,
          correctGames: result.correctGames,
        };
      });

    if (season.status === 'completed' && season.winnerPersonId) {
      const winner = data.peopleById.get(season.winnerPersonId);
      const existingWinnerRow = rows.find(row => row.personId === season.winnerPersonId || row.rank === 1);

      if (existingWinnerRow) {
        existingWinnerRow.rank = 1;
        existingWinnerRow.totalPoints ??= season.winningScore;
      } else if (winner) {
        rows.push({
          personId: season.winnerPersonId,
          rank: 1,
          name: winner.displayName,
          slug: winner.slug,
          totalPoints: season.winningScore,
          correctGames: null,
        });
      }
    }

    seasonStandings[season.year] = rows
      .sort((a, b) => a.rank - b.rank)
      .map(({ personId, ...row }) => row);
  }

  // Build player directory with aggregates
  const aggregates = buildPersonAggregates(data);
  const playerDirectory = aggregates
    .filter(agg => agg.appearances > 0)
    .map(agg => {
      const percentiles = agg.results
        .map(result => {
          const yearEntries = data.resultsByYear.get(result.year);
          const fieldSize = yearEntries ? yearEntries.length : 0;
          if (result.finalRank && fieldSize > 1) {
            return ((fieldSize - result.finalRank) / (fieldSize - 1)) * 100;
          }
          return null;
        })
        .filter((pct): pct is number => pct !== null);

      const averagePercentile = percentiles.length
        ? Math.round(percentiles.reduce((sum, pct) => sum + pct, 0) / percentiles.length)
        : null;

      return {
        name: agg.person.displayName,
        slug: agg.person.slug,
        appearances: agg.appearances,
        firstYear: agg.results[0]?.year ?? null,
        mostRecentYear: agg.results[agg.results.length - 1]?.year ?? null,
        titles: agg.titles,
        averagePercentile,
        bestFinish: agg.bestFinish,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    winners,
    leaderboard,
    seasonStandings,
    playerDirectory,
    summary: {
      totalSeasons: data.seasons.length,
      completedTournaments: completedSeasons.length,
      uniqueChampions: leaderboard.length,
      maxWins,
      topWinners,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getProfileContextForPerson(person: HistoricalPerson): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profiles: any[];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email');

    if (error) {
      throw error;
    }

    profiles = data || [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Unable to load profile context for historical player:', message);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exactMatches = profiles.filter((profile: any) =>
    (profile.first_name || '').toLowerCase() === (person.canonicalFirstName || '').toLowerCase()
    && (profile.last_name || '').toLowerCase() === (person.canonicalLastName || '').toLowerCase(),
  );

  const linkedProfile = person.linkedProfileId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? profiles.find((profile: any) => profile.id === person.linkedProfileId) || null
    : exactMatches.length === 1
      ? exactMatches[0]
      : null;

  if (!linkedProfile) {
    return exactMatches.length > 1
      ? {
          matchType: 'ambiguous',
          exactMatchCount: exactMatches.length,
        }
      : null;
  }

  try {
    const { data: brackets, error } = await supabase
      .from('brackets')
      .select('id, year, is_submitted, updated_at')
      .eq('user_id', linkedProfile.id)
      .order('year', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      matchType: person.linkedProfileId ? 'linked' : 'name-match',
      profile: linkedProfile,
      submittedYears: (brackets || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((bracket: any) => bracket.is_submitted)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((bracket: any) => bracket.year),
      totalSavedBrackets: (brackets || []).length,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Unable to load linked bracket context:', message);
    return {
      matchType: person.linkedProfileId ? 'linked' : 'name-match',
      profile: linkedProfile,
      submittedYears: [],
      totalSavedBrackets: 0,
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPlayerProfileData(slug: string): Promise<any> {
  const data = await getHistoricalData();
  const person = data.peopleBySlug.get(slug);

  if (!person) {
    return null;
  }

  const aliases = (data.aliasesByPersonId.get(person.id) || [])
    .map(alias => alias.aliasName)
    .filter(alias => alias && alias !== person.displayName)
    .sort((a, b) => a.localeCompare(b));

  const results = [...(data.resultsByPersonId.get(person.id) || [])].sort((a, b) => b.year - a.year);
  const titleYears = data.seasons
    .filter(season => season.winnerPersonId === person.id && season.status === 'completed')
    .map(season => season.year)
    .sort((a, b) => b - a);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yearlyRows = new Map<number, any>(
    results.map(result => [
      result.year,
      {
        year: result.year,
        status: 'completed',
        finalRank: result.finalRank,
        totalPoints: result.totalPoints,
        correctGames: result.correctGames,
        round1Points: result.round1Points,
        round2Points: result.round2Points,
        round3Points: result.round3Points,
        round4Points: result.round4Points,
        round5Points: result.round5Points,
        round6Points: result.round6Points,
        champion: false,
        notes: null,
        fieldSize: null as number | null,
        percentile: null as number | null,
      },
    ]),
  );

  for (const season of data.seasons) {
    if (season.winnerPersonId !== person.id) {
      continue;
    }

    if (!yearlyRows.has(season.year)) {
      yearlyRows.set(season.year, {
        year: season.year,
        status: season.status,
        finalRank: season.status === 'completed' ? 1 : null,
        totalPoints: season.winningScore,
        correctGames: null,
        round1Points: null,
        round2Points: null,
        round3Points: null,
        round4Points: null,
        round5Points: null,
        round6Points: null,
        champion: season.status === 'completed',
        notes: season.notes,
        fieldSize: null,
        percentile: null,
      });
    } else {
      yearlyRows.get(season.year).champion = true;
    }
  }

  // Enrich yearly rows with field size and percentile
  for (const row of yearlyRows.values()) {
    const yearEntries = data.resultsByYear.get(row.year);
    row.fieldSize = yearEntries ? yearEntries.length : null;
    if (row.finalRank && row.fieldSize && row.fieldSize > 1) {
      row.percentile = ((row.fieldSize - row.finalRank) / (row.fieldSize - 1)) * 100;
    } else {
      row.percentile = null;
    }
  }

  const yearlyResults = [...yearlyRows.values()].sort((a, b) => b.year - a.year);
  const appearances = results.length;
  const averageFinish = appearances
    ? results.reduce((sum, result) => sum + result.finalRank, 0) / appearances
    : null;
  const bestFinish = appearances ? Math.min(...results.map(result => result.finalRank)) : null;
  const bestScore = appearances ? Math.max(...results.map(result => result.totalPoints || 0)) : null;
  const bestGames = appearances ? Math.max(...results.map(result => result.correctGames || 0)) : null;

  const validScores = results
    .map(result => result.totalPoints)
    .filter((points): points is number => points !== null && points !== undefined && Number.isFinite(points));
  const averageScore = validScores.length
    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    : null;

  const percentiles = yearlyResults
    .map((row: { percentile: number | null }) => row.percentile)
    .filter((pct): pct is number => pct !== null);
  const averagePercentile = percentiles.length
    ? percentiles.reduce((sum: number, pct: number) => sum + pct, 0) / percentiles.length
    : null;

  const profileContext = await getProfileContextForPerson(person);

  return {
    person,
    aliases,
    titleYears,
    yearlyResults,
    summary: {
      appearances,
      titles: titleYears.length,
      averageFinish: averageFinish === null ? null : formatStatNumber(averageFinish),
      bestFinish,
      bestScore,
      bestGames,
      averageScore: averageScore === null ? null : formatStatNumber(averageScore, 1),
      averagePercentile: averagePercentile === null ? null : formatStatNumber(averagePercentile, 0),
    },
    currentAccount: profileContext,
  };
}
