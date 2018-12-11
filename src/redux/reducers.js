import { account, send } from 'balance-common';
import { combineReducers } from 'redux';

import imageDimensionsCache from './imageDimensionsCache';
import navigation from './navigation';
import nonce from './nonce';
import tracking from './tracking';
import transactionsToApprove from './transactionsToApprove';
import walletconnect from './walletconnect';

export default combineReducers({
  account,
  imageDimensionsCache,
  navigation,
  nonce,
  send,
  tracking,
  transactionsToApprove,
  walletconnect,
});
