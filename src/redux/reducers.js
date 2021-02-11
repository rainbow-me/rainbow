import { combineReducers } from 'redux';

import addCash from './addCash';
import appState from './appState';
import charts from './charts';
import contacts from './contacts';
import data from './data';
import editOptions from './editOptions';
import explorer from './explorer';
import fallbackExplorer from './fallbackExplorer';
import gas from './gas';
import imageMetadata from './imageMetadata';
import keyboardHeight from './keyboardHeight';
import multicall from './multicall';
import openStateSettings, {
  openSavingsReducer,
  openSmallBalancesReducer,
} from './openStateSettings';
import requests from './requests';
import settings from './settings';
import showcaseTokens from './showcaseTokens';
import swap from './swap';
import uniqueTokens from './uniqueTokens';
import uniswap from './uniswap';
import uniswapLiquidity from './uniswapLiquidity';
import walletconnect from './walletconnect';
import wallets from './wallets';

export default combineReducers({
  addCash,
  appState,
  charts,
  contacts,
  data,
  editOptions,
  explorer,
  fallbackExplorer,
  gas,
  imageMetadata,
  keyboardHeight,
  multicall,
  openSavings: openSavingsReducer,
  openSmallBalances: openSmallBalancesReducer,
  openStateSettings,
  requests,
  settings,
  showcaseTokens,
  swap,
  uniqueTokens,
  uniswap,
  uniswapLiquidity,
  walletconnect,
  wallets,
});
