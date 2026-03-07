import { TEAM_COLORS_BY_SEO, TEAM_NAME_TO_SEO } from '$lib/teamColorData';

export function resolveTeamSeoName(teamName, seoName) {
  if (seoName) {
    return seoName;
  }

  return TEAM_NAME_TO_SEO[teamName] || '';
}

function getColorEntry(seoName) {
  return TEAM_COLORS_BY_SEO[seoName] || null;
}

export function getTeamColorSet(seoName = '') {
  const colors = getColorEntry(seoName);

  return {
    seoName,
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

export function getTeamGradientStyle(seoName) {
  const { primaryColor } = getTeamColorSet(seoName);
  return getGradientStyleFromColor(primaryColor);
}
