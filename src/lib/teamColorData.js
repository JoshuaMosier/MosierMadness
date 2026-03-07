import rawTeamColorsByName from './ncaa_team_colors.json' with { type: 'json' };

const MANUAL_TEAM_COLORS_BY_SEO = Object.freeze({
  'alabama-am': {
    primary_color: '#5F1316',
    secondary_color: '#FFFFFF',
    tertiary_color: null,
  },
  'am-corpus-chris': {
    primary_color: '#1478C7',
    secondary_color: '#008350',
    tertiary_color: '#07294A',
  },
  army: {
    primary_color: '#1A191A',
    secondary_color: '#D4B67B',
    tertiary_color: null,
  },
  bellarmine: {
    primary_color: '#752936',
    secondary_color: '#C8C8C8',
    tertiary_color: null,
  },
  'bethune-cookman': {
    primary_color: '#6F263D',
    secondary_color: '#F2A900',
    tertiary_color: '#000000',
  },
  'central-conn-st': {
    primary_color: '#00539B',
    secondary_color: '#FFFFFF',
    tertiary_color: '#CFD4D8',
  },
  detroit: {
    primary_color: '#AD0C3C',
    secondary_color: '#19336E',
    tertiary_color: '#FFFFFF',
  },
  'eastern-wash': {
    primary_color: '#A10022',
    secondary_color: '#000000',
    tertiary_color: '#FFFFFF',
  },
  'fairleigh-dickinson': {
    primary_color: '#28334A',
    secondary_color: '#72293C',
    tertiary_color: null,
  },
  'florida-am': {
    primary_color: '#E7881C',
    secondary_color: '#2E9E62',
    tertiary_color: '#211D1D',
  },
  'idaho-st': {
    primary_color: '#F37820',
    secondary_color: '#231F20',
    tertiary_color: '#FEFEFE',
  },
  ipfw: {
    primary_color: '#231F20',
    secondary_color: '#DAAC27',
    tertiary_color: '#1F3D7C',
  },
  'iu-indy': {
    primary_color: '#D52136',
    secondary_color: '#001522',
    tertiary_color: '#CA7916',
  },
  'la-lafayette': {
    primary_color: '#D11C2E',
    secondary_color: '#181210',
    tertiary_color: '#FFFFFF',
  },
  'la-monroe': {
    primary_color: '#8A2432',
    secondary_color: '#EBA900',
    tertiary_color: null,
  },
  'le-moyne': {
    primary_color: '#00452A',
    secondary_color: '#FCE300',
    tertiary_color: null,
  },
  'lindenwood-mo': {
    primary_color: '#101820',
    secondary_color: '#B5A36A',
    tertiary_color: '#FFFFFF',
  },
  'loyola-chicago': {
    primary_color: '#511D20',
    secondary_color: '#FDDD4E',
    tertiary_color: null,
  },
  'md-east-shore': {
    primary_color: '#651D32',
    secondary_color: '#888B8D',
    tertiary_color: '#000000',
  },
  mercyhurst: {
    primary_color: '#1A554B',
    secondary_color: '#1C294D',
    tertiary_color: '#FFFFFF',
  },
  'mississippi-val': {
    primary_color: '#00703C',
    secondary_color: '#E51937',
    tertiary_color: '#000000',
  },
  'nc-at': {
    primary_color: '#154280',
    secondary_color: '#FAB217',
    tertiary_color: '#FFFFFF',
  },
  'nc-central': {
    primary_color: '#960A2C',
    secondary_color: '#231F20',
    tertiary_color: '#FFFFFF',
  },
  'new-haven': {
    primary_color: '#002D74',
    secondary_color: '#FFC629',
    tertiary_color: null,
  },
  'northern-ariz': {
    primary_color: '#173A79',
    secondary_color: '#FCD006',
    tertiary_color: '#F2AC20',
  },
  'northern-colo': {
    primary_color: '#013C65',
    secondary_color: '#F6B000',
    tertiary_color: null,
  },
  'northwestern-st': {
    primary_color: '#492F92',
    secondary_color: '#F78426',
    tertiary_color: '#FFFFFF',
  },
  'sacramento-st': {
    primary_color: '#024D36',
    secondary_color: '#B09247',
    tertiary_color: null,
  },
  seattle: {
    primary_color: '#181717',
    secondary_color: '#C32F41',
    tertiary_color: '#FFFFFF',
  },
  'siu-edwardsville': {
    primary_color: '#CE202F',
    secondary_color: '#D4AE7D',
    tertiary_color: null,
  },
  'south-ala': {
    primary_color: '#173A79',
    secondary_color: '#D2103E',
    tertiary_color: '#FFFFFF',
  },
  'southeastern-la': {
    primary_color: '#1D4C30',
    secondary_color: '#F6C03C',
    tertiary_color: '#FFFFFE',
  },
  'southern-ind': {
    primary_color: '#CF102D',
    secondary_color: '#002856',
    tertiary_color: '#FFFFFF',
  },
  'southern-utah': {
    primary_color: '#CF2127',
    secondary_color: '#231F20',
    tertiary_color: '#FFFFFF',
  },
  'st-francis-pa': {
    primary_color: '#BC1F26',
    secondary_color: '#221F1F',
    tertiary_color: '#A6A8AA',
  },
  'st-johns-ny': {
    primary_color: '#D41041',
    secondary_color: '#231F20',
    tertiary_color: null,
  },
  'st-peters': {
    primary_color: '#21375C',
    secondary_color: '#FFFFFE',
    tertiary_color: null,
  },
  'stephen-f-austin': {
    primary_color: '#613393',
    secondary_color: '#FFFFFF',
    tertiary_color: null,
  },
  'st-thomas-mn': {
    primary_color: '#412784',
    secondary_color: '#FFFFFF',
    tertiary_color: null,
  },
  stonehill: {
    primary_color: '#2F2975',
    secondary_color: '#B9B7B8',
    tertiary_color: '#231F20',
  },
  'southeast-mo-st': {
    primary_color: '#C8102E',
    secondary_color: '#000000',
    tertiary_color: '#FFFFFF',
  },
  stthom: {
    primary_color: '#412784',
    secondary_color: '#FFFFFF',
    tertiary_color: null,
  },
  'tarleton-st': {
    primary_color: '#4F2D7F',
    secondary_color: '#FFFFFF',
    tertiary_color: '#00B1E1',
  },
  'tennessee-tech': {
    primary_color: '#4F2984',
    secondary_color: '#FFDD00',
    tertiary_color: '#FFFFFF',
  },
  'tex-am-commerce': {
    primary_color: '#00386C',
    secondary_color: '#FFC333',
    tertiary_color: null,
  },
  'utah-tech': {
    primary_color: '#BA1C21',
    secondary_color: '#003058',
    tertiary_color: '#FFFFFF',
  },
  ualr: {
    primary_color: '#6B1F36',
    secondary_color: '#FFFFFF',
    tertiary_color: null,
  },
  uiw: {
    primary_color: '#D12636',
    secondary_color: '#231F20',
    tertiary_color: '#FFFFFF',
  },
  'weber-st': {
    primary_color: '#492365',
    secondary_color: '#4B4945',
    tertiary_color: '#FFFFFF',
  },
  'west-ga': {
    primary_color: '#0656A5',
    secondary_color: '#DA2128',
    tertiary_color: null,
  },
  'western-ill': {
    primary_color: '#59327E',
    secondary_color: '#F8C823',
    tertiary_color: null,
  },
});

export const TEAM_NAME_TO_SEO = Object.freeze({
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
  'Mount St. Mary\'s': 'mt-st-marys',
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
  'Saint Joseph\'s': 'saint-josephs',
  'Saint Louis': 'saint-louis',
  'Saint Mary\'s (CA)': 'st-marys-ca',
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
});

const SOURCE_TEAM_NAME_TO_SEO = Object.freeze({
  ...TEAM_NAME_TO_SEO,
  'A&M-Corpus Christi': 'am-corpus-chris',
  'Alabama A&M': 'alabama-am',
  'Army West Point': 'army',
  'Bethune-Cookman': 'bethune-cookman',
  'Coastal Carolina': 'coastal-caro',
  'Central Conn. St.': 'central-conn-st',
  'CSU Bakersfield': 'bakersfield',
  CSUN: 'cal-st-northridge',
  'Detroit Mercy': 'detroit',
  'Florida A&M': 'florida-am',
  'Incarnate Word Cardinals': 'uiw',
  'Little Rock': 'ualr',
  Louisiana: 'la-lafayette',
  'Mount St. Mary\'s': 'mt-st-marys',
  'N.C. A&T': 'nc-at',
  'N.C. Central': 'nc-central',
  Nicholls: 'nicholls-st',
  'North Dakota State Bison': 'north-dakota-st',
  Omaha: 'neb-omaha',
  'Northern Illinois': 'northern-ill',
  'Northern Iowa': 'uni',
  'Purdue Fort Wayne': 'ipfw',
  'SE Louisiana Lions': 'southeastern-la',
  'Sam Houston': 'sam-houston-st',
  'Seattle U': 'seattle',
  SIUE: 'siu-edwardsville',
  'South Alabama': 'south-ala',
  'St. John\'s (NY)': 'st-johns-ny',
  'St. Louis Billikens': 'saint-louis',
  'Saint Francis': 'st-francis-pa',
  'Saint Peter\'s': 'st-peters',
  'Texas A&M': 'tex-am',
  'The Citadel': 'citadel',
  UIC: 'ill-chicago',
  'UT Arlington': 'texas-arlington',
  ULM: 'la-monroe',
  'Western Illinois': 'western-ill',
  'Western Carolina Catamounts': 'western-caro',
  'William & Mary': 'william-mary',
});

const TEAM_COLOR_ALIAS_BY_SEO = Object.freeze({
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
});

function slugifyColorSourceName(teamName) {
  return teamName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const TEAM_COLORS_FROM_SOURCE_BY_SEO = Object.freeze(
  Object.fromEntries(
    Object.entries(rawTeamColorsByName).map(([sourceTeamName, colorSet]) => [
      SOURCE_TEAM_NAME_TO_SEO[sourceTeamName] || slugifyColorSourceName(sourceTeamName),
      colorSet,
    ])
  )
);

const TEAM_COLOR_ALIASES = Object.freeze(
  Object.fromEntries(
    Object.entries(TEAM_COLOR_ALIAS_BY_SEO)
      .map(([aliasSeoName, canonicalSeoName]) => [aliasSeoName, TEAM_COLORS_FROM_SOURCE_BY_SEO[canonicalSeoName] || MANUAL_TEAM_COLORS_BY_SEO[canonicalSeoName]])
      .filter(([, colorSet]) => Boolean(colorSet))
  )
);

export const TEAM_COLORS_BY_SEO = Object.freeze({
  ...TEAM_COLORS_FROM_SOURCE_BY_SEO,
  ...TEAM_COLOR_ALIASES,
  ...MANUAL_TEAM_COLORS_BY_SEO,
});
