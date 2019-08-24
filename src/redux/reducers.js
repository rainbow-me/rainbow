import { combineReducers } from 'redux';

import actionSheetManager from './actionSheetManager';
import data from './data';
import imageDimensionsCache from './imageDimensionsCache';
import isWalletEmpty from './isWalletEmpty';
import isWalletEthZero from './isWalletEthZero';
import isWalletImporting from './isWalletImporting';
import keyboardFocusHistory from './keyboardFocusHistory';
import keyboardHeight from './keyboardHeight';
import navigation from './navigation';
import nonce from './nonce';
import openFamilyTabs from './openFamilyTabs';
import requests from './requests';
import selectedWithFab from './selectedWithFab';
import send from './send';
import settings from './settings';
import uniqueTokens from './uniqueTokens';
import uniswap from './uniswap';
import walletconnect from './walletconnect';

export default combineReducers({
  actionSheetManager,
  data,
  imageDimensionsCache,
  isWalletEmpty,
  isWalletEthZero,
  isWalletImporting,
  keyboardFocusHistory,
  keyboardHeight,
  navigation,
  nonce,
  openFamilyTabs,
  requests,
  selectedWithFab,
  send,
  settings,
  uniqueTokens,
  uniswap,
  walletconnect,
});
