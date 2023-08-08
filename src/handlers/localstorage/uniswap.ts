import {
  EthereumAddress,
  RainbowToken,
  UniswapFavoriteTokenData,
} from '../../entities';
import {
  DefaultUniswapFavorites,
  DefaultUniswapFavoritesMeta,
} from '../../references';
import {
  getAccountLocal,
  getGlobal,
  saveAccountLocal,
  saveGlobal,
} from './common';
import { Network } from '@/helpers/networkTypes';

const ASSETS = 'uniswapassets';
const UNISWAP_POSITIONS = 'uniswapPositions';
const UNISWAP_FAVORITES = 'uniswapFavorites';
const UNISWAP_FAVORITES_METADATA = 'uniswapFavoritesMetadata';
const uniswapPositionsVersion = '0.1.0';
const uniswapFavoritesMetadataVersion = '0.1.0';

export const uniswapAccountLocalKeys = [ASSETS, UNISWAP_POSITIONS];

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

export const getUniswapPositions = (accountAddress: any, network: Network) =>
  getAccountLocal(
    UNISWAP_POSITIONS,
    accountAddress,
    network,
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
    {},
    uniswapPositionsVersion
  );

export const saveUniswapPositions = (
  positions: any,
  accountAddress: any,
  network: Network
) =>
  saveAccountLocal(
    UNISWAP_POSITIONS,
    positions,
    accountAddress,
    network,
    uniswapPositionsVersion
  );

export const getUniswapAssets = (accountAddress: any, network: Network) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
  getAccountLocal(ASSETS, accountAddress, network, {});

export const saveUniswapAssets = (
  assets: any,
  accountAddress: any,
  network: Network
) => saveAccountLocal(ASSETS, assets, accountAddress, network);
