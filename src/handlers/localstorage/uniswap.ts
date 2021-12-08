import { DefaultUniswapFavorites } from '../../references';
import {
  getAccountLocal,
  getGlobal,
  saveAccountLocal,
  saveGlobal,
} from './common';

const ASSETS = 'uniswapassets';
const LIQUIDITY = 'uniswapliquidity';
const UNISWAP_POSITIONS = 'uniswapPositions';
const UNISWAP_FAVORITES = 'uniswapFavorites';
const uniswapLiquidityVersion = '0.2.0';
const uniswapPositionsVersion = '0.1.0';

export const uniswapAccountLocalKeys = [ASSETS, LIQUIDITY, UNISWAP_POSITIONS];

export const getUniswapFavorites = (network: any) =>
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  getGlobal(UNISWAP_FAVORITES, DefaultUniswapFavorites[network]);

export const saveUniswapFavorites = (favorites: any) =>
  saveGlobal(UNISWAP_FAVORITES, favorites);

export const getUniswapPositions = (accountAddress: any, network: any) =>
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
  network: any
) =>
  saveAccountLocal(
    UNISWAP_POSITIONS,
    positions,
    accountAddress,
    network,
    uniswapPositionsVersion
  );

export const getLiquidity = (accountAddress: any, network: any) =>
  getAccountLocal(
    LIQUIDITY,
    accountAddress,
    network,
    [],
    uniswapLiquidityVersion
  );

export const saveLiquidity = (
  liquidity: any,
  accountAddress: any,
  network: any
) =>
  saveAccountLocal(
    LIQUIDITY,
    liquidity,
    accountAddress,
    network,
    uniswapLiquidityVersion
  );

export const getUniswapAssets = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
  getAccountLocal(ASSETS, accountAddress, network, {});

export const saveUniswapAssets = (
  assets: any,
  accountAddress: any,
  network: any
) => saveAccountLocal(ASSETS, assets, accountAddress, network);
