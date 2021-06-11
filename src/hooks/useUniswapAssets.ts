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
import { RainbowToken } from '@rainbow-me/entities';

const uniswapLoadingAllTokensSelector = (state: AppState) =>
  state.uniswap.loadingAllTokens;
const uniswapCuratedTokensSelector = (state: AppState) => state.uniswap.pairs;
const uniswapFavoritesSelector = (state: AppState): string[] =>
  state.uniswap.favorites;
const uniswapAllTokensSelector = (state: AppState) => state.uniswap.allTokens;

const appendFavoriteKey = (asset: RainbowToken) => ({
  ...asset,
  favorite: true,
});

const withUniswapAssets = (
  loadingAllTokens: boolean,
  curatedUniswapAssets: Record<string, RainbowToken>,
  globalAssets: Record<string, RainbowToken>,
  favorites: string[]
): {
  curatedNotFavorited: RainbowToken[];
  favorites: RainbowToken[];
  globalHighLiquidityAssets: RainbowToken[];
  globalLowLiquidityAssets: RainbowToken[];
  globalVerifiedAssets: RainbowToken[];
  loadingAllTokens: boolean;
} => {
  const sorted = sortBy(values(globalAssets), ({ name }) => toLower(name));

  const [favorited, notFavorited] = partition(sorted, ({ address }) =>
    includes(map(favorites, toLower), toLower(address))
  );

  const [globalVerifiedAssets, unverifiedAssets] = partition(
    notFavorited,
    'isVerified'
  );

  const [globalHighLiquidityAssets, globalLowLiquidityAssets] = partition(
    unverifiedAssets,
    'highLiquidity'
  );
  const curatedNotFavorited = filter(globalVerifiedAssets, 'isRainbowCurated');

  return {
    curatedNotFavorited,
    favorites: map(favorited, appendFavoriteKey),
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    globalVerifiedAssets,
    loadingAllTokens,
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
