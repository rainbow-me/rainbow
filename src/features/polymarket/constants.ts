import { getSolidColorEquivalent } from '@/worklets/colors';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';

export const POLYGON_USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
export const POLYMARKET_CTF_ADDRESS = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';

const RAINBOW_POLYMARKET_PROXY_URL = 'https://platform.p.rainbow.me/v1/polymarket';
export const POLYMARKET_CLOB_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/clob`;
export const POLYMARKET_RELAYER_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/relayer`;
export const POLYMARKET_SIGNING_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/sign`;
export const POLYMARKET_CLOB_URL = 'https://clob.polymarket.com';

export const BUILDER_CONFIG = new BuilderConfig({
  remoteBuilderConfig: { url: POLYMARKET_SIGNING_PROXY_URL },
});

export const POLYMARKET_GAMMA_API_URL = 'https://gamma-api.polymarket.com';
export const POLYMARKET_DATA_API_URL = 'https://data-api.polymarket.com';

export const POLYMARKET_OUTCOME = {
  YES: 'Yes',
  NO: 'No',
} as const;

export const POLYMARKET_ACCENT_COLOR = '#C55DE7';

export const POLYMARKET_BACKGROUND_DARK = getSolidColorEquivalent({ background: '#000000', foreground: '#1D0E20', opacity: 0.4 });
export const POLYMARKET_BACKGROUND_LIGHT = '#FFFFFF';

export const POLYMARKET_TOKEN_ID_SUFFIX = 'polymarket';

export const POLYMARKET_SPORTS_MARKET_TYPE = {
  SPREADS: 'spreads',
  TOTALS: 'totals',
  TEAM_TOTALS: 'team_totals',
  MONEYLINE: 'moneyline',
  FIRST_HALF_SPREADS: 'first_half_spreads',
  FIRST_HALF_TOTALS: 'first_half_totals',
  FIRST_HALF_MONEYLINE: 'first_half_moneyline',
  // Nested moneyline (eg. map specific in esports)
  // Example: "Counter-Strike: Venom vs ARCRED - Map 2 Winner"
  CHILD_MONEYLINE: 'child_moneyline',
  // Exclusive to soccer
  BOTH_TEAMS_TO_SCORE: 'both_teams_to_score',
} as const;
