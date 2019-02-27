import {
  assets,
  prices,
  send,
  settings,
  transactions,
} from '@rainbow-me/rainbow-common';
import { combineReducers } from 'redux';

import actionSheetManager from './actionSheetManager';
import imageDimensionsCache from './imageDimensionsCache';
import isWalletEmpty from './isWalletEmpty';
import navigation from './navigation';
import initialFetch from './initialFetch';
import nonce from './nonce';
import transactionsToApprove from './transactionsToApprove';
import walletconnect from './walletconnect';

export default combineReducers({
  actionSheetManager,
  assets,
  imageDimensionsCache,
  initialFetch,
  isWalletEmpty,
  navigation,
  nonce,
  prices,
  send,
  settings,
  transactions,
  transactionsToApprove,
  walletconnect,
});
