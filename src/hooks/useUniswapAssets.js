import {
  concat,
  includes,
  map,
  mapValues,
  partition,
  sortBy,
  toLower,
  values,
} from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { greaterThanOrEqualTo, multiply } from '../helpers/utilities';
import { uniswapUpdateFavorites } from '../redux/uniswap';

const uniswapLoadingAllTokensSelector = state => state.uniswap.loadingAllTokens;
const uniswapFavoritesSelector = state => state.uniswap.favorites;
const uniswapPairsSelector = state => state.uniswap.pairs;
const uniswapAllTokensSelector = state => state.uniswap.allTokens;

const appendFavoriteKey = asset => ({
  ...asset,
  favorite: true,
});

const appendAssetWithUniqueId = asset => ({
  ...asset,
  uniqueId: `${asset.address}`,
});

const normalizeAssetItems = assetsArray =>
  map(assetsArray, appendAssetWithUniqueId);

const withUniswapAssets = (
  loadingAllTokens,
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
    curatedAssets: normalizeAssetItems(curatedAssets),
    favorites: normalizeAssetItems(sortedFavorites),
    globalHighLiquidityAssets: normalizeAssetItems(globalHighLiquidityAssets),
    globalLowLiquidityAssets: normalizeAssetItems(globalLowLiquidityAssets),
    loadingAllTokens,
  };
};

const getGlobalUniswapAssets = (assets, favorites) => {
  const sorted = sortBy(values(assets), ({ name }) => toLower(name));
  const [favorited, notFavorited] = partition(sorted, ({ address }) =>
    includes(map(favorites, toLower), toLower(address))
  );
  const [highLiquidity, lowLiquidity] = partition(
    notFavorited,
    ({ derivedETH, totalLiquidity }) => {
      return (
        derivedETH &&
        greaterThanOrEqualTo(multiply(derivedETH, totalLiquidity), 0.5)
      );
    }
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

const withUniswapAssetsSelector = createSelector(
  [
    uniswapLoadingAllTokensSelector,
    uniswapPairsSelector,
    uniswapAllTokensSelector,
    uniswapFavoritesSelector,
  ],
  withUniswapAssets
);

export default function useUniswapAssets() {
  const dispatch = useDispatch();
  const uniswapAssets = useSelector(withUniswapAssetsSelector);

  const updateFavorites = useCallback(
    (...data) => dispatch(uniswapUpdateFavorites(...data)),
    [dispatch]
  );

  return {
    updateFavorites,
    ...uniswapAssets,
  };
}
