import { combineReducers } from 'redux';

import actionSheetManager from './actionSheetManager';
import data from './data';
import imageDimensionsCache from './imageDimensionsCache';
import isWalletEmpty from './isWalletEmpty';
import navigation from './navigation';
import nonce from './nonce';
import openFamilyTabs from './openFamilyTabs';
import requests from './requests';
import send from './send';
import settings from './settings';
import uniswap from './uniswap';
import uniqueTokens from './uniqueTokens';
import walletconnect from './walletconnect';
import selectedWithFab from './selectedWithFab';

export default combineReducers({
  actionSheetManager,
  openFamilyTabs,
  data,
  imageDimensionsCache,
  isWalletEmpty,
  navigation,
  nonce,
  requests,
  selectedWithFab,
  send,
  settings,
  uniqueTokens,
  uniswap,
  walletconnect,
});
