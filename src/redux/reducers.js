import { combineReducers } from 'redux';

import actionSheetManager from './actionSheetManager';
import data from './data';
import imageDimensionsCache from './imageDimensionsCache';
import isWalletEmpty from './isWalletEmpty';
import navigation from './navigation';
import nonce from './nonce';
import openFamilyTabs from './openFamilyTabs';
import openInvestmentCards from './openInvestmentCards';
import requests from './requests';
import selectedWithFab from './selectedWithFab';
import send from './send';
import settings from './settings';
import uniswap from './uniswap';
import uniqueTokens from './uniqueTokens';
import walletconnect from './walletconnect';

export default combineReducers({
  actionSheetManager,
  data,
  imageDimensionsCache,
  isWalletEmpty,
  navigation,
  nonce,
  openFamilyTabs,
  openInvestmentCards,
  requests,
  selectedWithFab,
  send,
  settings,
  uniqueTokens,
  uniswap,
  walletconnect,
});
