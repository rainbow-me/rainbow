import {
  assets,
  prices,
  send,
  settings,
  transactions,
} from 'balance-common';
import { combineReducers } from 'redux';

import imageDimensionsCache from './imageDimensionsCache';
import isWalletEmpty from './isWalletEmpty';
import navigation from './navigation';
import nonce from './nonce';
import tracking from './tracking';
import transactionsToApprove from './transactionsToApprove';
import walletconnect from './walletconnect';

export default combineReducers({
  assets,
  imageDimensionsCache,
  isWalletEmpty,
  navigation,
  nonce,
  prices,
  send,
  settings,
  tracking,
  transactions,
  transactionsToApprove,
  walletconnect,
});
