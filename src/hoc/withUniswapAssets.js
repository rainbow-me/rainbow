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
const uniswapAssetsSelector = state => state.uniswapAssets;
export const uniswapAssetsRawLoweredKeys = mapKeys(uniswapAssetsRaw, (value, key) => toLower(key));
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

const mapStateToProps = ({
  uniswap: { uniswapAssets },
}) => ({
  uniswapAssets,
});


export default compose(
  connect(mapStateToProps),
  withAccountData,
  withProps(withSortedUniswapAssetsSelector),
  withProps(withAssetsAvailableOnUniswapSelector),
);

