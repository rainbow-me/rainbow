import {
  filter,
  get,
  keys,
  map,
  mapKeys,
  mapValues,
  property,
  sortBy,
  toLower,
  values,
} from 'lodash';
import { compose, omitProps, withProps } from 'recompact';
import { createSelector } from 'reselect';
import uniswapAssetsRaw from '../references/uniswap-pairs.json';
import withAccountData from './withAccountData';

const allAssetsSelector = state => state.allAssets;
const unsortedUniswapAssetsSelector = state => state.unsortedUniswapAssets;

const uniswapAssetsRawLoweredKeys = mapKeys(uniswapAssetsRaw, (value, key) => toLower(key));

export const uniswapAssetAddresses = keys(uniswapAssetsRawLoweredKeys);
const filterUniswapAssetsByAvailability = ({ address }) => uniswapAssetAddresses.includes(address);

const withAssetsAvailableOnUniswap = (allAssets) => {
  const availableAssets = filter(allAssets, filterUniswapAssetsByAvailability);
  const assetsAvailableOnUniswap = map(availableAssets, (asset) => ({
    ...asset,
    exchangeAddress: get(uniswapAssetsRawLoweredKeys, `${asset.address}.exchangeAddress`),
  }));
  return { assetsAvailableOnUniswap };
};

const mapUniswapAssetItem = ({ exchangeAddress, ...asset }, address) => ({
  ...asset,
  address,
  exchangeAddress,
  uniqueId: exchangeAddress,
});

const unsortedUniswapAssets = values(mapValues(uniswapAssetsRaw, mapUniswapAssetItem));
const withSortedUniswapAssets = (unsortedUniswapAssets) => ({
  sortedUniswapAssets: sortBy(unsortedUniswapAssets, property('name')),
});

const withAssetsAvailableOnUniswapSelector = createSelector(
  [allAssetsSelector],
  withAssetsAvailableOnUniswap,
);

const withSortedUniswapAssetsSelector = createSelector(
  [unsortedUniswapAssetsSelector],
  withSortedUniswapAssets,
);

export default compose(
  withAccountData,
  withProps({ unsortedUniswapAssets }),
  withProps(withSortedUniswapAssetsSelector),
  withProps(withAssetsAvailableOnUniswapSelector),
  omitProps('unsortedUniswapAssets'),
);

