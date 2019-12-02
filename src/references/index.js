import { keys, mapKeys, mapValues, toLower } from 'lodash';
import tokenOverridesFallback from './token-overrides.json';
import uniswapAssetsFallback from './uniswap-pairs.json';

export const loweredTokenOverridesFallback = mapKeys(
  tokenOverridesFallback,
  (_, address) => toLower(address)
);

const uniswapAssetsRawLoweredKeys = mapKeys(
  uniswapAssetsFallback,
  (value, key) => toLower(key)
);

export const uniswapAssetsClean = mapValues(
  uniswapAssetsRawLoweredKeys,
  (value, key) => ({
    ...value,
    ...loweredTokenOverridesFallback[key],
  })
);

export const uniswapAssetAddresses = keys(uniswapAssetsRawLoweredKeys);
