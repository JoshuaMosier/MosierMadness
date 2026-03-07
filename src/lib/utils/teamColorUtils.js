import teamColors from '$lib/ncaa_team_colors.json';

const TEAM_COLOR_OVERRIDES_BY_SEO = Object.freeze({
  bellarmine: {
    primary_color: '#752936',
    secondary_color: '#C8C8C8',
    tertiary_color: null,
  },
  'southeast-mo-st': {
    primary_color: '#C8102E',
    secondary_color: '#000000',
    tertiary_color: '#FFFFFF',
  },
  'west-ga': {
    primary_color: '#0656A5',
    secondary_color: '#DA2128',
    tertiary_color: null,
  },
});

const TEAM_NAME_TO_SEO = Object.freeze({
  Bellarmine: 'bellarmine',
  'Central Ark.': 'central-ark',
  'Charleston So.': 'charleston-so',
  'Col. of Charleston': 'col-of-charleston',
  'Eastern Ky.': 'eastern-ky',
  'Fla. Atlantic': 'fla-atlantic',
  'Ga. Southern': 'ga-southern',
  NIU: 'northern-ill',
  'Northern Illinois': 'northern-ill',
  'Northern Iowa': 'uni',
  'Saint Joseph\'s': 'saint-josephs',
  'Saint Louis': 'saint-louis',
  'Saint Mary\'s (CA)': 'st-marys-ca',
  SEMO: 'southeast-mo-st',
  'Southeast Mo. St.': 'southeast-mo-st',
  'Southeast Missouri State': 'southeast-mo-st',
  'South Fla.': 'south-fla',
  UNI: 'uni',
  UAlbany: 'albany-ny',
  'UMass Lowell': 'umass-lowell',
  'West Ga.': 'west-ga',
  'West Georgia': 'west-ga',
  UNCW: 'unc-wilmington',
});

const TEAM_COLOR_NAME_BY_SEO = Object.freeze({
  bellarmine: 'Bellarmine',
  'northern-ill': 'Northern Illinois',
  uni: 'Northern Iowa',
  'southeast-mo-st': 'Southeast Missouri State',
  'west-ga': 'West Georgia',
});

export function getSeoNameFallback(teamName = '') {
  return teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function resolveTeamSeoName(teamName, seoName) {
  if (seoName) {
    return seoName;
  }

  if (teamName && TEAM_NAME_TO_SEO[teamName]) {
    return TEAM_NAME_TO_SEO[teamName];
  }

  return getSeoNameFallback(teamName || '');
}

function getColorEntry(teamName, seoName) {
  const canonicalSeoName = resolveTeamSeoName(teamName, seoName);

  return TEAM_COLOR_OVERRIDES_BY_SEO[canonicalSeoName]
    || teamColors[TEAM_COLOR_NAME_BY_SEO[canonicalSeoName]]
    || teamColors[teamName]
    || null;
}

export function getTeamColorSet(teamName, seoName) {
  const canonicalSeoName = resolveTeamSeoName(teamName, seoName);
  const colors = getColorEntry(teamName, canonicalSeoName);

  return {
    seoName: canonicalSeoName,
    primaryColor: colors?.primary_color || '#666666',
    secondaryColor: colors?.secondary_color || '#666666',
    tertiaryColor: colors?.tertiary_color || null,
  };
}

export function hexToRgb(color) {
  if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return null;
  }

  return {
    r: Number.parseInt(color.slice(1, 3), 16),
    g: Number.parseInt(color.slice(3, 5), 16),
    b: Number.parseInt(color.slice(5, 7), 16),
  };
}

export function getGradientStyleFromColor(primaryColor) {
  const rgb = hexToRgb(primaryColor);

  if (!rgb) {
    return 'background-color: rgba(39, 39, 42, 0.8)';
  }

  return `background: linear-gradient(to right,
    rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8) 0%,
    rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6) 100%
  )`;
}

export function getTeamGradientStyle(teamName, seoName) {
  const { primaryColor } = getTeamColorSet(teamName, seoName);
  return getGradientStyleFromColor(primaryColor);
}
