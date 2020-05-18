import analytics from '@segment/analytics-react-native';
import { captureException, captureMessage } from '@sentry/react-native';
import { find, get, map, toLower } from 'lodash';
import {
  getPurchaseTransactions,
  savePurchaseTransactions,
} from '../handlers/localstorage/accountLocal';
import { trackWyreOrder, trackWyreTransfer } from '../handlers/wyre';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import TransactionTypes from '../helpers/transactionTypes';
import { WYRE_ORDER_STATUS_TYPES } from '../helpers/wyreStatusTypes';
import { AddCashCurrencies, AddCashCurrencyInfo } from '../references';
import { ethereumUtils, logger } from '../utils';
/* eslint-disable-next-line import/no-cycle */
import { dataAddNewTransaction } from './data';

// -- Constants --------------------------------------- //
const ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS =
  'addCash/ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS';

const ADD_CASH_UPDATE_CURRENT_ORDER_STATUS =
  'addCash/ADD_CASH_UPDATE_CURRENT_ORDER_STATUS';

const ADD_CASH_UPDATE_CURRENT_TRANSFER_ID =
  'addCash/ADD_CASH_UPDATE_CURRENT_TRANSFER_ID';

const ADD_CASH_RESET_CURRENT_ORDER = 'addCash/ADD_CASH_RESET_CURRENT_ORDER';

const ADD_CASH_ORDER_CREATION_FAILURE =
  'addCash/ADD_CASH_ORDER_CREATION_FAILURE';

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

export const addCashGetOrderStatus = (
  referenceInfo,
  destCurrency,
  orderId,
  paymentResponse,
  sourceAmount
) => async (dispatch, getState) => {
  logger.log('[add cash] - watch for order status', orderId);
  const { network } = getState().settings;
  const getOrderStatus = async (
    referenceInfo,
    destCurrency,
    orderId,
    paymentResponse,
    sourceAmount
  ) => {
    try {
      const { data, orderStatus, transferId } = await trackWyreOrder(
        referenceInfo,
        orderId,
        network
      );

      dispatch({
        payload: orderStatus,
        type: ADD_CASH_UPDATE_CURRENT_ORDER_STATUS,
      });

      const isFailed = orderStatus === WYRE_ORDER_STATUS_TYPES.failed;

      if (isFailed) {
        logger.sentry('Wyre order data failed', data);
        captureMessage(
          `Wyre final check - order status failed - ${referenceInfo.referenceId}`
        );
        analytics.track('Purchase failed', {
          category: 'add cash',
          error_category: get(data, 'errorCategory', 'unknown'),
          error_code: get(data, 'errorCode', 'unknown'),
        });
      }

      if (transferId) {
        dispatch({
          payload: transferId,
          type: ADD_CASH_UPDATE_CURRENT_TRANSFER_ID,
        });
        referenceInfo.transferId = transferId;
        dispatch(
          addCashGetTransferHash(referenceInfo, transferId, sourceAmount)
        );
        analytics.track('Purchase completed', {
          category: 'add cash',
        });
      } else if (!isFailed) {
        setTimeout(
          () =>
            getOrderStatus(
              referenceInfo,
              destCurrency,
              orderId,
              paymentResponse,
              sourceAmount
            ),
          1000
        );
      }
    } catch (error) {
      captureException(error);
      setTimeout(
        () =>
          getOrderStatus(
            referenceInfo,
            destCurrency,
            orderId,
            paymentResponse,
            sourceAmount
          ),
        1000
      );
    }
  };

  await getOrderStatus(
    referenceInfo,
    destCurrency,
    orderId,
    paymentResponse,
    sourceAmount
  );
};

const addCashGetTransferHash = (
  referenceInfo,
  transferId,
  sourceAmount
) => async (dispatch, getState) => {
  logger.log('[add cash] - watch for transfer hash');
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
        logger.log('[add cash] - Wyre transfer hash', transferHash);
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
        logger.log('[add cash] - add new pending txn');
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

export const addCashResetCurrentOrder = () => dispatch =>
  dispatch({
    type: ADD_CASH_RESET_CURRENT_ORDER,
  });

export const addCashOrderCreationFailure = () => dispatch =>
  dispatch({
    type: ADD_CASH_ORDER_CREATION_FAILURE,
  });

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  currentOrderStatus: null,
  currentTransferId: null,
  purchaseTransactions: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ADD_CASH_RESET_CURRENT_ORDER:
      return {
        ...state,
        currentOrderStatus: null,
        currentTransferId: null,
      };
    case ADD_CASH_ORDER_CREATION_FAILURE:
      return {
        ...state,
        currentOrderStatus: WYRE_ORDER_STATUS_TYPES.failed,
      };
    case ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS:
      return {
        ...state,
        purchaseTransactions: action.payload,
      };
    case ADD_CASH_UPDATE_CURRENT_ORDER_STATUS:
      return {
        ...state,
        currentOrderStatus: action.payload,
      };
    case ADD_CASH_UPDATE_CURRENT_TRANSFER_ID:
      return {
        ...state,
        currentTransferId: action.payload,
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
