import { mapKeys, mapValues, toLower } from 'lodash';
import tokenOverridesFallback from './token-overrides.json';
import uniswapAssetsFallback from './uniswap-pairs.json';

export const DefaultUniswapFavorites = {
  mainnet: [
    // Ethereum
    'eth',
    // DAI
    '0x6b175474e89094c44da98b954eedeac495271d0f',
    // SOCKS
    '0x23B608675a2B2fB1890d3ABBd85c5775c51691d5',
  ],
  rinkeby: [
    // Ethereum
    'eth',
    // DAI
    '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea',
  ],
};

export const loweredTokenOverridesFallback = mapKeys(
  tokenOverridesFallback,
  (_, address) => toLower(address)
);

const loweredUniswapAssetsFallback = mapKeys(
  uniswapAssetsFallback,
  (value, key) => toLower(key)
);

export const cleanUniswapAssetsFallback = mapValues(
  loweredUniswapAssetsFallback,
  (value, key) => ({
    ...value,
    ...loweredTokenOverridesFallback[key],
  })
);

export const shitcoinBlacklist = {
  mainnet: [
    '0xc12d1c73ee7dc3615ba4e37e4abfdbddfa38907e', // KickToken (KICK)
    '0xdbadabe39b91f2069e27291add14a1d95e3ff54f', // betbeb.com空投1万个ETH (BEB)
    '0xf222ba8af81d799c565241b0d3eedf9bdc4fc462', // betbeb.com空投1万个ETH (BEB)
  ],
};
