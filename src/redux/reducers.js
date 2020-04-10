import { combineReducers } from 'redux';

import actionSheetManager from './actionSheetManager';
import addCash from './addCash';
import contacts from './contacts';
import data from './data';
import explorer from './explorer';
import gas from './gas';
import imageDimensionsCache from './imageDimensionsCache';
import isWalletEmpty from './isWalletEmpty';
import isWalletEthZero from './isWalletEthZero';
import keyboardHeight from './keyboardHeight';
import navigation from './navigation';
import nonce from './nonce';
import openStateSettings from './openStateSettings';
import raps from './raps';
import requests from './requests';
import savings from './savings';
import selectedInput from './selectedInput';
import selectedWithFab from './selectedWithFab';
import settings from './settings';
import uniqueTokens from './uniqueTokens';
import uniswap from './uniswap';
import walletconnect from './walletconnect';

export default combineReducers({
  actionSheetManager,
  addCash,
  contacts,
  data,
  explorer,
  gas,
  imageDimensionsCache,
  isWalletEmpty,
  isWalletEthZero,
  keyboardHeight,
  navigation,
  nonce,
  openStateSettings,
  raps,
  requests,
  savings,
  selectedInput,
  selectedWithFab,
  settings,
  uniqueTokens,
  uniswap,
  walletconnect,
});
