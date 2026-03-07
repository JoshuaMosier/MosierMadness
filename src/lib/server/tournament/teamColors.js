import { supabase } from '$lib/supabase';

const TEAM_COLOR_ALIAS_BY_SEO = {
  'app-state': 'appalachian-st',
  'coastal-carolina': 'coastal-caro',
  'csu-bakersfield': 'bakersfield',
  etsu: 'east-tenn-st',
  liu: 'long-island',
  'mount-st-mary-s': 'mt-st-marys',
  'nc-state': 'north-carolina-st',
  omaha: 'neb-omaha',
  'sam-houston': 'sam-houston-st',
  'texas-a-m': 'tex-am',
  'texas-am': 'tex-am',
  'the-citadel': 'citadel',
  uic: 'ill-chicago',
  'ut-arlington': 'texas-arlington',
  'william-and-mary': 'william-mary',
};

const FALLBACK_COLOR = '#666666';

const colorCache = {
  map: null,
  expiresAt: 0,
};

const COLOR_CACHE_TTL_MS = 300_000;

export async function loadTeamColors() {
  const now = Date.now();
  if (colorCache.map && colorCache.expiresAt > now) {
    return;
  }

  const map = new Map();

  try {
    const { data, error } = await supabase
      .from('team_colors')
      .select('seo_name, primary_color, secondary_color, tertiary_color');

    if (error) {
      throw error;
    }

    for (const row of data || []) {
      map.set(row.seo_name, {
        primaryColor: row.primary_color,
        secondaryColor: row.secondary_color,
        tertiaryColor: row.tertiary_color || null,
      });
    }
  } catch (error) {
    console.warn('Failed to load team colors from database:', error.message);
    if (colorCache.map) {
      return;
    }
  }

  colorCache.map = map;
  colorCache.expiresAt = now + COLOR_CACHE_TTL_MS;
}

export function getTeamColorSet(seoName = '') {
  const map = colorCache.map;
  if (!map) {
    return {
      seoName,
      primaryColor: FALLBACK_COLOR,
      secondaryColor: FALLBACK_COLOR,
      tertiaryColor: null,
    };
  }

  const colors = map.get(seoName) || map.get(TEAM_COLOR_ALIAS_BY_SEO[seoName]);

  return {
    seoName,
    primaryColor: colors?.primaryColor || FALLBACK_COLOR,
    secondaryColor: colors?.secondaryColor || (colors?.primaryColor || FALLBACK_COLOR),
    tertiaryColor: colors?.tertiaryColor || null,
  };
}

export function getAllTeamColors() {
  return colorCache.map || new Map();
}

/**
 * Build a normalized team display object from pre-extracted fields.
 * Shared by both the scoreboard and daily-scores normalizers.
 */
export function buildNormalizedTeam({ name, ncaaName, char6, seoName, score, scoreText, seed, winner, description }) {
  const { primaryColor: color, secondaryColor } = getTeamColorSet(seoName);
  return {
    name,
    ncaaName,
    char6,
    displayName: name.length > 14 ? char6 : name,
    score,
    scoreText,
    seed,
    winner,
    description,
    seoName,
    color,
    secondaryColor,
  };
}
