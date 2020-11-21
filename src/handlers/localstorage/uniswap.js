import { DefaultUniswapFavorites } from '../../references';
import {
  getAccountLocal,
  getGlobal,
  saveAccountLocal,
  saveGlobal,
} from './common';

const ASSETS = 'uniswapassets';
const LIQUIDITY = 'uniswapliquidity';
const LIQUIDITY_INFO = 'uniswap';
const UNISWAP_FAVORITES = 'uniswapFavorites';

const uniswapLiquidityVersion = '0.2.0';
const uniswapLiquidityInfoVersion = '0.2.1';

export const uniswapAccountLocalKeys = [ASSETS, LIQUIDITY, LIQUIDITY_INFO];

export const getUniswapFavorites = network =>
  getGlobal(UNISWAP_FAVORITES, DefaultUniswapFavorites[network]);

export const saveUniswapFavorites = favorites =>
  saveGlobal(UNISWAP_FAVORITES, favorites);

export const getUniswapLiquidityInfo = (accountAddress, network) =>
  getAccountLocal(
    LIQUIDITY_INFO,
    accountAddress,
    network,
    {},
    uniswapLiquidityInfoVersion
  );

export const saveLiquidityInfo = (liquidityInfo, accountAddress, network) =>
  saveAccountLocal(
    LIQUIDITY_INFO,
    liquidityInfo,
    accountAddress,
    network,
    uniswapLiquidityInfoVersion
  );

export const getLiquidity = (accountAddress, network) =>
  getAccountLocal(LIQUIDITY, accountAddress, network, uniswapLiquidityVersion);

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
