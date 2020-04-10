import { map } from 'lodash';
import {
  getPurchaseTransactions,
  savePurchaseTransactions,
} from '../handlers/localstorage/accountLocal';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';

// -- Constants --------------------------------------- //
const ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS =
  'addCash/ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS';

const ADD_CASH_CLEAR_STATE = 'addCash/ADD_CASH_CLEAR_STATE';

// -- Actions ---------------------------------------- //
export const addCashLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  try {
    const purchases = await getPurchaseTransactions(accountAddress, network);
    dispatch({
      payload: purchases,
      type: ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const addCashClearState = () => dispatch =>
  dispatch({ type: ADD_CASH_CLEAR_STATE });

export const addCashUpdatePurchases = purchases => (dispatch, getState) => {
  const { purchaseTransactions } = getState().addCash;
  const { accountAddress, network } = getState().settings;

  const updatedPurchases = map(purchaseTransactions, txn => {
    if (txn.status === TransactionStatusTypes.purchasing) {
      const updatedPurchase = find(
        purchases,
        purchase => purchase.hash === txn.hash
      );
      if (updatedPurchase) {
        return {
          ...txn,
          status: updatedPurchase.status,
        };
      }
      return txn;
    }
    return txn;
  });

  dispatch({
    payload: updatedPurchases,
    type: ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS,
  });
  savePurchaseTransactions(updatedPurchases, accountAddress, network);
};

export const addCashNewPurchaseTransaction = txDetails => (
  dispatch,
  getState
) => {
  const { purchaseTransactions } = getState().addCash;
  const { accountAddress, network } = getState().settings;
  const updatedPurchases = [txDetails, ...purchaseTransactions];
  dispatch({
    payload: updatedPurchases,
    type: ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS,
  });
  savePurchaseTransactions(updatedPurchases, accountAddress, network);
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  purchaseTransactions: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS:
      return {
        ...state,
        purchaseTransactions: action.payload,
      };
    case ADD_CASH_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
