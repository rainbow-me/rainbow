import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { PLATFORM_API_KEY } from 'react-native-dotenv';
import { Address } from 'viem';
import { getSolidColorEquivalent } from '@/worklets/colors';

export const RAINBOW_POLYMARKET_FEE_ADDRESS: Address = '0x757758506d6a4F8a433F8BECaFd52545f9Cb050a';

export const POLYGON_USDC_ADDRESS: Address = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
export const POLYGON_USDC_DECIMALS = 6;

export const USD_FEE_PER_TOKEN = '0.01';

export const POLYMARKET_CTF_ADDRESS: Address = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
export const POLYMARKET_NEG_RISK_ADAPTER_ADDRESS: Address = '0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296';

// Exchange contracts that execute trades - these need USDC and CTF approvals
export const POLYMARKET_EXCHANGE_ADDRESS: Address = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
export const POLYMARKET_NEG_RISK_EXCHANGE_ADDRESS: Address = '0xC5d563A36AE78145C45a50134d48A1215220f80a';

const RAINBOW_POLYMARKET_PROXY_URL = 'https://platform.p.rainbow.me/v1/polymarket';

export const POLYMARKET_CLOB_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/clob`;
export const POLYMARKET_RELAYER_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/relayer`;
export const POLYMARKET_SIGNING_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/sign`;
export const POLYMARKET_CLOB_URL = 'https://clob.polymarket.com';
export const POLYMARKET_GAMMA_API_URL = 'https://gamma-api.polymarket.com';
export const POLYMARKET_DATA_API_URL = 'https://data-api.polymarket.com';

export const BUILDER_CONFIG = new BuilderConfig({
  remoteBuilderConfig: { url: POLYMARKET_SIGNING_PROXY_URL, token: PLATFORM_API_KEY },
});

export const POLYMARKET_ACCENT_COLOR = '#C55DE7';
export const POLYMARKET_BACKGROUND_DARK = getSolidColorEquivalent({ background: '#000000', foreground: '#1D0E20', opacity: 0.4 });
export const POLYMARKET_BACKGROUND_LIGHT = '#F5F5F7';

export const POLYMARKET_TOKEN_ID_SUFFIX = 'polymarket';

export const NAVIGATOR_FOOTER_HEIGHT = 66;
// padding distance between bottom most content and the navigator footer
export const NAVIGATOR_FOOTER_CLEARANCE = 36;

export const POLYMARKET_SPORTS_MARKET_TYPE = {
  SPREADS: 'spreads',
  TOTALS: 'totals',
  MONEYLINE: 'moneyline',
  FIRST_HALF_SPREADS: 'first_half_spreads',
  FIRST_HALF_TOTALS: 'first_half_totals',
  FIRST_HALF_MONEYLINE: 'first_half_moneyline',
  // Nested moneyline (eg. "Counter-Strike: Venom vs ARCRED - Map 2 Winner")
  CHILD_MONEYLINE: 'child_moneyline',
  BOTH_TEAMS_TO_SCORE: 'both_teams_to_score',
  UFC_METHOD_OF_VICTORY: 'ufc_method_of_victory',
  UFC_GO_THE_DISTANCE: 'ufc_go_the_distance',
  TENNIS_MATCH_TOTALS: 'tennis_match_totals',
  TENNIS_SET_HANDICAP: 'tennis_set_handicap',
  TENNIS_SET_TOTALS: 'tennis_set_totals',
  TENNIS_FIRST_SET_WINNER: 'tennis_first_set_winner',
  TENNIS_FIRST_SET_TOTALS: 'tennis_first_set_totals',
} as const;

export const DEFAULT_CATEGORY_KEY = 'trending';
export const DEFAULT_SPORTS_LEAGUE_KEY = 'all' as const;
export const CATEGORIES = {
  trending: {
    label: 'Trending',
    icon: '􀙭',
    // Trending represents the default 'all' category
    tagId: null,
    color: {
      dark: '#C863E8',
      light: '#E445D3',
    },
  },
  sports: {
    label: 'Sports',
    icon: '􁗉',
    tagId: 'sports',
    color: {
      dark: '#61D36E',
      light: '#1DB847',
    },
  },
  politics: {
    label: 'Politics',
    icon: '􀤩',
    tagId: 'politics',
    color: {
      dark: '#F8A24B',
      light: '#F8A24B',
    },
  },
  finance: {
    label: 'Finance',
    icon: '􁎢',
    tagId: 'finance',
    color: {
      dark: '#4F60FF',
      light: '#4F60FF',
    },
  },
  crypto: {
    label: 'Crypto',
    icon: '􁑞',
    tagId: 'crypto',
    color: {
      dark: '#AA75FF',
      light: '#8943F8',
    },
  },
  geopolitics: {
    label: 'Geopolitics',
    icon: '􀵲',
    tagId: 'geopolitics',
    color: {
      dark: '#EEA929',
      light: '#D39013',
    },
  },
  earnings: {
    label: 'Earnings',
    icon: '􀑁',
    tagId: 'earnings',
    color: {
      dark: '#BAE447',
      light: '#92BF16',
    },
  },
  tech: {
    label: 'Tech',
    icon: '􀓗',
    tagId: 'tech',
    color: {
      dark: '#438DFB',
      light: '#438DFB',
    },
  },
  ['pop-culture']: {
    label: 'Culture',
    icon: '􀫔',
    tagId: 'pop-culture',
    color: {
      dark: '#F54F4F',
      light: '#F54F4F',
    },
  },
  world: {
    label: 'World',
    icon: '􀆪',
    tagId: 'world',
    color: {
      dark: '#6BBDFF',
      light: '#6BBDFF',
    },
  },
  economy: {
    label: 'Economy',
    icon: '􀎜',
    tagId: 'economy',
    color: {
      dark: '#43D4C8',
      light: '#43D4C8',
    },
  },
  elections: {
    label: 'Elections',
    icon: '􁅈',
    tagId: 'elections',
    color: {
      dark: '#479DE4',
      light: '#479DE4',
    },
  },
  ['mention-markets']: {
    label: 'Mentions',
    icon: '􀿋',
    tagId: 'mention-markets',
    color: {
      dark: '#F262E3',
      light: '#F54F4F',
    },
  },
} as const;

export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

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
};

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
  },
  cs2: {
    name: 'CS2',
    fullName: 'Counter-Strike 2',
    sportId: 'esports',
    color: {
      dark: '#D8A73A',
      light: '#C19D4D',
    },
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
  valorant: {
    name: 'Valorant',
    fullName: 'Valorant',
    sportId: 'esports',
    color: {
      dark: '#FF4655',
      light: '#FF4655',
    },
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
