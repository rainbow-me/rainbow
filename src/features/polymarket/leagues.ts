const SPORTS = {
  baseball: {
    name: 'Baseball',
    color: {
      dark: '#1E77F4',
      light: '#1E77F4',
    },
  },
  basketball: {
    name: 'Basketball',
    color: {
      dark: '#E75C29',
      light: '#E75C29',
    },
  },
  tennis: {
    name: 'Tennis',
    color: {
      dark: '#D6FE51',
      light: '#94BD0D',
    },
  },
  hockey: {
    name: 'Hockey',
    color: {
      dark: '#36A0EE',
      light: '#36A0EE',
    },
  },
  soccer: {
    name: 'Soccer',
    color: {
      dark: '#FFFFFF',
      light: '#000000',
    },
  },
  cricket: {
    name: 'Cricket',
    color: {
      dark: '#DA2924',
      light: '#AF403D',
    },
  },
  motorsports: {
    name: 'Motorsports',
    color: {
      dark: '#E10600',
      light: '#E10600',
    },
  },
  esports: {
    name: 'Esports',
    color: {
      dark: '#D8A73A',
      light: '#C19D4D',
    },
  },
} as const;

export const SPORT_LEAGUES = {
  nfl: {
    name: 'NFL',
    fullName: 'National Football League',
    sportId: 'football',
    color: {
      dark: '#A2EEFF',
      light: '#25BEE1',
    },
  },
  nba: {
    name: 'NBA',
    fullName: 'National Basketball Association',
    sportId: 'basketball',
    color: {
      dark: '#E75C29',
      light: '#E75C29',
    },
  },
  cfb: {
    name: 'CFB',
    fullName: 'College Football',
    sportId: 'football',
    color: {
      dark: '#52D35E',
      light: '#21A82D',
    },
  },
  ufc: {
    name: 'UFC',
    fullName: 'Ultimate Fighting Championship',
    sportId: 'mixed-martial-arts',
    color: {
      dark: '#E64D45',
      light: '#E64D45',
    },
    gammaLeagueId: 'mma',
  },
  cs2: {
    name: 'CS2',
    fullName: 'Counter-Strike 2',
    sportId: 'esports',
    color: {
      dark: '#D8A73A',
      light: '#C19D4D',
    },
    gammaLeagueId: 'csgo',
  },
  dota2: {
    name: 'Dota 2',
    fullName: 'Dota 2',
    sportId: 'esports',
    color: {
      dark: '#FA3426',
      light: '#FA3426',
    },
  },
  val: {
    name: 'Valorant',
    fullName: 'Valorant',
    sportId: 'esports',
    color: {
      dark: '#FF4655',
      light: '#FF4655',
    },
    gammaLeagueId: 'valorant',
  },
  lol: {
    name: 'LOL',
    fullName: 'League of Legends',
    sportId: 'esports',
    color: {
      dark: '#C8AA6E',
      light: '#A9822A',
    },
    gammaLeagueId: 'league-of-legends',
  },
  sc2: {
    name: 'SC2',
    fullName: 'StarCraft II',
    sportId: 'esports',
    color: {
      dark: '#D8A73A',
      light: '#C19D4D',
    },
    gammaLeagueId: 'starcraft2',
  },
  cbb: {
    name: 'NCAAB',
    fullName: 'NCAA Basketball',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  ahl: {
    name: 'AHL',
    fullName: 'American Hockey League',
    sportId: 'hockey',
    color: SPORTS.hockey.color,
  },
  wnba: {
    name: 'WNBA',
    fullName: "Women's National Basketball Association",
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  wcbb: {
    name: 'NCAAW',
    fullName: "NCAA Women's Basketball",
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkaba: {
    name: 'ABA League',
    fullName: 'ABA League',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkseriea: {
    name: 'Serie A Basket',
    fullName: 'Lega Basket Serie A',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  nhl: {
    name: 'NHL',
    fullName: 'National Hockey League',
    sportId: 'hockey',
    color: SPORTS.hockey.color,
  },
  wch: {
    name: 'World Championship',
    fullName: 'Ice Hockey World Championship',
    sportId: 'hockey',
    color: SPORTS.hockey.color,
  },
  mlb: {
    name: 'MLB',
    fullName: 'Major League Baseball',
    sportId: 'baseball',
    color: SPORTS.baseball.color,
  },
  epl: {
    name: 'Premier League',
    fullName: 'English Premier League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  ucl: {
    name: 'UCL',
    fullName: 'UEFA Champions League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  mls: {
    name: 'MLS',
    fullName: 'Major League Soccer',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  bun: {
    name: 'Bundesliga',
    fullName: 'Bundesliga',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  lal: {
    name: 'La Liga',
    fullName: 'Spanish La Liga',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  sea: {
    name: 'Serie A',
    fullName: 'Serie A',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  bra1: {
    name: 'Brazil Serie A',
    fullName: 'Brazil Serie A',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  bra2: {
    name: 'Brazil Serie B',
    fullName: 'Brazil Serie B',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  bsseriea: {
    name: 'Brazil Serie A',
    fullName: 'Brazil Serie A',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  cze1: {
    name: 'Czech First League',
    fullName: 'Czech First League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  dfb: {
    name: 'DFB-Pokal',
    fullName: 'DFB-Pokal',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  egy1: {
    name: 'EGY1',
    fullName: 'Egyptian Premier League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  fif: {
    name: 'FIFA',
    fullName: 'FIFA International',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  fifwc: {
    name: 'FIFA World Cup',
    fullName: 'FIFA World Cup',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  fl1: {
    name: 'Ligue 1',
    fullName: 'French Ligue 1',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  j2100: {
    name: 'J2 League',
    fullName: 'J2 League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  j1100: {
    name: 'J1 League',
    fullName: 'Japan J League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  tur: {
    name: 'Super Lig',
    fullName: 'Turkish Super Lig',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  lib: {
    name: 'Libertadores',
    fullName: 'CONMEBOL Libertadores',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  cde: {
    name: 'Copa del Rey',
    fullName: 'Copa del Rey',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  ere: {
    name: 'Eredivisie',
    fullName: 'Eredivisie',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  mex: {
    name: 'Liga MX',
    fullName: 'Liga MX',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  nor: {
    name: 'Eliteserien',
    fullName: 'Norwegian Eliteserien',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  elc: {
    name: 'EFL Championship',
    fullName: 'EFL Championship',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  chi1: {
    name: 'Chile Primera',
    fullName: 'Chile Primera Division',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  sud: {
    name: 'Sudamericana',
    fullName: 'CONMEBOL Sudamericana',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  crint: {
    name: 'Cricket',
    fullName: 'International Cricket',
    sportId: 'cricket',
    color: SPORTS.cricket.color,
  },
  ipl: {
    name: 'IPL',
    fullName: 'Indian Premier League',
    sportId: 'cricket',
    color: SPORTS.cricket.color,
  },
  atp: {
    name: 'ATP',
    fullName: 'Association of Tennis Professionals',
    sportId: 'tennis',
    color: SPORTS.tennis.color,
  },
  wta: {
    name: 'WTA',
    fullName: "Women's Tennis Association",
    sportId: 'tennis',
    color: SPORTS.tennis.color,
  },
  itf: {
    name: 'ITF',
    fullName: 'International Tennis Federation',
    sportId: 'tennis',
    color: SPORTS.tennis.color,
  },
  f1: {
    name: 'F1',
    fullName: 'Formula 1',
    sportId: 'motorsports',
    color: { dark: '#FF1E00', light: '#E10600' },
  },
  scop: {
    name: 'SCOP',
    fullName: 'SCOP',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  acn: {
    name: 'ACN',
    fullName: 'ACN',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
} as const;

export const LEAGUE_SELECTOR_ORDER: LeagueId[] = ['nfl', 'nba', 'mlb', 'cfb', 'cbb', 'epl', 'nhl', 'atp', 'ufc', 'cs2', 'crint'];

export const LEAGUE_LIST_ORDER: LeagueId[] = [
  ...LEAGUE_SELECTOR_ORDER,
  'ahl',
  'wnba',
  'wcbb',
  'bkaba',
  'bkseriea',
  'mlb',
  'wch',
  'ucl',
  'mls',
  'bun',
  'lal',
  'sea',
  'bra1',
  'bra2',
  'bsseriea',
  'cze1',
  'dfb',
  'egy1',
  'fif',
  'fifwc',
  'fl1',
  'j1100',
  'j2100',
  'tur',
  'lib',
  'cde',
  'ere',
  'mex',
  'nor',
  'elc',
  'chi1',
  'sud',
  'ipl',
  'wta',
  'itf',
  'f1',
  'dota2',
  'val',
  'lol',
];

export type LeagueId = keyof typeof SPORT_LEAGUES;
export type League = (typeof SPORT_LEAGUES)[LeagueId];
export type SportId = League['sportId'];

export function getLeagueSlugId(value: string): string | undefined {
  const [slugId] = value.split('-');
  return slugId?.toLowerCase() || undefined;
}

function isLeagueId(value: string): value is LeagueId {
  return value in SPORT_LEAGUES;
}

export function getLeagueId(value: string): LeagueId | undefined {
  const slugId = getLeagueSlugId(value);
  if (!slugId) return undefined;
  return isLeagueId(slugId) ? slugId : undefined;
}

export function getLeague(value: string): League | undefined {
  const leagueId = getLeagueId(value);
  return leagueId ? SPORT_LEAGUES[leagueId] : undefined;
}

export function getGammaLeagueId(value: string): string | undefined {
  const slugId = getLeagueSlugId(value);
  if (!slugId) return undefined;
  const leagueId = getLeagueId(value);
  if (leagueId) {
    const league = SPORT_LEAGUES[leagueId];
    return 'gammaLeagueId' in league ? league.gammaLeagueId : leagueId;
  }
  return slugId;
}
