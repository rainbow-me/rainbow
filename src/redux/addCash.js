import { find, map, toLower } from 'lodash';
import {
  getPurchaseTransactions,
  savePurchaseTransactions,
} from '../handlers/localstorage/accountLocal';
import { trackWyreTransfer } from '../handlers/wyre';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import TransactionTypes from '../helpers/transactionTypes';
import { AddCashCurrencies, AddCashCurrencyInfo } from '../references';
import { ethereumUtils, logger } from '../utils';
/* eslint-disable-next-line import/no-cycle */
import { dataAddNewTransaction } from './data';

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
        purchase =>
          ethereumUtils.getHash(purchase) === ethereumUtils.getHash(txn)
      );
      if (updatedPurchase) {
        return {
          ...txn,
          ...updatedPurchase,
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

export const addCashGetTransferHash = (
  referenceInfo,
  transferId,
  sourceAmount
) => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { assets } = getState().data;
  const getTransferHash = async (referenceInfo, transferId, sourceAmount) => {
    try {
      const {
        destAmount,
        destCurrency,
        transferHash,
      } = await trackWyreTransfer(referenceInfo, transferId, network);

      const destAssetAddress = toLower(
        AddCashCurrencies[network][destCurrency]
      );

      if (transferHash) {
        logger.log('Wyre transfer hash', transferHash);
        let asset = ethereumUtils.getAsset(assets, destAssetAddress);
        if (!asset) {
          asset = AddCashCurrencyInfo[network][destAssetAddress];
        }
        const txDetails = {
          amount: destAmount,
          asset,
          from: null,
          hash: transferHash,
          nonce: null,
          sourceAmount,
          status: TransactionStatusTypes.purchasing,
          timestamp: Date.now(),
          to: accountAddress,
          transferId,
          type: TransactionTypes.purchase,
        };
        const newTxDetails = await dispatch(
          dataAddNewTransaction(txDetails),
          false
        );
        dispatch(addCashNewPurchaseTransaction(newTxDetails));
      } else {
        setTimeout(
          () => getTransferHash(referenceInfo, transferId, sourceAmount),
          1000
        );
      }
    } catch (error) {
      setTimeout(
        () => getTransferHash(referenceInfo, transferId, sourceAmount),
        1000
      );
    }
  };
  await getTransferHash(referenceInfo, transferId, sourceAmount);
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
