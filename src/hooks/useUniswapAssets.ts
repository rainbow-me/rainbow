import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import { uniswapUpdateFavorites } from '../redux/uniswap';
import { RainbowToken } from '@rainbow-me/entities';
import { getUniswapV2Tokens } from '@rainbow-me/handlers/dispersion';
import logger from 'logger';

const uniswapCuratedTokensSelector = (state: AppState) => state.uniswap.pairs;
const uniswapFavoritesSelector = (state: AppState): string[] =>
  state.uniswap.favorites;

const appendFavoriteKey = (asset: RainbowToken) => ({
  ...asset,
  favorite: true,
});

export default function useUniswapAssets() {
  const dispatch = useDispatch();
  const curatedAssets = useSelector(uniswapCuratedTokensSelector);
  const favoriteAddresses = useSelector(uniswapFavoritesSelector);
  const curatedNotFavorited = Object.values(curatedAssets).filter(
    ({ address }) => !favoriteAddresses.includes(address)
  );
  const [favorites, setFavorites] = useState<RainbowToken[]>([]);
  const getUniswapFavorites = useCallback(async () => {
    const uniswapFavorites = await getUniswapV2Tokens(
      favoriteAddresses.map(a => a.toLowerCase())
    );
    setFavorites(uniswapFavorites);
  }, [favoriteAddresses]);
  const updateFavorites = useCallback(
    (...data) => dispatch(uniswapUpdateFavorites(...data)),
    [dispatch]
  );

  useEffect(() => {
    getUniswapFavorites();
  }, [getUniswapFavorites]);

  logger.debug('FAVORITES: ', favorites);
  // logger.debug('CURATED: ', curatedNotFavorited);

  return {
    curatedNotFavorited,
    favorites: favorites.map(appendFavoriteKey),
    updateFavorites,
  };
}
