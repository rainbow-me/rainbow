import { account, send } from 'balance-common';
import { combineReducers } from 'redux';

import transactionsToApprove from './transactionsToApprove';
import walletconnect from './nodes/walletconnect/reducer';

export default combineReducers({
  account,
  send,
  transactionsToApprove,
  walletconnect,
});
