import {
  filter,
  includes,
  map,
  partition,
  sortBy,
  toLower,
  values,
} from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { AppState } from '../redux/store';
import { uniswapUpdateFavorites } from '../redux/uniswap';
import { Asset, UniswapSubgraphAsset } from '@rainbow-me/entities';
import { greaterThanOrEqualTo, multiply } from '@rainbow-me/utilities';

const uniswapLoadingAllTokensSelector = (state: AppState) =>
  state.uniswap.loadingAllTokens;
const uniswapCuratedTokensSelector = (state: AppState) => state.uniswap.pairs;
const uniswapFavoritesSelector = (state: AppState): string[] =>
  state.uniswap.favorites;
const uniswapAllTokensSelector = (state: AppState) => state.uniswap.allTokens;

const appendFavoriteKey = (asset: Asset) => ({
  ...asset,
  favorite: true,
});

const withUniswapAssets = (
  loadingAllTokens: boolean,
  curatedUniswapAssets: Record<string, RainbowToken>,
  globalUniswapAssets: Record<string, UniswapSubgraphAsset>,
  favorites: string[]
) => {
  const {
    curatedNotFavorited,
    globalFavorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    globalVerifiedHighLiquidityAssets,
  } = getGlobalUniswapAssets(globalUniswapAssets, favorites);

  const { curatedAssets, curatedFavorites } = getCuratedUniswapAssets(
    curatedUniswapAssets,
    favorites
  );

  return {
    curatedAssets,
    curatedFavorites,
    curatedNotFavorited,
    favorites: globalFavorites,
    globalHighLiquidityAssets: globalHighLiquidityAssets,
    globalLowLiquidityAssets: globalLowLiquidityAssets,
    globalVerifiedHighLiquidityAssets: globalVerifiedHighLiquidityAssets,
    loadingAllTokens,
  };
};

const getGlobalUniswapAssets = (
  assets: Record<string, UniswapSubgraphAsset>,
  favorites: string[]
) => {
  const sorted = sortBy(values(assets), ({ name }) => toLower(name));

  const [favorited, notFavorited] = partition(sorted, ({ address }) =>
    includes(map(favorites, toLower), toLower(address))
  );

  const curatedNotFavorited = filter(notFavorited, 'isRainbowCurated');

  const [highLiquidity, lowLiquidity] = partition(
    notFavorited,
    ({ derivedETH, totalLiquidity }) => {
      return (
        derivedETH &&
        greaterThanOrEqualTo(multiply(derivedETH, totalLiquidity), 0.5)
      );
    }
  );

  const [
    globalVerifiedHighLiquidityAssets,
    globalHighLiquidityAssets,
  ] = partition(highLiquidity, 'isVerified');

  return {
    curatedNotFavorited,
    globalFavorites: map(favorited, appendFavoriteKey),
    globalHighLiquidityAssets,
    globalLowLiquidityAssets: lowLiquidity,
    globalVerifiedHighLiquidityAssets,
  };
};

const appendAssetWithUniqueId = asset => ({
  ...asset,
  uniqueId: `${asset.address}`,
});

const normalizeAssetItems = assetsArray =>
  map(assetsArray, appendAssetWithUniqueId);

const getCuratedUniswapAssets = (assets, favorites) => {
  const sorted = sortBy(values(assets), ({ name }) => toLower(name));
  const [favorited, notFavorited] = partition(sorted, ({ address }) =>
    includes(map(favorites, toLower), toLower(address))
  );

  return {
    curatedAssets: normalizeAssetItems(notFavorited),
    curatedFavorites: normalizeAssetItems(map(favorited, appendFavoriteKey)),
  };
};

const withUniswapAssetsSelector = createSelector(
  [
    uniswapLoadingAllTokensSelector,
    uniswapCuratedTokensSelector,
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
