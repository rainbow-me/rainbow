import { account, send } from 'balance-common';
import { combineReducers } from 'redux';

import navigation from './navigation';
import nonce from './nonce';
import transactionsToApprove from './transactionsToApprove';
import walletconnect from './walletconnect';

export default combineReducers({
  account,
  navigation,
  nonce,
  send,
  transactionsToApprove,
  walletconnect,
});
