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
import openStateSettings from './openStateSettings';
import requests from './requests';
import settings from './settings';
import showcaseTokens from './showcaseTokens';
import swap from './swap';
import topMovers from './topMovers';
import uniqueTokens from './uniqueTokens';
import uniswap from './uniswap';
import uniswapLiquidity from './uniswapLiquidity';
import userLists from './userLists';
import usersPositions from './usersPositions';
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
  openStateSettings,
  requests,
  settings,
  showcaseTokens,
  swap,
  topMovers,
  uniqueTokens,
  uniswap,
  uniswapLiquidity,
  userLists,
  usersPositions,
  walletconnect,
  wallets,
});
