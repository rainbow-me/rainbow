import {
  concat,
  filter,
  get,
  includes,
  keys,
  map,
  mapValues,
  partition,
  sortBy,
  toLower,
  values,
} from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import {
  uniswapGetAllExchanges,
  uniswapUpdateFavorites,
} from '../redux/uniswap';
import withAccountData from './withAccountData';

const allAssetsSelector = state => state.allAssets;
const uniswapFavoritesSelector = state => state.favorites;
const uniswapPairsSelector = state => state.pairs;
const uniswapAllPairsSelector = state => state.allPairs;

const filterUniswapAssetsByAvailability = uniswapAssetAddresses => ({
  address,
}) => uniswapAssetAddresses.includes(address);

const includeExchangeAddress = uniswapPairs => asset => ({
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

const withUniswapAssets = (
  curatedUniswapAssets,
  globalUniswapAssets,
  favorites
) => {
  const {
    globalFavorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
  } = getGlobalUniswapAssets(globalUniswapAssets, favorites);

  const { curatedAssets, curatedFavorites } = getCuratedUniswapAssets(
    curatedUniswapAssets,
    favorites
  );
  const combinedFavorites = concat(globalFavorites, curatedFavorites);
  const sortedFavorites = sortBy(combinedFavorites, ({ name }) =>
    toLower(name)
  );

  return {
    curatedAssets,
    favorites: sortedFavorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
  };
};

const getGlobalUniswapAssets = (assets, favorites) => {
  const assetsWithAddress = mapValues(assets, (value, key) => ({
    ...value,
    address: key,
  }));
  const sorted = sortBy(values(assetsWithAddress), ({ name }) => toLower(name));
  const [favorited, notFavorited] = partition(sorted, ({ address }) =>
    includes(map(favorites, toLower), toLower(address))
  );
  const [highLiquidity, lowLiquidity] = partition(
    notFavorited,
    ({ ethBalance }) => ethBalance > 0.5
  );

  return {
    globalFavorites: map(favorited, appendFavoriteKey),
    globalHighLiquidityAssets: highLiquidity,
    globalLowLiquidityAssets: lowLiquidity,
  };
};

const getCuratedUniswapAssets = (assets, favorites) => {
  const assetsWithAddress = mapValues(assets, (value, key) => ({
    ...value,
    address: key,
  }));
  const sorted = sortBy(values(assetsWithAddress), ({ name }) => toLower(name));
  const [favorited, notFavorited] = partition(sorted, ({ address }) =>
    includes(map(favorites, toLower), toLower(address))
  );

  return {
    curatedAssets: notFavorited,
    curatedFavorites: map(favorited, appendFavoriteKey),
  };
};

const withUniswapAssetsInWalletSelector = createSelector(
  [allAssetsSelector, uniswapPairsSelector],
  withUniswapAssetsInWallet
);

const withUniswapAssetsSelector = createSelector(
  [uniswapPairsSelector, uniswapAllPairsSelector, uniswapFavoritesSelector],
  withUniswapAssets
);

const mapStateToProps = ({ uniswap: { allPairs, favorites, pairs } }) => ({
  allPairs,
  favorites,
  pairs,
});

export default compose(
  connect(mapStateToProps, { uniswapGetAllExchanges, uniswapUpdateFavorites }),
  withAccountData,
  withProps(withUniswapAssetsSelector),
  withProps(withUniswapAssetsInWalletSelector)
);
