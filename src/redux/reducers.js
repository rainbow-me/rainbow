import { combineReducers } from 'redux';

import actionSheetManager from './actionSheetManager';
import data from './data';
import explorer from './explorer';
import gas from './gas';
import imageDimensionsCache from './imageDimensionsCache';
import isWalletEmpty from './isWalletEmpty';
import isWalletEthZero from './isWalletEthZero';
import isWalletImporting from './isWalletImporting';
import keyboardHeight from './keyboardHeight';
import navigation from './navigation';
import nonce from './nonce';
import openStateSettings from './openStateSettings';
import requests from './requests';
import selectedInput from './selectedInput';
import selectedWithFab from './selectedWithFab';
import send from './send';
import settings from './settings';
import uniqueTokens from './uniqueTokens';
import uniswap from './uniswap';
import walletconnect from './walletconnect';

export default combineReducers({
  actionSheetManager,
  data,
  explorer,
  gas,
  imageDimensionsCache,
  isWalletEmpty,
  isWalletEthZero,
  isWalletImporting,
  keyboardHeight,
  navigation,
  nonce,
  openStateSettings,
  requests,
  selectedInput,
  selectedWithFab,
  send,
  settings,
  uniqueTokens,
  uniswap,
  walletconnect,
});
