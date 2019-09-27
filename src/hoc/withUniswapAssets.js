import { filter, get, map, property, sortBy, values } from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import { uniswapAssetAddresses, uniswapAssetsClean } from '../references';
import withAccountData from './withAccountData';

const allAssetsSelector = state => state.allAssets;
const uniswapAssetsSelector = state => state.uniswapAssets;

const filterUniswapAssetsByAvailability = ({ address }) =>
  uniswapAssetAddresses.includes(address);

const withAssetsAvailableOnUniswap = allAssets => {
  const availableAssets = filter(allAssets, filterUniswapAssetsByAvailability);
  const assetsAvailableOnUniswap = map(availableAssets, asset => ({
    ...asset,
    exchangeAddress: get(
      uniswapAssetsClean,
      `${asset.address}.exchangeAddress`
    ),
  }));
  return { assetsAvailableOnUniswap };
};

const withSortedUniswapAssets = unsortedUniswapAssets => ({
  sortedUniswapAssets: sortBy(values(unsortedUniswapAssets), property('name')),
});

const withAssetsAvailableOnUniswapSelector = createSelector(
  [allAssetsSelector],
  withAssetsAvailableOnUniswap
);

const withSortedUniswapAssetsSelector = createSelector(
  [uniswapAssetsSelector],
  withSortedUniswapAssets
);

const mapStateToProps = ({ uniswap: { uniswapAssets } }) => ({ uniswapAssets });

export default compose(
  connect(mapStateToProps),
  withAccountData,
  withProps(withSortedUniswapAssetsSelector),
  withProps(withAssetsAvailableOnUniswapSelector)
);
