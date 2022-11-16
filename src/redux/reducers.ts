import { combineReducers } from 'redux';

import addCash from './addCash';
import additionalAssetsData from './additionalAssetsData';
import appState from './appState';
import charts from './charts';
import contacts from './contacts';
import data from './data';
import editOptions from './editOptions';
import ensRegistration from './ensRegistration';
import explorer from './explorer';
import fallbackExplorer from './fallbackExplorer';
import gas from './gas';
import hiddenTokens from './hiddenTokens';
import imageMetadata from './imageMetadata';
import keyboardHeight from './keyboardHeight';
import nonceManager from './nonceManager';
import optimismExplorer from './optimismExplorer';
import requests from './requests';
import settings from './settings';
import showcaseTokens from './showcaseTokens';
import swap from './swap';
import transactionSignatures from './transactionSignatures';
import uniqueTokens from './uniqueTokens';
import uniswap from './uniswap';
import uniswapLiquidity from './uniswapLiquidity';
import userLists from './userLists';
import usersPositions from './usersPositions';
import walletconnect from './walletconnect';
import wallets from './wallets';

export default combineReducers({
  addCash,
  additionalAssetsData,
  appState,
  charts,
  contacts,
  data,
  editOptions,
  ensRegistration,
  explorer,
  fallbackExplorer,
  gas,
  hiddenTokens,
  imageMetadata,
  keyboardHeight,
  nonceManager,
  optimismExplorer,
  requests,
  settings,
  showcaseTokens,
  swap,
  transactionSignatures,
  uniqueTokens,
  uniswap,
  uniswapLiquidity,
  userLists,
  usersPositions,
  walletconnect,
  wallets,
});
