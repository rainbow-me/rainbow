import {
  filter,
  keys,
  map,
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

const uniswapAssetAddresses = map(keys(uniswapAssetsRaw), toLower);
const filterUniswapAssetsByAvailability = ({ address }) => uniswapAssetAddresses.includes(address);
const withAssetsAvailableOnUniswap = (allAssets) => ({
  assetsAvailableOnUniswap: filter(allAssets, filterUniswapAssetsByAvailability),
});

const mapUniswapAssetItem = ({ exchange_address, ...asset }, address) => ({
  ...asset,
  address,
  exchange_address,
  uniqueId: exchange_address,
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

