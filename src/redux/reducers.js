import { combineReducers } from 'redux';

import actionSheetManager from './actionSheetManager';
import assets from './assets';
import data from './data';
import imageDimensionsCache from './imageDimensionsCache';
import isWalletEmpty from './isWalletEmpty';
import navigation from './navigation';
import nonce from './nonce';
import send from './send';
import settings from './settings';
import transactions from './transactions';
import transactionsToApprove from './transactionsToApprove';
import walletconnect from './walletconnect';

export default combineReducers({
  actionSheetManager,
  assets,
  data,
  imageDimensionsCache,
  isWalletEmpty,
  navigation,
  nonce,
  send,
  settings,
  transactions,
  transactionsToApprove,
  walletconnect,
});
