import {
  concat,
  filter,
  get,
  includes,
  map,
  partition,
  sortBy,
  toLower,
  values,
} from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import { uniswapUpdateFavorites } from '../redux/uniswap';
import { uniswapAssetAddresses, uniswapAssetsClean } from '../references';
import withAccountData from './withAccountData';

const allAssetsSelector = state => state.allAssets;
const uniswapAssetsSelector = state => state.uniswapAssets;
const uniswapFavoritesSelector = state => state.favorites;

const filterUniswapAssetsByAvailability = ({ address }) =>
  uniswapAssetAddresses.includes(address);

export const includeExchangeAddress = asset => ({
  ...asset,
  exchangeAddress: get(
    uniswapAssetsClean,
    `[${toLower(asset.address)}].exchangeAddress`
  ),
});

const lowerAssetName = asset => toLower(asset.name);

const includeFavorite = asset => ({
  ...asset,
  favorite: true,
});

const withAssetsAvailableOnUniswap = allAssets => {
  const availableAssets = filter(allAssets, filterUniswapAssetsByAvailability);
  const assetsAvailableOnUniswap = map(availableAssets, includeExchangeAddress);
  return { assetsAvailableOnUniswap };
};

const withSortedUniswapAssets = (unsortedUniswapAssets, favorites) => {
  const sortedAssets = sortBy(values(unsortedUniswapAssets), lowerAssetName);
  const [favoriteAssets, remainingAssets] = partition(sortedAssets, asset =>
    includes(favorites, asset.address)
  );
  const labeledFavorites = map(favoriteAssets, includeFavorite);
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
  connect(mapStateToProps, { uniswapUpdateFavorites }),
  withAccountData,
  withProps(withSortedUniswapAssetsSelector),
  withProps(withAssetsAvailableOnUniswapSelector)
);
