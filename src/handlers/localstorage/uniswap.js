import { forEach } from 'lodash';
import { DefaultUniswapFavorites } from '../../references';
import {
  getAccountLocal,
  getGlobal,
  removeAccountLocal,
  saveAccountLocal,
  saveGlobal,
} from './common';

const ASSETS = 'uniswapassets';
const ALLOWANCES = 'uniswapallowances';
const LIQUIDITY = 'uniswapliquidity';
const LIQUIDITY_INFO = 'uniswap';
const UNISWAP_FAVORITES = 'uniswapFavorites';

const uniswapAccountLocalKeys = [ASSETS, ALLOWANCES, LIQUIDITY, LIQUIDITY_INFO];

export const getUniswapFavorites = network =>
  getGlobal(UNISWAP_FAVORITES, DefaultUniswapFavorites[network]);

export const saveUniswapFavorites = favorites =>
  saveGlobal(UNISWAP_FAVORITES, favorites);

export const getUniswapLiquidityInfo = (accountAddress, network) =>
  getAccountLocal(LIQUIDITY_INFO, accountAddress, network, {});

export const saveLiquidityInfo = (liquidityInfo, accountAddress, network) =>
  saveAccountLocal(LIQUIDITY_INFO, liquidityInfo, accountAddress, network);

export const getLiquidity = (accountAddress, network) =>
  getAccountLocal(LIQUIDITY, accountAddress, network);

export const saveLiquidity = (liquidity, accountAddress, network) =>
  saveAccountLocal(LIQUIDITY, liquidity, accountAddress, network);

export const getAllowances = (accountAddress, network) =>
  getAccountLocal(ALLOWANCES, accountAddress, network, {});

export const saveAllowances = (allowances, accountAddress, network) =>
  saveAccountLocal(ALLOWANCES, allowances, accountAddress, network);

export const getUniswapAssets = (accountAddress, network) =>
  getAccountLocal(ASSETS, accountAddress, network, {});

export const saveUniswapAssets = (assets, accountAddress, network) =>
  saveAccountLocal(ASSETS, assets, accountAddress, network);

export const removeUniswapStorage = (accountAddress, network) =>
  forEach(uniswapAccountLocalKeys, key =>
    removeAccountLocal(key, accountAddress, network)
  );
