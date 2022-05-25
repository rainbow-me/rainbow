import analytics from '@segment/analytics-react-native';
import { captureException, captureMessage } from '@sentry/react-native';
import { map, toLower } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { dataAddNewTransaction } from './data';
import { AppGetState, AppState } from './store';
import {
  NewTransactionOrAddCashTransaction,
  ParsedAddressAsset,
  RainbowTransaction,
  TransactionStatus,
  TransactionType,
} from '@rainbow-me/entities';
import {
  getPurchaseTransactions,
  savePurchaseTransactions,
} from '@rainbow-me/handlers/localstorage/accountLocal';
import { trackWyreOrder, trackWyreTransfer } from '@rainbow-me/handlers/wyre';
import {
  WYRE_ORDER_STATUS_TYPES,
  WyreError,
  WyreOrderStatusType,
  WyreReferenceInfo,
} from '@rainbow-me/helpers/wyreStatusTypes';
import {
  AddCashCurrencies,
  AddCashCurrencyAsset,
  AddCashCurrencyInfo,
} from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import maybeReviewAlert from '@rainbow-me/utils/reviewAlert';
import logger from 'logger';

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

const ADD_CASH_ORDER_FAILURE = 'addCash/ADD_CASH_ORDER_FAILURE';

const ADD_CASH_CLEAR_STATE = 'addCash/ADD_CASH_CLEAR_STATE';

// -- Actions ---------------------------------------- //

/**
 * Represents the state of the `addCash` reducer.
 */
interface AddCashState {
  /**
   * The status of the current Wyre order.
   */
  currentOrderStatus: null | WyreOrderStatusType;

  /**
   * The current Wyre transfer ID.
   */
  currentTransferId: null | string;

  /**
   * The current Wyre transfer or order error, if there is one.
   */
  error: {} | WyreError;

  /**
   * An array of past transactions.
   */
  purchaseTransactions: RainbowTransaction[];
}

/**
 * An action for the `addCash` reducer.
 */
type AddCashAction =
  | AddCashUpdatePurchaseTransactionsAction
  | AddCashClearStateAction
  | AddCashOrderFailureAction
  | AddCashUpdateCurrentOrderStatus
  | AddCashUpdateCurrentTransferId
  | AddCashResetCurrentOrderAction
  | AddCashOrderCreationFailureAction;

/**
 * The action for updating the `purchaseTransactions` field.
 */
interface AddCashUpdatePurchaseTransactionsAction {
  type: typeof ADD_CASH_UPDATE_PURCHASE_TRANSACTIONS;
  payload: RainbowTransaction[];
}

/**
 * The action for clearing the `addCash` state.
 */
interface AddCashClearStateAction {
  type: typeof ADD_CASH_CLEAR_STATE;
}

/**
 * The action used when a Wyre error is received.
 */
interface AddCashOrderFailureAction {
  type: typeof ADD_CASH_ORDER_FAILURE;
  payload: WyreError;
}

/**
 * The action for updating the Wyre order status.
 */
interface AddCashUpdateCurrentOrderStatus {
  type: typeof ADD_CASH_UPDATE_CURRENT_ORDER_STATUS;
  payload: WyreOrderStatusType;
}

/**
 * The action for updating the Wyre transfer ID.
 */
interface AddCashUpdateCurrentTransferId {
  type: typeof ADD_CASH_UPDATE_CURRENT_TRANSFER_ID;
  payload: string;
}

/**
 * The action for resetting the current Wyre order.
 */
interface AddCashResetCurrentOrderAction {
  type: typeof ADD_CASH_RESET_CURRENT_ORDER;
}

/**
 * The action used when Wyre order creation fails.
 */
interface AddCashOrderCreationFailureAction {
  type: typeof ADD_CASH_ORDER_CREATION_FAILURE;
  payload: WyreError;
}

/**
 * The ID for a timeout that fetches the order status, or null.
 */
let orderStatusHandle: null | ReturnType<typeof setTimeout> = null;

/**
 * The ID for a timeout that fetches a transfer hash, or null.
 */
let transferHashHandle: null | ReturnType<typeof setTimeout> = null;

const MAX_TRIES = 10 * 60;
const MAX_ERROR_TRIES = 3;

/**
 * Loads past purchase transactions into the reducer's state from local storage.
 */
export const addCashLoadState = () => async (
  dispatch: Dispatch<AddCashUpdatePurchaseTransactionsAction>,
  getState: AppGetState
) => {
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

/**
 * Resets the reducer's state and clears any saved timeouts.
 */
export const addCashClearState = () => (
  dispatch: Dispatch<AddCashClearStateAction>
) => {
  orderStatusHandle && clearTimeout(orderStatusHandle);
  transferHashHandle && clearTimeout(transferHashHandle);
  dispatch({ type: ADD_CASH_CLEAR_STATE });
};

/**
 * Updates purchase transactions in state.
 *
 * @param purchases An array of updated purchase transactions to compare
 * against the current transactions in state.
 */
export const addCashUpdatePurchases = (purchases: RainbowTransaction[]) => (
  dispatch: Dispatch<AddCashUpdatePurchaseTransactionsAction>,
  getState: AppGetState
) => {
  const { purchaseTransactions } = getState().addCash;
  const { accountAddress, network } = getState().settings;

  const updatedPurchases = map(purchaseTransactions, txn => {
    if (txn.status === TransactionStatus.purchasing) {
      const updatedPurchase = purchases.find(
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

/**
 * Adds a new purchase transaction to state.
 *
 * @param txDetails The new purchase transaction.
 */
const addCashNewPurchaseTransaction = (txDetails: RainbowTransaction) => (
  dispatch: Dispatch<AddCashUpdatePurchaseTransactionsAction>,
  getState: AppGetState
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

/**
 * Fetches an order's status and updates the state.
 *
 * @param referenceInfo The `WyreReferenceInfo` for the order.
 * @param destCurrency The destination curreny.
 * @param orderId The Wyre order ID.
 * @param paymentResponse The Wyre payment response.
 * @param sourceAmount The source amount.
 */
export const addCashGetOrderStatus = (
  referenceInfo: WyreReferenceInfo,
  destCurrency: string,
  orderId: string,
  paymentResponse: any,
  sourceAmount: string
) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    | AddCashUpdateCurrentOrderStatus
    | AddCashOrderFailureAction
    | AddCashUpdateCurrentTransferId
  >,
  getState: AppGetState
) => {
  logger.log('[add cash] - watch for order status', orderId);
  const { accountAddress, network } = getState().settings;
  const getOrderStatus = async (
    referenceInfo: WyreReferenceInfo,
    destCurrency: string,
    orderId: string,
    paymentResponse: any,
    sourceAmount: string,
    remainingTries = MAX_TRIES,
    remainingErrorTries = MAX_ERROR_TRIES
  ) => {
    try {
      if (remainingTries === 0) return;
      const { data, orderStatus, transferId } = await trackWyreOrder(
        referenceInfo,
        orderId,
        network
      );

      const { accountAddress: currentAccountAddress } = getState().settings;
      if (currentAccountAddress !== accountAddress) return;

      dispatch({
        payload: orderStatus,
        type: ADD_CASH_UPDATE_CURRENT_ORDER_STATUS,
      });

      const isFailed = orderStatus === WYRE_ORDER_STATUS_TYPES.failed;

      if (isFailed) {
        const { errorCategory, errorCode, errorMessage } = data;
        dispatch({
          payload: {
            errorCategory,
            errorCode,
            errorMessage,
          },
          type: ADD_CASH_ORDER_FAILURE,
        });
        logger.sentry('Wyre order data failed', data);
        captureMessage(
          `Wyre final check - order status failed - ${referenceInfo.referenceId}`
        );
        analytics.track('Purchase failed', {
          category: 'add cash',
          error_category: errorCategory,
          error_code: errorCode,
          error_message: errorMessage,
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
        maybeReviewAlert();
      } else if (!isFailed) {
        orderStatusHandle = setTimeout(
          () =>
            getOrderStatus(
              referenceInfo,
              destCurrency,
              orderId,
              paymentResponse,
              sourceAmount,
              remainingTries - 1,
              remainingErrorTries
            ),
          1000
        );
      }
    } catch (error) {
      captureException(error);
      if (remainingErrorTries === 0) return;
      orderStatusHandle = setTimeout(
        () =>
          getOrderStatus(
            referenceInfo,
            destCurrency,
            orderId,
            paymentResponse,
            sourceAmount,
            remainingTries,
            remainingErrorTries - 1
          ),
        5000
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

/**
 * Fetches a transaction's hash and updates state.
 *
 * @param referenceInfo The `WyreReferenceInfo`.
 * @param transferId The Wyre transfer ID.
 * @param sourceAmount The source amount.
 */
const addCashGetTransferHash = (
  referenceInfo: WyreReferenceInfo,
  transferId: string,
  sourceAmount: string
) => async (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  logger.log('[add cash] - watch for transfer hash');
  const { accountAddress, network } = getState().settings;
  const getTransferHash = async (
    referenceInfo: WyreReferenceInfo,
    transferId: string,
    sourceAmount: string,
    remainingTries = MAX_TRIES,
    remainingErrorTries = MAX_ERROR_TRIES
  ) => {
    try {
      if (remainingTries === 0) return;
      const {
        destAmount,
        destCurrency,
        transferHash,
      } = await trackWyreTransfer(referenceInfo, transferId, network);

      const { accountAddress: currentAccountAddress } = getState().settings;
      if (currentAccountAddress !== accountAddress) return;

      const destAssetAddress = toLower(
        AddCashCurrencies[network]?.[destCurrency]
      );

      if (transferHash) {
        logger.log('[add cash] - Wyre transfer hash', transferHash);
        let asset:
          | ParsedAddressAsset
          | undefined
          | AddCashCurrencyAsset = ethereumUtils.getAccountAsset(
          destAssetAddress
        );
        if (!asset) {
          asset = AddCashCurrencyInfo[network]![destAssetAddress];
        }
        const txDetails: NewTransactionOrAddCashTransaction = {
          amount: destAmount,
          asset,
          from: null,
          hash: transferHash,
          nonce: null,
          sourceAmount,
          status: TransactionStatus.purchasing,
          timestamp: Date.now(),
          to: accountAddress,
          transferId,
          type: TransactionType.purchase,
        };
        logger.log('[add cash] - add new pending txn');
        const newTxDetails = await dispatch(dataAddNewTransaction(txDetails));
        dispatch(addCashNewPurchaseTransaction(newTxDetails!));
      } else {
        transferHashHandle = setTimeout(
          () =>
            getTransferHash(
              referenceInfo,
              transferId,
              sourceAmount,
              remainingTries - 1,
              remainingErrorTries
            ),
          1000
        );
      }
    } catch (error) {
      if (remainingErrorTries === 0) return;
      transferHashHandle = setTimeout(
        () =>
          getTransferHash(
            referenceInfo,
            transferId,
            sourceAmount,
            remainingTries,
            remainingErrorTries - 1
          ),
        5000
      );
    }
  };
  await getTransferHash(referenceInfo, transferId, sourceAmount);
};

/**
 * Resets the current order in state.
 */
export const addCashResetCurrentOrder = () => (
  dispatch: Dispatch<AddCashResetCurrentOrderAction>
) =>
  dispatch({
    type: ADD_CASH_RESET_CURRENT_ORDER,
  });

/**
 * Updates state to include a new order-creation error.
 */
export const addCashOrderCreationFailure = (error: WyreError) => (
  dispatch: Dispatch<AddCashOrderCreationFailureAction>
) =>
  dispatch({
    payload: error,
    type: ADD_CASH_ORDER_CREATION_FAILURE,
  });

// -- Reducer ----------------------------------------- //

const INITIAL_STATE: AddCashState = {
  currentOrderStatus: null,
  currentTransferId: null,
  error: {},
  purchaseTransactions: [],
};

export default (
  state: AddCashState = INITIAL_STATE,
  action: AddCashAction
): AddCashState => {
  switch (action.type) {
    case ADD_CASH_RESET_CURRENT_ORDER:
      return {
        ...state,
        currentOrderStatus: null,
        currentTransferId: null,
        error: {},
      };
    case ADD_CASH_ORDER_CREATION_FAILURE:
      return {
        ...state,
        currentOrderStatus: WYRE_ORDER_STATUS_TYPES.failed,
        error: action.payload,
      };
    case ADD_CASH_ORDER_FAILURE:
      return {
        ...state,
        error: action.payload,
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
