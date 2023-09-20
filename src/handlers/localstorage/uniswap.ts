import {
  EthereumAddress,
  RainbowToken,
  UniswapFavoriteTokenData,
} from '../../entities';
import {
  DefaultUniswapFavorites,
  DefaultUniswapFavoritesMeta,
} from '../../references';
import { getGlobal, saveGlobal } from './common';
import { Network } from '@/helpers/networkTypes';

const UNISWAP_FAVORITES = 'uniswapFavorites';
const UNISWAP_FAVORITES_METADATA = 'uniswapFavoritesMetadata';
const uniswapFavoritesMetadataVersion = '0.1.0';

export const getUniswapFavorites = (
  network: Network
): Promise<EthereumAddress[]> =>
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  getGlobal(UNISWAP_FAVORITES, DefaultUniswapFavorites[network]);

export const saveUniswapFavorites = (favorites: any) =>
  saveGlobal(UNISWAP_FAVORITES, favorites);

export const getUniswapFavoritesMetadata = (
  network: Network = Network.mainnet
): Promise<UniswapFavoriteTokenData> =>
  getGlobal(
    UNISWAP_FAVORITES_METADATA,
    DefaultUniswapFavoritesMeta[network],
    uniswapFavoritesMetadataVersion
  );

export const saveUniswapFavoritesMetadata = (
  data: Record<EthereumAddress, RainbowToken>
) =>
  saveGlobal(UNISWAP_FAVORITES_METADATA, data, uniswapFavoritesMetadataVersion);
