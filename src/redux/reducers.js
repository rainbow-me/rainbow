import { account, send } from 'balance-common';
import { combineReducers } from 'redux';

import navigation from './navigation';
import transactionsToApprove from './transactionsToApprove';
import walletconnect from './walletconnect';

export default combineReducers({
  account,
  navigation,
  send,
  transactionsToApprove,
  walletconnect,
});
