import {
  concat,
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
    globalFavorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    globalVerifiedHighLiquidityAssets,
  } = parseUniswapSubgraphAssets(globalUniswapAssets, favorites);

  const { curatedFavorites, curatedNotFavorited } = parseCuratedUniswapAssets(
    curatedUniswapAssets,
    favorites
  );

  return {
    curatedNotFavorited,
    favorites: !isEmpty(globalFavorites)
      ? concat(curatedFavorites, globalFavorites)
      : curatedFavorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    globalVerifiedHighLiquidityAssets: concat(
      curatedNotFavorited,
      globalVerifiedHighLiquidityAssets
    ),
    loadingAllTokens,
  };
};

const parseUniswapSubgraphAssets = (
  globalAssets: Record<string, UniswapSubgraphAsset>,
  favorites: string[]
): {
  globalFavorites: RainbowToken[];
  globalHighLiquidityAssets: RainbowToken[];
  globalLowLiquidityAssets: RainbowToken[];
  globalVerifiedHighLiquidityAssets: RainbowToken[];
} => {
  const sorted = sortBy(values(globalAssets), ({ name }) => toLower(name));

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

  const [
    globalVerifiedHighLiquidityAssets,
    globalHighLiquidityAssets,
  ] = partition(highLiquidity, 'isVerified');

  return {
    globalFavorites: map(favorited, appendFavoriteKey),
    globalHighLiquidityAssets,
    globalLowLiquidityAssets: lowLiquidity,
    globalVerifiedHighLiquidityAssets,
  };
};

const parseCuratedUniswapAssets = (
  assets: Record<string, RainbowToken>,
  favorites: string[]
): {
  curatedNotFavorited: RainbowToken[];
  curatedFavorites: RainbowToken[];
} => {
  const sorted = sortBy(values(assets), ({ name }) => toLower(name));
  const [favorited, notFavorited] = partition(sorted, ({ address }) =>
    includes(map(favorites, toLower), toLower(address))
  );

  return {
    curatedFavorites: map(favorited, appendFavoriteKey),
    curatedNotFavorited: notFavorited,
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
