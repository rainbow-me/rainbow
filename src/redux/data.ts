import { StaticJsonRpcProvider, TransactionResponse } from '@ethersproject/providers';
import { isEmpty, isNil, partition } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { AppGetState, AppState } from './store';
import {
  NativeCurrencyKeys,
  NewTransactionOrAddCashTransaction,
  ParsedAddressAsset,
  RainbowTransaction,
  TransactionStatus,
  ZerionAsset,
  ZerionTransaction,
} from '@/entities';
import appEvents from '@/handlers/appEvents';
import {
  getLocalPendingTransactions,
  getLocalTransactions,
  saveLocalPendingTransactions,
  saveLocalTransactions,
} from '@/handlers/localstorage/accountLocal';
import { getProviderForNetwork } from '@/handlers/web3';
import WalletTypes from '@/helpers/walletTypes';
import { Navigation } from '@/navigation';
import { triggerOnSwipeLayout } from '@/navigation/onNavigationStateChange';
import { Network } from '@/helpers/networkTypes';
import { parseAsset, parseNewTransaction, parseTransactions } from '@/parsers';
import { ETH_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import logger from '@/utils/logger';
import {
  fetchWalletENSDataAfterRegistration,
  getPendingTransactionData,
  getTransactionFlashbotStatus,
  getTransactionReceiptStatus,
  getTransactionSocketStatus,
} from '@/handlers/transactions';
import { SwapType } from '@rainbow-me/swaps';
import { logger as loggr } from '@/logger';
import { queryClient } from '@/react-query';
import { nftsQueryKey } from '@/resources/nfts';
import { nonceStore } from '@/state/nonces';

const BACKUP_SHEET_DELAY_MS = android ? 10000 : 3000;

let pendingTransactionsHandle: ReturnType<typeof setTimeout> | null = null;
const TXN_WATCHER_MAX_TRIES = 60;
const TXN_WATCHER_MAX_TRIES_LAYER_2 = 200;
const TXN_WATCHER_POLL_INTERVAL = 5000; // 5 seconds

// -- Constants --------------------------------------- //

const DATA_UPDATE_ETH_USD = 'data/DATA_UPDATE_ETH_USD';

const DATA_LOAD_TRANSACTIONS_REQUEST = 'data/DATA_LOAD_TRANSACTIONS_REQUEST';
const DATA_LOAD_TRANSACTIONS_SUCCESS = 'data/DATA_LOAD_TRANSACTIONS_SUCCESS';
const DATA_LOAD_TRANSACTIONS_FAILURE = 'data/DATA_LOAD_TRANSACTIONS_FAILURE';

export const DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS = 'data/DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS';

const DATA_CLEAR_STATE = 'data/DATA_CLEAR_STATE';

// -- Actions ---------------------------------------- //

/**
 * The state for the `data` reducer.
 */
export interface DataState {
  /**
   * The ETH price in USD.
   */
  ethUSDPrice: number | undefined | null;

  /**
   * Whether or not transactions are currently being loaded.
   */
  isLoadingTransactions: boolean;

  /**
   * Pending transactions for this account.
   */
  pendingTransactions: RainbowTransaction[];

  /**
   * Transactions for this account.
   */
  transactions: RainbowTransaction[];
}

/**
 * An action for the `data` reducer.
 */
type DataAction =
  | DataUpdateEthUsdAction
  | DataLoadTransactionsRequestAction
  | DataLoadTransactionSuccessAction
  | DataLoadTransactionsFailureAction
  | DataUpdatePendingTransactionSuccessAction
  | DataClearStateAction;

/**
 * The action to update `ethUSDPrice`.
 */
interface DataUpdateEthUsdAction {
  type: typeof DATA_UPDATE_ETH_USD;
  payload: number | undefined;
}

/**
 * The action to set `isLoadingTransactions` to `true`.
 */
interface DataLoadTransactionsRequestAction {
  type: typeof DATA_LOAD_TRANSACTIONS_REQUEST;
}

/**
 * The action used to update transactions and indicate that loading transactions
 * was successful.
 */
interface DataLoadTransactionSuccessAction {
  type: typeof DATA_LOAD_TRANSACTIONS_SUCCESS;
  payload: DataState['transactions'];
}

/**
 * The action used to indicate that loading a transaction failed.
 */
interface DataLoadTransactionsFailureAction {
  type: typeof DATA_LOAD_TRANSACTIONS_FAILURE;
}

/**
 * The action used to indicate that transactions were added successfully,
 * with a payload including the entire new array for `transactions`.
 */
interface DataUpdatePendingTransactionSuccessAction {
  type: typeof DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS;
  payload: DataState['transactions'];
}

/**
 * The action used to clear the state.
 */
interface DataClearStateAction {
  type: typeof DATA_CLEAR_STATE;
}

// Zerion types:

/**
 * A message from the Zerion API indicating that assets were received.
 */
export interface AddressAssetsReceivedMessage {
  payload?: {
    assets?: {
      [id: string]: {
        asset: ZerionAsset;
      };
    };
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that transaction data was received.
 */
export interface TransactionsReceivedMessage {
  payload?: {
    transactions?: ZerionTransaction[];
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that asset data was received. Note,
 * an actual message directly from Zerion would only include `ZerionAsset`
 * as the value type in the `prices` map, but this message type is also used
 * when manually invoking `assetPricesReceived` with fallback values.
 */
export interface AssetPricesReceivedMessage {
  payload?: {
    prices?: {
      [id: string]: ZerionAsset;
    };
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that asset prices were changed.
 */
export interface AssetPricesChangedMessage {
  payload?: {
    prices?: ZerionAsset[];
  };
  meta?: MessageMeta & { asset_code?: string };
}

/**
 * Metadata for a message from the Zerion API.
 */
export interface MessageMeta {
  address?: string;
  addresses?: string[];
  currency?: string;
  status?: string;
  chain_id?: Network; // L2
}

/**
 * A message from the Zerion API.
 */
type DataMessage = AddressAssetsReceivedMessage | TransactionsReceivedMessage | AssetPricesReceivedMessage | AssetPricesChangedMessage;

// The success code used to determine if an incoming message is successful.
export const DISPERSION_SUCCESS_CODE = 'ok';

// Functions:

/**
 * Loads initial state from account local storage.
 */
export const dataLoadState =
  () =>
  async (
    dispatch: ThunkDispatch<
      AppState,
      unknown,
      | DataLoadTransactionSuccessAction
      | DataLoadTransactionsRequestAction
      | DataLoadTransactionsFailureAction
      | DataUpdatePendingTransactionSuccessAction
    >,
    getState: AppGetState
  ) => {
    const { accountAddress, network } = getState().settings;

    try {
      dispatch({ type: DATA_LOAD_TRANSACTIONS_REQUEST });
      const transactions = await getLocalTransactions(accountAddress, network);
      const pendingTransactions = await getLocalPendingTransactions(accountAddress, network);
      const isCurrentAccountAddress = accountAddress === getState().settings.accountAddress;
      if (!isCurrentAccountAddress) return;

      dispatch({
        payload: pendingTransactions,
        type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
      });
      dispatch({
        payload: transactions,
        type: DATA_LOAD_TRANSACTIONS_SUCCESS,
      });
    } catch (error) {
      dispatch({ type: DATA_LOAD_TRANSACTIONS_FAILURE });
    }
  };

/**
 * Resets state and unsubscribes
 * from listeners and timeouts.
 */
export const dataResetState = () => (dispatch: Dispatch<DataClearStateAction>) => {
  pendingTransactionsHandle && clearTimeout(pendingTransactionsHandle);
  dispatch({ type: DATA_CLEAR_STATE });
};

/**
 * Checks whether or not metadata received from Zerion is valid.
 *
 * @param message The message received from Zerion.
 */
const checkMeta = (message: DataMessage | undefined) => (_: Dispatch<never>, getState: AppGetState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const address = message?.meta?.address || message?.meta?.addresses?.[0];
  const currency = message?.meta?.currency;
  return isLowerCaseMatch(address!, accountAddress) && isLowerCaseMatch(currency!, nativeCurrency);
};

/**
 * Checks to see if a network's nonce should be incremented for an acount
 * based on incoming transaction data, and if so, updates state.
 *
 * @param transactionData Incoming transaction data.
 */
const checkForUpdatedNonce =
  (transactionData: ZerionTransaction[]) => (dispatch: ThunkDispatch<AppState, unknown, never>, getState: AppGetState) => {
    if (transactionData.length) {
      const { accountAddress, network } = getState().settings;
      const txSortedByDescendingNonce = transactionData
        .filter(tx => {
          const addressFrom = tx?.address_from;
          return addressFrom && addressFrom.toLowerCase() === accountAddress.toLowerCase();
        })
        .sort(({ nonce: n1 }, { nonce: n2 }) => (n2 ?? 0) - (n1 ?? 0));
      const [latestTx] = txSortedByDescendingNonce;
      const addressFrom = latestTx?.address_from;
      const nonce = latestTx?.nonce;
      if (!isNil(addressFrom) && nonce) {
        const { setNonce } = nonceStore.getState();
        setNonce({ address: addressFrom, currentNonce: nonce, network });
      }
    }
  };

/**
 * Handles a `TransactionsReceivedMessage` message from Zerion and updates
 * state and account local storage accordingly.
 *
 * @param message The `TransactionsReceivedMessage`, or undefined.
 * @param appended Whether or not transactions are being appended.
 */
export const transactionsReceived =
  (message: TransactionsReceivedMessage | undefined, appended = false) =>
  async (
    dispatch: ThunkDispatch<AppState, unknown, DataLoadTransactionSuccessAction | DataUpdatePendingTransactionSuccessAction>,
    getState: AppGetState
  ) => {
    loggr.debug('transactionsReceived', {
      message: {
        ...message,
        payload: {
          transactions: message?.payload?.transactions?.length,
        },
      },
      appended,
    });

    const isValidMeta = dispatch(checkMeta(message));

    if (!isValidMeta) {
      loggr.debug('transactionsReceived: !isValidMeta', { message });
      return;
    }

    const transactionData = message?.payload?.transactions ?? [];

    const { network } = getState().settings;
    let currentNetwork = network;
    if (currentNetwork === Network.mainnet && message?.meta?.chain_id) {
      currentNetwork = message?.meta?.chain_id;
    }
    if (transactionData.length && currentNetwork === Network.mainnet) {
      loggr.debug('transactionsReceived: dispatching checkForUpdatedNonce');
      dispatch(checkForUpdatedNonce(transactionData));
    }

    const { accountAddress, nativeCurrency } = getState().settings;
    const { pendingTransactions, transactions } = getState().data;
    const { selected } = getState().wallets;

    loggr.debug('transactionsReceived: attempting to parse transactions');

    const { parsedTransactions, potentialNftTransaction } = await parseTransactions(
      transactionData,
      accountAddress,
      nativeCurrency,
      transactions,
      pendingTransactions,
      undefined,
      currentNetwork,
      appended
    );

    const isCurrentAccountAddress = accountAddress === getState().settings.accountAddress;
    if (!isCurrentAccountAddress) {
      loggr.debug('transactionsReceived: transaction accountAddress does not match current accountAddress', {
        transactionAccountAddress: accountAddress,
        currentAccountAddress: getState().settings.accountAddress,
      });
      return;
    }

    if (appended && potentialNftTransaction) {
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: nftsQueryKey({ address: accountAddress }),
        });
      }, 60000);
    }

    const txHashes = parsedTransactions.map(tx => ethereumUtils.getHash(tx));
    const updatedPendingTransactions = pendingTransactions.filter(tx => !txHashes.includes(ethereumUtils.getHash(tx)));

    dispatch({
      payload: updatedPendingTransactions,
      type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
    });
    dispatch({
      payload: parsedTransactions,
      type: DATA_LOAD_TRANSACTIONS_SUCCESS,
    });
    saveLocalTransactions(parsedTransactions, accountAddress, network);
    saveLocalPendingTransactions(updatedPendingTransactions, accountAddress, network);

    if (appended && parsedTransactions.length) {
      if (
        selected &&
        !selected.backedUp &&
        !selected.imported &&
        selected.type !== WalletTypes.readOnly &&
        selected.type !== WalletTypes.bluetooth
      ) {
        setTimeout(() => {
          triggerOnSwipeLayout(() => Navigation.handleAction(Routes.BACKUP_SHEET, { single: true }));
        }, BACKUP_SHEET_DELAY_MS);
      }
    }
  };

const callbacksOnAssetReceived: {
  [address: string]: ((asset: ParsedAddressAsset) => unknown) | undefined;
} = {};

/**
 * Saves a callback function to be called when an asset's price is loaded.
 *
 * @param address The asset's address.
 * @param action The callback.
 */
export function scheduleActionOnAssetReceived(address: string, action: (asset: ParsedAddressAsset) => unknown) {
  callbacksOnAssetReceived[address.toLowerCase()] = action;
}

/**
 * Handles a `AssetPricesReceivedMessage` from Zerion and updates state.
 *
 * @param message The message, or undefined.
 */
export const assetPricesReceived =
  (message: AssetPricesReceivedMessage | undefined) => (dispatch: Dispatch<DataUpdateEthUsdAction>, getState: AppGetState) => {
    const newAssetPrices = message?.payload?.prices ?? {};
    const { nativeCurrency } = getState().settings;

    if (message?.meta?.currency?.toLowerCase() === NativeCurrencyKeys.USD.toLowerCase() && newAssetPrices[ETH_ADDRESS]) {
      const value = newAssetPrices[ETH_ADDRESS]?.price?.value;
      dispatch({
        payload: value,
        type: DATA_UPDATE_ETH_USD,
      });
    }
  };

/**
 * Handles a `AssetPricesChangedMessage` from Zerion and updates state.
 *
 * @param message The message.
 */
export const assetPricesChanged =
  (message: AssetPricesChangedMessage | undefined) => (dispatch: Dispatch<DataUpdateEthUsdAction>, getState: AppGetState) => {
    const { nativeCurrency } = getState().settings;

    const price = message?.payload?.prices?.[0]?.price;
    const assetAddress = message?.meta?.asset_code;
    if (isNil(price) || isNil(assetAddress)) return;

    if (message?.meta?.currency?.toLowerCase() === NativeCurrencyKeys.USD.toLowerCase() && assetAddress === ETH_ADDRESS) {
      dispatch({
        payload: price?.value,
        type: DATA_UPDATE_ETH_USD,
      });
    }
  };

/**
 * Updates state and account local storage with a new transaction.
 *
 * @param txDetails The transaction details to parse.
 * @param accountAddressToUpdate The account to add the transaction to, or null
 * to default to the currently selected account.
 * @param disableTxnWatcher Whether or not to disable the pending transaction
 * watcher.
 * @param provider A `StaticJsonRpcProvider` to use for watching the pending
 * transaction, or null to use the default provider.
 */
export const dataAddNewTransaction =
  (
    txDetails: NewTransactionOrAddCashTransaction,
    accountAddressToUpdate: string | null = null,
    disableTxnWatcher = false,
    provider: StaticJsonRpcProvider | null = null
  ) =>
  async (dispatch: ThunkDispatch<AppState, unknown, DataUpdatePendingTransactionSuccessAction>, getState: AppGetState) => {
    loggr.debug('dataAddNewTransaction', {}, loggr.DebugContext.f2c);

    const { pendingTransactions } = getState().data;
    const { accountAddress, nativeCurrency, network } = getState().settings;

    if (accountAddressToUpdate && accountAddressToUpdate.toLowerCase() !== accountAddress.toLowerCase()) {
      loggr.debug('dataAddNewTransaction: accountAddressToUpdate does not match accountAddress', {}, loggr.DebugContext.f2c);
      return;
    }

    try {
      const parsedTransaction = await parseNewTransaction(txDetails, nativeCurrency);

      const _pendingTransactions = [parsedTransaction, ...pendingTransactions];
      dispatch({
        payload: _pendingTransactions,
        type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
      });
      saveLocalPendingTransactions(_pendingTransactions, accountAddress, network);

      loggr.debug('dataAddNewTransaction: adding pending transactions', {}, loggr.DebugContext.f2c);

      if (parsedTransaction.from && parsedTransaction.nonce && parsedTransaction.network) {
        const { setNonce } = nonceStore.getState();
        setNonce({ address: parsedTransaction.from, currentNonce: parsedTransaction.nonce, network: parsedTransaction.network });
      }
      if (!disableTxnWatcher || network !== Network.mainnet || parsedTransaction?.network) {
        loggr.debug('dataAddNewTransaction: watching new pending transactions', {}, loggr.DebugContext.f2c);
        dispatch(
          watchPendingTransactions(
            accountAddress,
            parsedTransaction.network ? TXN_WATCHER_MAX_TRIES_LAYER_2 : TXN_WATCHER_MAX_TRIES,
            null,
            // @ts-expect-error `watchPendingTransactions` only takes 3 arguments.
            provider
          )
        );
      }

      loggr.debug('dataAddNewTransaction: complete', {}, loggr.DebugContext.f2c);

      return parsedTransaction;
    } catch (error) {
      loggr.error(new Error('dataAddNewTransaction: failed'), { error });
    }
  };

export const dataRemovePendingTransaction =
  (txHash: string, network: Network) =>
  async (dispatch: ThunkDispatch<AppState, unknown, DataUpdatePendingTransactionSuccessAction>, getState: AppGetState) => {
    loggr.debug('dataRemovePendingTransaction', { txHash });

    const { pendingTransactions } = getState().data;
    const { accountAddress } = getState().settings;

    const _pendingTransactions = pendingTransactions.filter(tx => {
      // if we find the pending tx, filter it out
      if (tx.hash === txHash && tx.network === network) {
        loggr.debug('dataRemovePendingTransaction: removed tx', { txHash });
        return false;
      } else {
        return true;
      }
    });

    dispatch({
      payload: _pendingTransactions,
      type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
    });
    saveLocalPendingTransactions(_pendingTransactions, accountAddress, network);
  };

/**
 * Watches pending transactions and updates state and account local storage
 * when new data is available.
 *
 * @param provider A `StaticJsonRpcProvider`, or null to use the default
 * provider.
 * @param currentNonce The nonce of the last confirmed transaction, used to
 * determine if a transaction has been dropped.
 */
export const dataWatchPendingTransactions =
  (provider: StaticJsonRpcProvider | null = null, currentNonce = -1) =>
  async (
    dispatch: ThunkDispatch<AppState, unknown, DataLoadTransactionSuccessAction | DataUpdatePendingTransactionSuccessAction>,
    getState: AppGetState
  ) => {
    const { pendingTransactions: pending } = getState().data;
    if (isEmpty(pending)) {
      return true;
    }
    let txStatusesDidChange = false;
    const updatedPendingTransactions = await Promise.all(
      pending.map(async tx => {
        const updatedPendingTransaction: RainbowTransaction = { ...tx };
        const txHash = ethereumUtils.getHash(tx) || '';
        let pendingTransactionData: {
          title: string;
          minedAt: number | null;
          pending: boolean;
          status: TransactionStatus;
        } | null = {
          status: TransactionStatus.sending,
          title: tx?.title || TransactionStatus.sending,
          minedAt: null,
          pending: true,
        };
        try {
          logger.log('Checking pending tx with hash', txHash);
          const p = (await getProviderForNetwork(updatedPendingTransaction.network)) || provider;
          const txObj: TransactionResponse | undefined = await p.getTransaction(txHash);
          // if the nonce of last confirmed tx is higher than this pending tx then it got dropped
          const nonceAlreadyIncluded = currentNonce > (tx?.nonce ?? txObj.nonce);
          if ((txObj && txObj?.blockNumber && txObj?.blockHash) || nonceAlreadyIncluded) {
            // When speeding up a non "normal tx" we need to resubscribe
            // because zerion "append" event isn't reliable
            logger.log('TX CONFIRMED!', txObj);
            if (!nonceAlreadyIncluded) {
              appEvents.emit('transactionConfirmed', {
                ...txObj,
                internalType: tx.type,
              });
            }
            if (tx?.ensRegistration) {
              fetchWalletENSDataAfterRegistration();
            }
            const transactionStatus = await getTransactionReceiptStatus(updatedPendingTransaction, nonceAlreadyIncluded, txObj);

            // approvals are not via socket so we dont want to check their status with them.
            const isApproveTx = transactionStatus === TransactionStatus.approved || transactionStatus === TransactionStatus.approving;
            if (updatedPendingTransaction?.swap?.type === SwapType.crossChain && !isApproveTx) {
              pendingTransactionData = await getTransactionSocketStatus(updatedPendingTransaction);
              if (!pendingTransactionData.pending) {
                appEvents.emit('transactionConfirmed', {
                  ...txObj,
                  internalType: tx.type,
                });
                txStatusesDidChange = true;
              }
            } else {
              pendingTransactionData = getPendingTransactionData(updatedPendingTransaction, transactionStatus);
              txStatusesDidChange = true;
            }
          } else if (tx.flashbots) {
            pendingTransactionData = await getTransactionFlashbotStatus(updatedPendingTransaction, txHash);
            if (pendingTransactionData && !pendingTransactionData.pending) {
              txStatusesDidChange = true;
              if (tx.from && tx.network) {
                const { setNonce, nonces } = nonceStore.getState();
                const currentNonce = nonces[tx.from!][tx.network].currentNonce;
                if (currentNonce) {
                  setNonce({ address: tx.from, currentNonce: currentNonce - 1, network: tx.network });
                }
              }
            }
          }
          if (pendingTransactionData) {
            updatedPendingTransaction.title = pendingTransactionData.title;
            updatedPendingTransaction.status = pendingTransactionData.status;
            updatedPendingTransaction.pending = pendingTransactionData.pending;
            updatedPendingTransaction.minedAt = pendingTransactionData.minedAt;
          }
        } catch (error) {
          logger.log('Error watching pending txn', error);
        }
        return updatedPendingTransaction;
      })
    );

    if (txStatusesDidChange) {
      const { accountAddress, network } = getState().settings;
      const [newDataTransactions, pendingTransactions] = partition(
        updatedPendingTransactions.filter(({ status }) => status !== TransactionStatus.unknown),
        tx => !tx.pending
      );
      dispatch({
        payload: pendingTransactions,
        type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
      });
      saveLocalPendingTransactions(pendingTransactions, accountAddress, network);

      const { transactions } = getState().data;
      const updatedTransactions = newDataTransactions.concat(transactions);
      dispatch({
        payload: updatedTransactions,
        type: DATA_LOAD_TRANSACTIONS_SUCCESS,
      });
      saveLocalTransactions(updatedTransactions, accountAddress, network);
      if (!pendingTransactions?.length) {
        return true;
      }
    }
    return false;
  };

/**
 * Updates a transaction in state and account local storage and watches it,
 * if `watch` is true.
 *
 * @param txHash The transaction hash to update.
 * @param txObj The updated transaction data.
 * @param watch Whether or not to watch the new transaction.
 * @param provider A `StaticJsonRpcProvider`, or null to use the default
 * provider.
 */
export const dataUpdateTransaction =
  (txHash: string, txObj: RainbowTransaction, watch: boolean, provider: StaticJsonRpcProvider | null = null) =>
  async (dispatch: ThunkDispatch<AppState, unknown, DataUpdatePendingTransactionSuccessAction>, getState: AppGetState) => {
    const { pendingTransactions } = getState().data;

    const allOtherTx = pendingTransactions.filter(tx => tx.hash !== txHash);
    const updatedTransactions = [txObj].concat(allOtherTx);

    dispatch({
      payload: updatedTransactions,
      type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
    });
    const { accountAddress, network } = getState().settings;
    saveLocalPendingTransactions(updatedTransactions, accountAddress, network);
    // Always watch cancellation and speed up
    if (watch) {
      dispatch(watchPendingTransactions(accountAddress, txObj.network ? TXN_WATCHER_MAX_TRIES_LAYER_2 : TXN_WATCHER_MAX_TRIES, provider));
    }
  };

/**
 * Checks the current account's transaction count and subscribes to pending
 * transaction updates using `dataWatchPendingTransactions`.
 *
 * @param accountAddressToWatch The address to watch. If this does not match
 * the currently selected address, the subscription is not started.
 * @param provider A `StaticJsonRpcProvider`, or null to use the default
 * provider.
 */
export const checkPendingTransactionsOnInitialize =
  (accountAddressToWatch: string, provider: StaticJsonRpcProvider | null = null) =>
  async (dispatch: ThunkDispatch<AppState, unknown, never>, getState: AppGetState) => {
    const { accountAddress: currentAccountAddress, network } = getState().settings;
    if (currentAccountAddress !== accountAddressToWatch) return;
    const providerForNetwork = await getProviderForNetwork(network);
    const currentNonce = await (provider || providerForNetwork).getTransactionCount(currentAccountAddress, 'latest');
    const notPendingTxs = await dispatch(dataWatchPendingTransactions(provider, currentNonce));
    if (!notPendingTxs) {
      dispatch(watchPendingTransactions(currentAccountAddress, TXN_WATCHER_MAX_TRIES, null));
    }
  };

/**
 * Repeatedly attempts to subscribe to transaction updates using
 * `dataWatchPendingTransactions` until there are no more pending transactions
 * or `remainingTries` attempts are exhausted.
 *
 * @param accountAddressToWatch The account address to watch. If this does
 * not match the currently selected address, the subscription is not started.
 * @param remainingTries The remaining number of attempts.
 * @param provider A `StaticJsonRpcProvider`, or null to use the default
 * provider.
 */
export const watchPendingTransactions =
  (accountAddressToWatch: string, remainingTries: number = TXN_WATCHER_MAX_TRIES, provider: StaticJsonRpcProvider | null = null) =>
  async (dispatch: ThunkDispatch<AppState, unknown, never>, getState: AppGetState) => {
    pendingTransactionsHandle && clearTimeout(pendingTransactionsHandle);
    if (remainingTries === 0) return;

    const { accountAddress: currentAccountAddress } = getState().settings;
    if (currentAccountAddress !== accountAddressToWatch) return;

    const done = await dispatch(dataWatchPendingTransactions(provider));

    if (!done) {
      pendingTransactionsHandle = setTimeout(() => {
        dispatch(watchPendingTransactions(accountAddressToWatch, remainingTries - 1, provider));
      }, TXN_WATCHER_POLL_INTERVAL);
    }
  };

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: DataState = {
  ethUSDPrice: null,
  isLoadingTransactions: true,
  pendingTransactions: [],
  transactions: [],
};

export default (state: DataState = INITIAL_STATE, action: DataAction) => {
  switch (action.type) {
    case DATA_UPDATE_ETH_USD:
      return {
        ...state,
        ethUSDPrice: action.payload,
      };
    case DATA_LOAD_TRANSACTIONS_REQUEST:
      return {
        ...state,
        isLoadingTransactions: true,
      };
    case DATA_LOAD_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        isLoadingTransactions: false,
        transactions: action.payload,
      };
    case DATA_LOAD_TRANSACTIONS_FAILURE:
      return {
        ...state,
        isLoadingTransactions: false,
      };
    case DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        pendingTransactions: action.payload,
      };
    case DATA_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
