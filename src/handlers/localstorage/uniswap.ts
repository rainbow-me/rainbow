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

export const getUniswapFavorites = network =>
  getGlobal(UNISWAP_FAVORITES, DefaultUniswapFavorites[network]);

export const saveUniswapFavorites = favorites =>
  saveGlobal(UNISWAP_FAVORITES, favorites);

export const getUniswapPositions = (accountAddress, network) =>
  getAccountLocal(
    UNISWAP_POSITIONS,
    accountAddress,
    network,
    {},
    uniswapPositionsVersion
  );

export const saveUniswapPositions = (positions, accountAddress, network) =>
  saveAccountLocal(
    UNISWAP_POSITIONS,
    positions,
    accountAddress,
    network,
    uniswapPositionsVersion
  );

export const getLiquidity = (accountAddress, network) =>
  getAccountLocal(
    LIQUIDITY,
    accountAddress,
    network,
    [],
    uniswapLiquidityVersion
  );

export const saveLiquidity = (liquidity, accountAddress, network) =>
  saveAccountLocal(
    LIQUIDITY,
    liquidity,
    accountAddress,
    network,
    uniswapLiquidityVersion
  );

export const getUniswapAssets = (accountAddress, network) =>
  getAccountLocal(ASSETS, accountAddress, network, {});

export const saveUniswapAssets = (assets, accountAddress, network) =>
  saveAccountLocal(ASSETS, assets, accountAddress, network);
