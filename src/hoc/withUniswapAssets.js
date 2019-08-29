import {
  filter,
  get,
  keys,
  map,
  mapKeys,
  property,
  sortBy,
  toLower,
  values,
} from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import uniswapAssetsRaw from '../references/uniswap-pairs.json';
import withAccountData from './withAccountData';

const allAssetsSelector = state => state.allAssets;
const uniswapAssetsSelector = state => state.uniswapAssets;

export const uniswapAssetsRawLoweredKeys = mapKeys(uniswapAssetsRaw, (value, key) => toLower(key));
export const uniswapAssetAddresses = keys(uniswapAssetsRawLoweredKeys);

const filterUniswapAssetsByAvailability = ({ address }) => uniswapAssetAddresses.includes(address);

const mapUniswapAssetItem = (asset) => {
  const exchangeAddress = get(uniswapAssetsRawLoweredKeys, `${asset.address}.exchangeAddress`);

  return {
    ...asset,
    exchangeAddress,
    uniqueId: exchangeAddress,
  };
};

const withAssetsAvailableOnUniswap = (allAssets) => {
  const availableAssets = filter(allAssets, filterUniswapAssetsByAvailability);
  return { assetsAvailableOnUniswap: map(availableAssets, mapUniswapAssetItem) };
};

const withSortedUniswapAssets = (unsortedUniswapAssets) => ({
  sortedUniswapAssets: sortBy(values(unsortedUniswapAssets), property('name')),
});

const withAssetsAvailableOnUniswapSelector = createSelector(
  [allAssetsSelector],
  withAssetsAvailableOnUniswap,
);

const withSortedUniswapAssetsSelector = createSelector(
  [uniswapAssetsSelector],
  withSortedUniswapAssets,
);

const mapStateToProps = ({ uniswap: { uniswapAssets } }) => ({ uniswapAssets });

export default compose(
  connect(mapStateToProps),
  withAccountData,
  withProps(withSortedUniswapAssetsSelector),
  withProps(withAssetsAvailableOnUniswapSelector),
);
