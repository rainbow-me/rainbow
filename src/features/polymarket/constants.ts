import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { PLATFORM_API_KEY, PLATFORM_BASE_URL } from 'react-native-dotenv';
import { type Address } from 'viem';

import { getSolidColorEquivalent } from '@/worklets/colors';

export const POLYGON_USDC_ADDRESS: Address = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
export const POLYGON_USDC_DECIMALS = 6;

// Core trading contracts
export const POLYMARKET_CTF_ADDRESS: Address = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
export const POLYMARKET_CTF_EXCHANGE_ADDRESS: Address = '0xE111180000d2663C0091e4f400237545B87B996B';
export const POLYMARKET_NEG_RISK_CTF_EXCHANGE_ADDRESS: Address = '0xe2222d279d744050d28e00520010520000310F59';
export const POLYMARKET_NEG_RISK_ADAPTER_ADDRESS: Address = '0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296';

// Collateral contracts
export const POLYMARKET_PUSD_ADDRESS: Address = '0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB';
export const POLYMARKET_PUSD_DECIMALS = 6;
export const POLYMARKET_PUSD_IMPLEMENTATION_ADDRESS: Address = '0x6bBCef9f7ef3B6C592c99e0f206a0DE94Ad0925f';
export const POLYMARKET_COLLATERAL_ONRAMP_ADDRESS: Address = '0x93070a847efEf7F70739046A929D47a521F5B8ee';
export const POLYMARKET_COLLATERAL_OFFRAMP_ADDRESS: Address = '0x2957922Eb93258b93368531d39fAcCA3B4dC5854';
export const POLYMARKET_PERMISSIONED_RAMP_ADDRESS: Address = '0xebC2459Ec962869ca4c0bd1E06368272732BCb08';
export const POLYMARKET_CTF_COLLATERAL_ADAPTER_ADDRESS: Address = '0xAdA100Db00Ca00073811820692005400218FcE1f';
export const POLYMARKET_NEG_RISK_CTF_COLLATERAL_ADAPTER_ADDRESS: Address = '0xadA2005600Dec949baf300f4C6120000bDB6eAab';

// Wallet factory contracts
export const POLYMARKET_GNOSIS_SAFE_FACTORY_ADDRESS: Address = '0xaacfeea03eb1561c4e67d661e40682bd20e3541b';
export const POLYMARKET_PROXY_FACTORY_ADDRESS: Address = '0xaB45c5A4B0c941a2F231C04C3f49182e1A254052';

// Resolution contracts
export const POLYMARKET_UMA_ADAPTER_ADDRESS: Address = '0x6A9D222616C90FcA5754cd1333cFD9b7fb6a4F74';
export const POLYMARKET_UMA_OPTIMISTIC_ORACLE_ADDRESS: Address = '0xCB1822859cEF82Cd2Eb4E6276C7916e692995130';

const RAINBOW_POLYMARKET_PROXY_URL = `${PLATFORM_BASE_URL}/v1/polymarket`;

export const POLYMARKET_CLOB_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/clob`;
export const POLYMARKET_RELAYER_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/relayer`;
export const POLYMARKET_SIGNING_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/sign`;

export const POLYMARKET_CLOB_URL = 'https://clob.polymarket.com';
export const POLYMARKET_GAMMA_API_URL = 'https://gamma-api.polymarket.com';
export const POLYMARKET_DATA_API_URL = 'https://data-api.polymarket.com';

export const POLYMARKET_SPORTS_WS_URL = 'wss://sports-api.polymarket.com/ws';

export const POLYMARKET_BUILDER_CODE = '0xabce5abdc189cba6fb85edb9170e3e6e41607e946b06d112b7f87e2f2977020c';

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
