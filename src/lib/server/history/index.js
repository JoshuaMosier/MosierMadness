import { supabase } from '$lib/supabase';
import generatedHistory from './generated-history.json';

const HISTORY_CACHE_TTL_MS = 30_000;

const historyCache = {
  value: null,
  expiresAt: 0,
};

function normalizePeople(rows = []) {
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

function normalizeAliases(rows = []) {
  return rows.map(row => ({
    id: row.id,
    personId: row.person_id ?? row.personId,
    aliasName: row.alias_name ?? row.aliasName ?? '',
    normalizedAlias: row.normalized_alias ?? row.normalizedAlias ?? '',
    source: row.source ?? 'manual',
  }));
}

function normalizeSeasons(rows = []) {
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

function normalizeResults(rows = []) {
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

function mapById(rows) {
  return new Map(rows.map(row => [row.id, row]));
}

function groupBy(rows, getKey) {
  return rows.reduce((map, row) => {
    const key = getKey(row);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(row);
    return map;
  }, new Map());
}

function sortSeasonsDescending(rows) {
  return [...rows].sort((a, b) => b.year - a.year);
}

function buildHistoryState(rawData) {
  const people = normalizePeople(rawData.people);
  const aliases = normalizeAliases(rawData.personAliases);
  const seasons = normalizeSeasons(rawData.historicalSeasons);
  const results = normalizeResults(rawData.seasonResults);
  const peopleById = mapById(people);
  const peopleBySlug = new Map(people.map(person => [person.slug, person]));
  const aliasesByPersonId = groupBy(aliases, alias => alias.personId);
  const resultsByPersonId = groupBy(results, result => result.personId);
  const resultsByYear = groupBy(results, result => result.year);

  return {
    people,
    aliases,
    seasons: sortSeasonsDescending(seasons),
    results,
    peopleById,
    peopleBySlug,
    aliasesByPersonId,
    resultsByPersonId,
    resultsByYear,
  };
}

function getFallbackHistoryState() {
  return buildHistoryState(generatedHistory);
}

async function fetchHistoricalRows() {
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

export function clearHistoryCache() {
  historyCache.value = null;
  historyCache.expiresAt = 0;
}

export async function getHistoricalData() {
  const now = Date.now();
  if (historyCache.value && historyCache.expiresAt > now) {
    return historyCache.value;
  }

  try {
    const rows = await fetchHistoricalRows();
    historyCache.value = rows ? buildHistoryState(rows) : getFallbackHistoryState();
  } catch (error) {
    console.warn('Falling back to generated historical data:', error.message);
    historyCache.value = getFallbackHistoryState();
  }

  historyCache.expiresAt = now + HISTORY_CACHE_TTL_MS;
  return historyCache.value;
}

function formatStatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }

  const fixed = Number(value).toFixed(digits);
  return fixed
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
}

function buildTitleCounts(seasons) {
  const counts = new Map();

  for (const season of seasons) {
    if (season.status !== 'completed' || !season.winnerPersonId) {
      continue;
    }

    counts.set(season.winnerPersonId, (counts.get(season.winnerPersonId) || 0) + 1);
  }

  return counts;
}

function buildPersonAggregates(data) {
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

function buildSeasonRecord(result, person, statLabel, value) {
  return {
    stat: statLabel,
    numericValue: value,
    participant: person.displayName,
    slug: person.slug,
    year: result.year,
    finalRank: result.finalRank,
  };
}

function buildTopSeasonCategory({ title, results, peopleById, valueAccessor, statFormatter, limit = 10 }) {
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
      if (b.numericValue !== a.numericValue) {
        return b.numericValue - a.numericValue;
      }
      if (a.finalRank !== b.finalRank) {
        return a.finalRank - b.finalRank;
      }
      return b.year - a.year;
    })
    .slice(0, limit);

  return { category: title, records };
}

function buildAggregateCategory({ title, rows, statLabel, limit = 10 }) {
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

export async function getStatsPageData() {
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
      statFormatter: (result, value) => `${value} of 63`,
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
        .sort((a, b) => b.numericValue - a.numericValue || a.participant.localeCompare(b.participant))
        .slice(0, 10),
    },
    buildAggregateCategory({
      title: 'Best Average Finish (3+ Years)',
      rows: aggregates
        .filter(aggregate => aggregate.appearances >= 3 && aggregate.averageFinish !== null)
        .map(aggregate => ({
          participant: aggregate.person.displayName,
          slug: aggregate.person.slug,
          numericValue: aggregate.averageFinish,
          appearances: aggregate.appearances,
          titles: aggregate.titles,
        })),
      statLabel: row => formatStatNumber(row.numericValue),
    }),
  ];

  const mostGamesCorrect = categories[0]?.records[0] || null;
  const highestScore = categories[7]?.records[0] || null;
  const topWinCount = categories[8]?.records[0]?.numericValue || 0;
  const topWinners = categories[8]?.records?.filter(record => record.numericValue === topWinCount) || [];

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

export async function getPastWinnersPageData() {
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
      isChampionYear: season.status === 'completed',
      highlight: season.year === latestCompletedYear && season.status === 'completed',
      special: season.status !== 'completed',
    };
  });

  const leaderboard = [...titleCounts.entries()]
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
    .filter(Boolean)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

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

  return {
    winners,
    leaderboard,
    summary: {
      totalSeasons: data.seasons.length,
      completedTournaments: completedSeasons.length,
      uniqueChampions: leaderboard.length,
      maxWins,
      topWinners,
    },
  };
}

async function getProfileContextForPerson(person) {
  let profiles;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email');

    if (error) {
      throw error;
    }

    profiles = data || [];
  } catch (error) {
    console.warn('Unable to load profile context for historical player:', error.message);
    return null;
  }

  const exactMatches = profiles.filter(profile =>
    (profile.first_name || '').toLowerCase() === (person.canonicalFirstName || '').toLowerCase()
    && (profile.last_name || '').toLowerCase() === (person.canonicalLastName || '').toLowerCase(),
  );

  const linkedProfile = person.linkedProfileId
    ? profiles.find(profile => profile.id === person.linkedProfileId) || null
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
        .filter(bracket => bracket.is_submitted)
        .map(bracket => bracket.year),
      totalSavedBrackets: (brackets || []).length,
    };
  } catch (error) {
    console.warn('Unable to load linked bracket context:', error.message);
    return {
      matchType: person.linkedProfileId ? 'linked' : 'name-match',
      profile: linkedProfile,
      submittedYears: [],
      totalSavedBrackets: 0,
    };
  }
}

export async function getPlayerProfileData(slug) {
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

  const yearlyRows = new Map(
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
      });
    } else {
      yearlyRows.get(season.year).champion = true;
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
    },
    currentAccount: profileContext,
  };
}
