import {
  concat,
  filter,
  get,
  indexOf,
  map,
  partition,
  property,
  sortBy,
  values,
} from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import { uniswapAssetAddresses, uniswapAssetsClean } from '../references';
import withAccountData from './withAccountData';

const allAssetsSelector = state => state.allAssets;
const uniswapAssetsSelector = state => state.uniswapAssets;
const uniswapFavoritesSelector = state => state.favorites;

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

const withSortedUniswapAssets = (unsortedUniswapAssets, favorites) => {
  const sortedAssets = sortBy(values(unsortedUniswapAssets), property('name'));
  const [favoriteAssets, remainingAssets] = partition(
    sortedAssets,
    asset => indexOf(favorites, asset.address) > -1
  );
  const labeledFavorites = map(favoriteAssets, asset => ({
    ...asset,
    favorite: true,
  }));
  return {
    sortedUniswapAssets: concat(labeledFavorites, remainingAssets),
  };
};

const withAssetsAvailableOnUniswapSelector = createSelector(
  [allAssetsSelector],
  withAssetsAvailableOnUniswap
);

const withSortedUniswapAssetsSelector = createSelector(
  [uniswapAssetsSelector, uniswapFavoritesSelector],
  withSortedUniswapAssets
);

const mapStateToProps = ({ uniswap: { favorites, uniswapAssets } }) => ({
  favorites,
  uniswapAssets,
});

export default compose(
  connect(mapStateToProps),
  withAccountData,
  withProps(withSortedUniswapAssetsSelector),
  withProps(withAssetsAvailableOnUniswapSelector)
);
