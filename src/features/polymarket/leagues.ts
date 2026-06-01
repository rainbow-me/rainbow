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
  chess: {
    name: 'Chess',
    color: {
      dark: '#FFFFFF',
      light: '#000000',
    },
  },
  slap: {
    name: 'Slap Fighting',
    color: {
      dark: '#F5443A',
      light: '#D6271D',
    },
  },
  rugby: {
    name: 'Rugby',
    color: {
      dark: '#C45911',
      light: '#C45911',
    },
  },
  pickleball: {
    name: 'Pickleball',
    color: {
      dark: '#4ADE80',
      light: '#22C55E',
    },
  },
  lacrosse: {
    name: 'Lacrosse',
    color: {
      dark: '#60A5FA',
      light: '#1E40AF',
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
  cwbb: {
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
  bra: {
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
  acn: {
    name: 'AFCON',
    fullName: 'Africa Cup of Nations',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  scop: {
    name: 'Scottish Premiership',
    fullName: 'Scottish Premiership',
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
  cricipl: {
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
  bol1: {
    name: 'Bolivia Primera',
    fullName: 'Bolivian Primera División',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  es2: {
    name: 'LaLiga 2',
    fullName: 'Spanish Segunda División',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  chi: {
    name: 'CSL',
    fullName: 'Chinese Super League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  per1: {
    name: 'Liga 1',
    fullName: 'Peruvian Liga 1',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  spl: {
    name: 'Saudi Pro League',
    fullName: 'Saudi Pro League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  nwsl: {
    name: 'NWSL',
    fullName: "National Women's Soccer League",
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  ukr1: {
    name: 'UPL',
    fullName: 'Ukrainian Premier League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  uel: {
    name: 'UEL',
    fullName: 'UEFA Europa League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  por: {
    name: 'Primeira Liga',
    fullName: 'Primeira Liga',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  mar1: {
    name: 'Botola Pro',
    fullName: 'Botola Pro',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  brco: {
    name: 'Copa do Brasil',
    fullName: 'Copa do Brasil',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  rou1: {
    name: 'Liga I',
    fullName: 'Romanian Liga I',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  kor: {
    name: 'K League',
    fullName: 'K League 1',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  isp: {
    name: 'ISL',
    fullName: 'Indian Super League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  swe: {
    name: 'Allsvenskan',
    fullName: 'Allsvenskan',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  uef: {
    name: 'UEFA',
    fullName: 'UEFA National Teams',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  bl2: {
    name: '2. Bundesliga',
    fullName: 'German 2. Bundesliga',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  arg: {
    name: 'Liga Profesional',
    fullName: 'Argentine Primera División',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  col1: {
    name: 'Primera A',
    fullName: 'Colombian Primera A',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  hr1: {
    name: 'HNL',
    fullName: 'Croatian HNL',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  den: {
    name: 'Superliga',
    fullName: 'Danish Superliga',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  svk1: {
    name: 'Niké Liga',
    fullName: 'Slovak First League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  fr2: {
    name: 'Ligue 2',
    fullName: 'French Ligue 2',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  aus: {
    name: 'A-League',
    fullName: 'A-League Men',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  bul: {
    name: 'Parva Liga',
    fullName: 'Bulgarian First League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  aut: {
    name: 'Bundesliga',
    fullName: 'Austrian Bundesliga',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  hun: {
    name: 'NB I',
    fullName: 'Hungarian NB I',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  el1: {
    name: 'League One',
    fullName: 'EFL League One',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  el2: {
    name: 'League Two',
    fullName: 'EFL League Two',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  srb: {
    name: 'SuperLiga',
    fullName: 'Serbian SuperLiga',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  ire: {
    name: 'LOI',
    fullName: 'League of Ireland',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  gtm: {
    name: 'Liga Nacional',
    fullName: 'Guatemalan Liga Nacional',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  fpd: {
    name: 'Primera División',
    fullName: 'Costa Rican Primera División',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  slo: {
    name: 'PrvaLiga',
    fullName: 'Slovenian PrvaLiga',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  isr: {
    name: 'Ligat haAl',
    fullName: 'Israeli Premier League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  rus: {
    name: 'RPL',
    fullName: 'Russian Premier League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  itsb: {
    name: 'Serie B',
    fullName: 'Italian Serie B',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  itc: {
    name: 'Coppa Italia',
    fullName: 'Coppa Italia',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  cdr: {
    name: 'Copa del Rey',
    fullName: 'Copa del Rey',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  efa: {
    name: 'FA Cup',
    fullName: 'FA Cup',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  efl: {
    name: 'EFL Cup',
    fullName: 'EFL Cup',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  col: {
    name: 'UECL',
    fullName: 'UEFA Conference League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  uwcl: {
    name: 'UWCL',
    fullName: "UEFA Women's Champions League",
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  ccc: {
    name: 'CONCACAF',
    fullName: 'CONCACAF Champions Cup',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  ssc: {
    name: 'Supercopa',
    fullName: 'Spanish Super Cup',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  scoc: {
    name: 'Scottish Cup',
    fullName: 'Scottish Cup',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  trsk: {
    name: 'Turkish Cup',
    fullName: 'Türkiye Kupası',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  enl: {
    name: 'National League',
    fullName: 'English National League',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  euroleague: {
    name: 'EuroLeague',
    fullName: 'EuroLeague',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkligend: {
    name: 'Liga ACB',
    fullName: 'Liga ACB',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkbbl: {
    name: 'BBL',
    fullName: 'Basketball Bundesliga',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkfr1: {
    name: 'Betclic Élite',
    fullName: 'French Betclic Élite',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkarg: {
    name: 'Liga Nacional',
    fullName: 'Argentine Liga Nacional de Básquet',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkbsl: {
    name: 'BSL',
    fullName: 'Turkish Basketball Super League',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkcba: {
    name: 'CBA',
    fullName: 'Chinese Basketball Association',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkvtb: {
    name: 'VTB',
    fullName: 'VTB United League',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkjpn: {
    name: 'B.League',
    fullName: 'B.League',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkgr1: {
    name: 'GBL',
    fullName: 'Greek Basket League',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkkbl: {
    name: 'KBL',
    fullName: 'Korean Basketball League',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  bkcl: {
    name: 'BCL',
    fullName: 'Basketball Champions League',
    sportId: 'basketball',
    color: SPORTS.basketball.color,
  },
  crict20blast: {
    name: 'T20 Blast',
    fullName: 'T20 Blast',
    sportId: 'cricket',
    color: SPORTS.cricket.color,
  },
  cricpsl: {
    name: 'PSL',
    fullName: 'Pakistan Super League',
    sportId: 'cricket',
    color: SPORTS.cricket.color,
  },
  criclcl: {
    name: 'LCL',
    fullName: 'Legends Cricket League',
    sportId: 'cricket',
    color: SPORTS.cricket.color,
  },
  kbo: {
    name: 'KBO',
    fullName: 'KBO League',
    sportId: 'baseball',
    color: SPORTS.baseball.color,
  },
  wbc: {
    name: 'WBC',
    fullName: 'World Baseball Classic',
    sportId: 'baseball',
    color: SPORTS.baseball.color,
  },
  mwoh: {
    name: 'IIHF Worlds',
    fullName: 'IIHF World Championship',
    sportId: 'hockey',
    color: SPORTS.hockey.color,
  },
  wwoh: {
    name: 'IIHF Women',
    fullName: "IIHF Women's World Championship",
    sportId: 'hockey',
    color: SPORTS.hockey.color,
  },
  khl: {
    name: 'KHL',
    fullName: 'Kontinental Hockey League',
    sportId: 'hockey',
    color: SPORTS.hockey.color,
  },
  mlbb: {
    name: 'MLBB',
    fullName: 'Mobile Legends: Bang Bang',
    sportId: 'esports',
    color: SPORTS.esports.color,
  },
  codmw: {
    name: 'CoD',
    fullName: 'Call of Duty',
    sportId: 'esports',
    color: SPORTS.esports.color,
  },
  r6siege: {
    name: 'R6',
    fullName: 'Rainbow Six Siege',
    sportId: 'esports',
    color: SPORTS.esports.color,
  },
  rl: {
    name: 'Rocket League',
    fullName: 'Rocket League',
    sportId: 'esports',
    color: SPORTS.esports.color,
  },
  ow: {
    name: 'OW',
    fullName: 'Overwatch',
    sportId: 'esports',
    color: SPORTS.esports.color,
  },
  hok: {
    name: 'HOK',
    fullName: 'Honor of Kings',
    sportId: 'esports',
    color: SPORTS.esports.color,
  },
  chess: {
    name: 'Chess',
    fullName: 'Chess',
    sportId: 'chess',
    color: SPORTS.chess.color,
  },
  powerslap: {
    name: 'Power Slap',
    fullName: 'Power Slap',
    sportId: 'slap',
    color: SPORTS.slap.color,
  },
  rutopft: {
    name: 'Top 14',
    fullName: 'Top 14',
    sportId: 'rugby',
    color: SPORTS.rugby.color,
  },
  ruurc: {
    name: 'URC',
    fullName: 'United Rugby Championship',
    sportId: 'rugby',
    color: SPORTS.rugby.color,
  },
  rusrp: {
    name: 'Super Rugby',
    fullName: 'Super Rugby Pacific',
    sportId: 'rugby',
    color: SPORTS.rugby.color,
  },
  ruprem: {
    name: 'Premiership Rugby',
    fullName: 'Premiership Rugby',
    sportId: 'rugby',
    color: SPORTS.rugby.color,
  },
  rueuchamp: {
    name: 'Champions Cup',
    fullName: 'European Rugby Champions Cup',
    sportId: 'rugby',
    color: SPORTS.rugby.color,
  },
  mlp: {
    name: 'MLP',
    fullName: 'Major League Pickleball',
    sportId: 'pickleball',
    color: SPORTS.pickleball.color,
  },
  pll: {
    name: 'PLL',
    fullName: 'Premier Lacrosse League',
    sportId: 'lacrosse',
    color: SPORTS.lacrosse.color,
  },
  wll: {
    name: 'WLL',
    fullName: "Women's Lacrosse League",
    sportId: 'lacrosse',
    color: SPORTS.lacrosse.color,
  },
} as const;

export const LEAGUE_SELECTOR_ORDER: LeagueId[] = ['nfl', 'nba', 'mlb', 'cfb', 'cbb', 'epl', 'nhl', 'atp', 'ufc', 'cs2', 'crint'];

export const LEAGUE_LIST_ORDER: LeagueId[] = [...LEAGUE_SELECTOR_ORDER, 'dota2', 'val'];

export type LeagueId = keyof typeof SPORT_LEAGUES;
export type League = (typeof SPORT_LEAGUES)[LeagueId];
export type SportId = League['sportId'];

export function getLeagueSlugId(value: string): string | undefined {
  const [slugId] = value.split('-');
  return slugId?.toLowerCase() || undefined;
}

export function isLeagueId(value: string): value is LeagueId {
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
