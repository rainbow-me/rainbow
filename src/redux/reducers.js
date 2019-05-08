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
import nonce from './nonce';
import transactionsToApprove from './transactionsToApprove';
import walletconnect from './walletconnect';
import selectedWithFab from './selectedWithFab';

export default combineReducers({
  actionSheetManager,
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
