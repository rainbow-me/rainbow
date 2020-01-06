import {
  concat,
  filter,
  get,
  includes,
  keys,
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
import withAccountData from './withAccountData';

const allAssetsSelector = state => state.allAssets;
const uniswapAssetsSelector = state => state.uniswapAssets;
const uniswapFavoritesSelector = state => state.favorites;
const uniswapPairsSelector = state => state.pairs;

const filterUniswapAssetsByAvailability = uniswapAssetAddresses => ({
  address,
}) => uniswapAssetAddresses.includes(address);

export const includeExchangeAddress = uniswapPairs => asset => ({
  ...asset,
  exchangeAddress: get(
    uniswapPairs,
    `[${toLower(asset.address)}].exchangeAddress`
  ),
});

const appendFavoriteKey = asset => ({
  ...asset,
  favorite: true,
});

const withUniswapAssetsInWallet = (allAssets, uniswapPairs) => {
  const availableAssets = filter(
    allAssets,
    filterUniswapAssetsByAvailability(keys(uniswapPairs))
  );
  const uniswapAssetsInWallet = map(
    availableAssets,
    includeExchangeAddress(uniswapPairs)
  );
  return { uniswapAssetsInWallet };
};

const withSortedUniswapAssets = (assets, favorites) => {
  const sorted = sortBy(values(assets), ({ name }) => toLower(name));
  const [favorited, notFavorited] = partition(sorted, ({ address }) =>
    includes(map(favorites, toLower), toLower(address))
  );

  return {
    sortedUniswapAssets: concat(
      map(favorited, appendFavoriteKey),
      notFavorited
    ),
  };
};

const withUniswapAssetsInWalletSelector = createSelector(
  [allAssetsSelector, uniswapPairsSelector],
  withUniswapAssetsInWallet
);

const withSortedUniswapAssetsSelector = createSelector(
  [uniswapAssetsSelector, uniswapFavoritesSelector],
  withSortedUniswapAssets
);

const mapStateToProps = ({ uniswap: { favorites, pairs, uniswapAssets } }) => ({
  favorites,
  pairs,
  uniswapAssets,
});

export default compose(
  connect(mapStateToProps, { uniswapUpdateFavorites }),
  withAccountData,
  withProps(withSortedUniswapAssetsSelector),
  withProps(withUniswapAssetsInWalletSelector)
);
