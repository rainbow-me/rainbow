import {
  filter,
  includes,
  isEmpty,
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
import { RainbowToken, UniswapSubgraphAsset } from '@rainbow-me/entities';
import { greaterThanOrEqualTo, multiply } from '@rainbow-me/utilities';

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
  globalUniswapAssets: Record<string, UniswapSubgraphAsset>,
  favorites: string[]
): {
  curatedNotFavorited: RainbowToken[];
  favorites: RainbowToken[];
  globalHighLiquidityAssets: RainbowToken[];
  globalLowLiquidityAssets: RainbowToken[];
  globalVerifiedHighLiquidityAssets: RainbowToken[];
  loadingAllTokens: boolean;
} => {
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
    curatedNotFavorited: !isEmpty(curatedNotFavorited)
      ? curatedNotFavorited
      : curatedAssets,
    favorites: !isEmpty(globalFavorites) ? globalFavorites : curatedFavorites,
    globalHighLiquidityAssets: globalHighLiquidityAssets,
    globalLowLiquidityAssets: globalLowLiquidityAssets,
    globalVerifiedHighLiquidityAssets: globalVerifiedHighLiquidityAssets,
    loadingAllTokens,
  };
};

const getGlobalUniswapAssets = (
  assets: Record<string, UniswapSubgraphAsset>,
  favorites: string[]
): {
  curatedNotFavorited: RainbowToken[];
  globalFavorites: RainbowToken[];
  globalHighLiquidityAssets: RainbowToken[];
  globalLowLiquidityAssets: RainbowToken[];
  globalVerifiedHighLiquidityAssets: RainbowToken[];
} => {
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

const getCuratedUniswapAssets = (
  assets: Record<string, RainbowToken>,
  favorites: string[]
): {
  curatedAssets: RainbowToken[];
  curatedFavorites: RainbowToken[];
} => {
  const sorted = sortBy(values(assets), ({ name }) => toLower(name));
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
