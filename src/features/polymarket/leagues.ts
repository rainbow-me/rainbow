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
      light: '#FFFFFF',
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
      light: '#FFFFFF',
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
  nhl: {
    name: 'NHL',
    fullName: 'National Hockey League',
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
  lal: {
    name: 'La Liga',
    fullName: 'Spanish La Liga',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  sea: {
    name: 'SEA',
    fullName: 'SEA',
    sportId: 'soccer',
    color: SPORTS.soccer.color,
  },
  crint: {
    name: 'Cricket',
    fullName: 'International Cricket',
    sportId: 'cricket',
    color: SPORTS.cricket.color,
  },
  atp: {
    name: 'ATP',
    fullName: 'Association of Tennis Professionals',
    sportId: 'tennis',
    color: SPORTS.tennis.color,
  },
} as const;

export const LEAGUE_SELECTOR_ORDER: LeagueId[] = ['nfl', 'nba', 'cfb', 'cbb', 'epl', 'nhl', 'atp', 'ufc', 'cs2', 'crint'];

export const LEAGUE_LIST_ORDER: LeagueId[] = [...LEAGUE_SELECTOR_ORDER, 'mlb', 'dota2', 'val'];

export type LeagueId = keyof typeof SPORT_LEAGUES;
export type League = (typeof SPORT_LEAGUES)[LeagueId];
export type SportId = League['sportId'];

export function getLeagueSlugId(value: string): string | undefined {
  const [slugId] = value.split('-');
  return slugId || undefined;
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
