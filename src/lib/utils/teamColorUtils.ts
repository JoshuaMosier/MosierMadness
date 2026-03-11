const TEAM_NAME_TO_SEO: Record<string, string> = {
  'App State': 'appalachian-st',
  Bellarmine: 'bellarmine',
  CSUBAK: 'bakersfield',
  'Central Ark.': 'central-ark',
  'Charleston So.': 'charleston-so',
  'Co Car': 'coastal-caro',
  'Col. of Charleston': 'col-of-charleston',
  'Eastern Ky.': 'eastern-ky',
  ETSU: 'east-tenn-st',
  'Fla. Atlantic': 'fla-atlantic',
  'Ga. Southern': 'ga-southern',
  'Idaho St.': 'idaho-st',
  'Idaho St': 'idaho-st',
  'Idaho State': 'idaho-st',
  LIU: 'long-island',
  'Loyola (Chicago)': 'loyola-chicago',
  'Loyola Chicago': 'loyola-chicago',
  Mercyhurst: 'mercyhurst',
  'Mt St My': 'mt-st-marys',
  'Mt St Mary': 'mt-st-marys',
  "Mount St. Mary's": 'mt-st-marys',
  NIU: 'northern-ill',
  'NC State': 'north-carolina-st',
  'ND St.': 'north-dakota-st',
  'ND St': 'north-dakota-st',
  'North Dakota State': 'north-dakota-st',
  'Northern Ariz.': 'northern-ariz',
  'Northern Ariz': 'northern-ariz',
  'Northern Arizona': 'northern-ariz',
  'Northern Illinois': 'northern-ill',
  'Northern Iowa': 'uni',
  Omaha: 'neb-omaha',
  'Sacramento St.': 'sacramento-st',
  'Sacramento St': 'sacramento-st',
  'Sacramento State': 'sacramento-st',
  "Saint Joseph's": 'saint-josephs',
  'Saint Louis': 'saint-louis',
  "Saint Mary's (CA)": 'st-marys-ca',
  'Saint Thomas': 'st-thomas-mn',
  'Sam Houston': 'sam-houston-st',
  SEMO: 'southeast-mo-st',
  'Southeast Mo. St.': 'southeast-mo-st',
  'Southeast Missouri State': 'southeast-mo-st',
  'South Fla.': 'south-fla',
  'Southern Utah': 'southern-utah',
  'St. Thomas': 'st-thomas-mn',
  'St. Thomas (MN)': 'st-thomas-mn',
  Stthom: 'st-thomas-mn',
  Stonehill: 'stonehill',
  'Texas A&M': 'tex-am',
  'The Citadel': 'citadel',
  UIC: 'ill-chicago',
  UAlbany: 'albany-ny',
  UMass: 'massachusetts',
  'UMass Lowell': 'umass-lowell',
  UNCW: 'unc-wilmington',
  UNI: 'uni',
  'UT Arlington': 'texas-arlington',
  'Utah Tech': 'utah-tech',
  'West Ga.': 'west-ga',
  'West Georgia': 'west-ga',
  'Western Caro.': 'western-caro',
  'Western Caro': 'western-caro',
  'Western Carolina': 'western-caro',
  'William & Mary': 'william-mary',
};

export function resolveTeamSeoName(teamName: string, seoName?: string): string {
  if (seoName) {
    return seoName;
  }

  return TEAM_NAME_TO_SEO[teamName] || '';
}

export function hexToRgb(color: string): { r: number; g: number; b: number } | null {
  if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return null;
  }

  return {
    r: Number.parseInt(color.slice(1, 3), 16),
    g: Number.parseInt(color.slice(3, 5), 16),
    b: Number.parseInt(color.slice(5, 7), 16),
  };
}

export function getGradientStyleFromColor(primaryColor: string): string {
  const rgb = hexToRgb(primaryColor);

  if (!rgb) {
    return 'background-color: rgba(39, 39, 42, 0.8)';
  }

  return `background: linear-gradient(to right,
    rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8) 0%,
    rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6) 100%
  )`;
}
