import _ from 'lodash';
import { parseNewTransaction } from '../parsers/newTransaction';
import {
  getLocalTransactions,
  saveLocalTransactions,
  removeLocalTransactions,
} from '../handlers/commonStorage';

// -- Constants ------------------------------------------------------------- //
const TRANSACTIONS_UPDATE_HAS_PENDING_TRANSACTION = 'transactions/TRANSACTIONS_UPDATE_HAS_PENDING_TRANSACTION';

const TRANSACTIONS_ADD_NEW_TRANSACTION_REQUEST = 'transactions/TRANSACTIONS_ADD_NEW_TRANSACTION_REQUEST';
const TRANSACTIONS_ADD_NEW_TRANSACTION_SUCCESS = 'transactions/TRANSACTIONS_ADD_NEW_TRANSACTION_SUCCESS';
const TRANSACTIONS_ADD_NEW_TRANSACTION_FAILURE = 'transactions/TRANSACTIONS_ADD_NEW_TRANSACTION_FAILURE';

const CLEAR_STATE = 'transactions/CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
let getTransactionsInterval = null;

export const transactionsUpdateHasPendingTransaction = (hasPending = true) => dispatch => {
  dispatch({
    type: TRANSACTIONS_UPDATE_HAS_PENDING_TRANSACTION,
    payload: hasPending,
  });
};

export const transactionsAddNewTransaction = txDetails => (dispatch, getState) => new Promise((resolve, reject) => {
  dispatch({ type: TRANSACTIONS_ADD_NEW_TRANSACTION_REQUEST });
  const { transactions } = getState().transactions;
  const { accountAddress, nativeCurrency, network } = getState().settings;
  parseNewTransaction(txDetails, nativeCurrency)
    .then(parsedTransaction => {
      let _transactions = [parsedTransaction, ...transactions];
      saveLocalTransactions(accountAddress, _transactions, network);
      dispatch({
        type: TRANSACTIONS_ADD_NEW_TRANSACTION_SUCCESS,
        payload: _transactions,
      });
      resolve(true);
    })
    .catch(error => {
      dispatch({ type: TRANSACTIONS_ADD_NEW_TRANSACTION_FAILURE });
      reject(false);
    });
});

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_STATE = {
  pendingTransactions: [],
  hasPendingTransaction: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case TRANSACTIONS_ADD_NEW_TRANSACTION_REQUEST:
      return { ...state, hasPendingTransaction: true };
    case TRANSACTIONS_ADD_NEW_TRANSACTION_SUCCESS:
      return {
        ...state,
        pendingTransactions: action.payload,
      };
    case TRANSACTIONS_ADD_NEW_TRANSACTION_FAILURE:
      return {
        ...state,
        hasPendingTransaction: false,
      };
    case TRANSACTIONS_UPDATE_HAS_PENDING_TRANSACTION:
      return { ...state, hasPendingTransaction: action.payload };
    case CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
