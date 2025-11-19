import { BuilderConfig } from '@polymarket/builder-signing-sdk';

export const POLYGON_USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
export const POLYMARKET_CTF_ADDRESS = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045';

const RAINBOW_POLYMARKET_PROXY_URL = 'http://51.20.106.209';
export const POLYMARKET_CLOB_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/clob`;
export const POLYMARKET_RELAYER_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/relayer`;
export const POLYMARKET_SIGNING_PROXY_URL = `${RAINBOW_POLYMARKET_PROXY_URL}/sign`;
export const POLYMARKET_CLOB_URL = 'https://clob.polymarket.com';

export const BUILDER_CONFIG = new BuilderConfig({
  remoteBuilderConfig: { url: POLYMARKET_SIGNING_PROXY_URL },
});

export const POLYMARKET_GAMMA_API_URL = 'https://gamma-api.polymarket.com';
export const POLYMARKET_DATA_API_URL = 'https://data-api.polymarket.com';
