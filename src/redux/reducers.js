import { account } from 'balance-common';
import { combineReducers } from 'redux';

import transactions from './transactions/reducer';
import transactionsToApprove from './transactionsToApprove';

export default combineReducers({
  account,
  transactions,
  transactionsToApprove,
});
