import { getSolidColorEquivalent } from '@/worklets/colors';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';

export const POLYGON_USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
export const POLYMARKET_CTF_ADDRESS = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';

const RAINBOW_POLYMARKET_PROXY_URL = 'https://polymarket-test.s.rainbow.me';
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
