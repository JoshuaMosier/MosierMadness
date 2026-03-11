import { supabase } from '$lib/supabase';
import type { TeamColorSet, ScoreboardTeam } from '$lib/types';

const TEAM_COLOR_ALIAS_BY_SEO: Record<string, string> = {
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

interface ColorEntry {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string | null;
}

const colorCache: { map: Map<string, ColorEntry> | null; expiresAt: number } = {
  map: null,
  expiresAt: 0,
};

const COLOR_CACHE_TTL_MS = 300_000;

export async function loadTeamColors(): Promise<void> {
  const now = Date.now();
  if (colorCache.map && colorCache.expiresAt > now) {
    return;
  }

  const map = new Map<string, ColorEntry>();

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Failed to load team colors from database:', message);
    if (colorCache.map) {
      return;
    }
  }

  colorCache.map = map;
  colorCache.expiresAt = now + COLOR_CACHE_TTL_MS;
}

export function getTeamColorSet(seoName: string = ''): TeamColorSet {
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

export function getAllTeamColors(): Map<string, ColorEntry> {
  return colorCache.map || new Map();
}

interface NormalizedTeamInput {
  name: string;
  ncaaName: string;
  char6: string;
  seoName: string;
  score: number | null;
  scoreText: string;
  seed: number | null;
  winner: boolean;
  description: string;
}

/**
 * Build a normalized team display object from pre-extracted fields.
 * Shared by both the scoreboard and daily-scores normalizers.
 */
export function buildNormalizedTeam({ name, ncaaName, char6, seoName, score, scoreText, seed, winner, description }: NormalizedTeamInput): ScoreboardTeam {
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
