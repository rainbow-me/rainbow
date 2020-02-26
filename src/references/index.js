import { mapKeys, mapValues, toLower } from 'lodash';
import tokenOverridesFallback from './token-overrides.json';
import uniswapAssetsFallback from './uniswap-pairs.json';
import savingAssets from './saving-assets.json';

export const CDAI_CONTRACT = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';
export const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const SOCKS_ADDRESS = '0x23B608675a2B2fB1890d3ABBd85c5775c51691d5';

export const DefaultUniswapFavorites = ['eth', DAI_ADDRESS, SOCKS_ADDRESS];

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

export const savingsAssetsList = savingAssets;
