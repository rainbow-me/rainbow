import {
  keys,
  mapKeys,
  mapValues,
  toLower,
} from 'lodash';
import tokenOverrides from './token-overrides.json';
import uniswapAssetsRaw from './uniswap-pairs.json';

export const loweredTokenOverrides = mapKeys(
  tokenOverrides,
  (value, address) => toLower(address),
);

const uniswapAssetsRawLoweredKeys = mapKeys(
  uniswapAssetsRaw,
  (value, key) => toLower(key),
);

export const uniswapAssetsClean = mapValues(
  uniswapAssetsRawLoweredKeys,
  (value, key) => ({
    ...value,
    ...loweredTokenOverrides[key],
  }),
);

export const uniswapAssetAddresses = keys(uniswapAssetsRawLoweredKeys);
