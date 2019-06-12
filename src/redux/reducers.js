import {
  assets,
  prices,
  send,
  settings,
  transactions,
} from '@rainbow-me/rainbow-common';
import { combineReducers } from 'redux';

import actionSheetManager from './actionSheetManager';
import openFamilyTabs from './openFamilyTabs';
import imageDimensionsCache from './imageDimensionsCache';
import isWalletEmpty from './isWalletEmpty';
import navigation from './navigation';
import nonce from './nonce';
import transactionsToApprove from './transactionsToApprove';
import walletconnect from './walletconnect';
import selectedWithFab from './selectedWithFab';

export default combineReducers({
  actionSheetManager,
  openFamilyTabs,
  assets,
  imageDimensionsCache,
  isWalletEmpty,
  navigation,
  nonce,
  prices,
  selectedWithFab,
  send,
  settings,
  transactions,
  transactionsToApprove,
  walletconnect,
});
