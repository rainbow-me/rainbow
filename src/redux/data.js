import { getUnixTime, subDays } from 'date-fns';
import {
  concat,
  filter,
  get,
  includes,
  isEmpty,
  isNil,
  keyBy,
  map,
  mapKeys,
  mapValues,
  partition,
  property,
  remove,
  toLower,
  uniqBy,
  values,
} from 'lodash';
import { uniswapClient } from '../apollo/client';
import {
  UNISWAP_24HOUR_PRICE_QUERY,
  UNISWAP_PRICES_QUERY,
} from '../apollo/queries';
import {
  getAssetPricesFromUniswap,
  getAssets,
  getLocalTransactions,
  saveAssetPricesFromUniswap,
  saveAssets,
  saveLocalTransactions,
} from '../handlers/localstorage/accountLocal';
import { getTransactionReceipt } from '../handlers/web3';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import TransactionTypes from '../helpers/transactionTypes';
import { divide, isZero } from '../helpers/utilities';
import { parseAccountAssets, parseAsset } from '../parsers/accounts';
import { parseNewTransaction } from '../parsers/newTransaction';
import { parseTransactions } from '../parsers/transactions';
import { tokenOverrides } from '../references';
import { ethereumUtils, isLowerCaseMatch, logger } from '../utils';
/* eslint-disable-next-line import/no-cycle */
import { addCashUpdatePurchases } from './addCash';
/* eslint-disable-next-line import/no-cycle */
import { uniqueTokensRefreshState } from './uniqueTokens';
import { uniswapUpdateLiquidityTokens } from './uniswap';

let pendingTransactionsHandle = null;
const TXN_WATCHER_MAX_TRIES = 5 * 60;

// -- Constants --------------------------------------- //

const DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP =
  'data/DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP';
const DATA_UPDATE_ASSETS = 'data/DATA_UPDATE_ASSETS';
const DATA_UPDATE_GENERIC_ASSETS = 'data/DATA_UPDATE_GENERIC_ASSETS';
const DATA_UPDATE_TRANSACTIONS = 'data/DATA_UPDATE_TRANSACTIONS';
const DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION =
  'data/DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION';

const DATA_LOAD_ASSETS_REQUEST = 'data/DATA_LOAD_ASSETS_REQUEST';
const DATA_LOAD_ASSETS_SUCCESS = 'data/DATA_LOAD_ASSETS_SUCCESS';
const DATA_LOAD_ASSETS_FAILURE = 'data/DATA_LOAD_ASSETS_FAILURE';

const DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS =
  'data/DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS';

const DATA_LOAD_TRANSACTIONS_REQUEST = 'data/DATA_LOAD_TRANSACTIONS_REQUEST';
const DATA_LOAD_TRANSACTIONS_SUCCESS = 'data/DATA_LOAD_TRANSACTIONS_SUCCESS';
const DATA_LOAD_TRANSACTIONS_FAILURE = 'data/DATA_LOAD_TRANSACTIONS_FAILURE';

const DATA_ADD_NEW_TRANSACTION_SUCCESS =
  'data/DATA_ADD_NEW_TRANSACTION_SUCCESS';

const DATA_CLEAR_STATE = 'data/DATA_CLEAR_STATE';

// -- Actions ---------------------------------------- //
export const dataLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  try {
    const assetPricesFromUniswap = await getAssetPricesFromUniswap(
      accountAddress,
      network
    );
    dispatch({
      payload: assetPricesFromUniswap,
      type: DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
  try {
    dispatch({ type: DATA_LOAD_ASSETS_REQUEST });
    const assets = await getAssets(accountAddress, network);
    dispatch({
      payload: assets,
      type: DATA_LOAD_ASSETS_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: DATA_LOAD_ASSETS_FAILURE });
  }
  try {
    dispatch({ type: DATA_LOAD_TRANSACTIONS_REQUEST });
    const transactions = await getLocalTransactions(accountAddress, network);
    dispatch({
      payload: transactions,
      type: DATA_LOAD_TRANSACTIONS_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: DATA_LOAD_TRANSACTIONS_FAILURE });
  }
};

export const dataResetState = () => (dispatch, getState) => {
  const { uniswapPricesSubscription } = getState().data;
  uniswapPricesSubscription &&
    uniswapPricesSubscription.unsubscribe &&
    uniswapPricesSubscription.unsubscribe();
  pendingTransactionsHandle && clearTimeout(pendingTransactionsHandle);
  dispatch({ type: DATA_CLEAR_STATE });
};

export const dataUpdateAssets = assets => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  if (assets.length) {
    saveAssets(assets, accountAddress, network);
    dispatch({
      payload: assets,
      type: DATA_UPDATE_ASSETS,
    });
  }
};

const checkMeta = message => (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const address = get(message, 'meta.address');
  const currency = get(message, 'meta.currency');
  return (
    isLowerCaseMatch(address, accountAddress) &&
    isLowerCaseMatch(currency, nativeCurrency)
  );
};

export const transactionsReceived = (message, appended = false) => async (
  dispatch,
  getState
) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;
  const transactionData = get(message, 'payload.transactions', []);
  const { accountAddress, nativeCurrency, network } = getState().settings;
  const { purchaseTransactions } = getState().addCash;
  const { transactions, tokenOverrides } = getState().data;
  const { parsedTransactions, potentialNftTransaction } = parseTransactions(
    transactionData,
    accountAddress,
    nativeCurrency,
    transactions,
    purchaseTransactions,
    tokenOverrides,
    network,
    appended
  );
  if (appended && potentialNftTransaction) {
    setTimeout(() => {
      dispatch(uniqueTokensRefreshState());
    }, 60000);
  }
  dispatch({
    payload: parsedTransactions,
    type: DATA_UPDATE_TRANSACTIONS,
  });
  dispatch(updatePurchases(parsedTransactions));
  saveLocalTransactions(parsedTransactions, accountAddress, network);
};

export const transactionsRemoved = message => (dispatch, getState) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;

  const transactionData = get(message, 'payload.transactions', []);
  if (!transactionData.length) return;
  const { accountAddress, network } = getState().settings;
  const { transactions } = getState().data;
  const removeHashes = map(transactionData, txn => txn.hash);
  logger.log('[data] - remove txn hashes', removeHashes);
  const updatedTransactions = filter(
    transactions,
    txn => !includes(removeHashes, ethereumUtils.getHash(txn))
  );

  dispatch({
    payload: updatedTransactions,
    type: DATA_UPDATE_TRANSACTIONS,
  });
  saveLocalTransactions(updatedTransactions, accountAddress, network);
};

export const addressAssetsReceived = (
  message,
  append = false,
  change = false,
  removed = false
) => (dispatch, getState) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;

  const { tokenOverrides } = getState().data;
  const { accountAddress, network } = getState().settings;
  const { uniqueTokens } = getState().uniqueTokens;
  const payload = values(get(message, 'payload.assets', {}));
  let assets = filter(
    payload,
    asset => asset.asset.type !== 'compound' && asset.asset.type !== 'trash'
  );

  if (removed) {
    assets = map(payload, asset => {
      return {
        ...asset,
        quantity: 0,
      };
    });
  }

  const liquidityTokens = remove(
    assets,
    asset => asset.asset.type === 'uniswap'
  );
  dispatch(
    uniswapUpdateLiquidityTokens(liquidityTokens, append || change || removed)
  );
  let parsedAssets = parseAccountAssets(assets, uniqueTokens, tokenOverrides);
  if (append || change || removed) {
    const { assets: existingAssets } = getState().data;
    parsedAssets = uniqBy(
      concat(parsedAssets, existingAssets),
      item => item.uniqueId
    );
  }

  parsedAssets = parsedAssets.filter(
    asset => !!Number(get(asset, 'balance.amount'))
  );

  saveAssets(parsedAssets, accountAddress, network);
  dispatch({
    payload: parsedAssets,
    type: DATA_UPDATE_ASSETS,
  });
  if (!change) {
    const missingPriceAssetAddresses = map(
      filter(parsedAssets, asset => isNil(asset.price)),
      property('address')
    );
    dispatch(subscribeToMissingPrices(missingPriceAssetAddresses));
  }
};

const subscribeToMissingPrices = addresses => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { assets, uniswapPricesQuery } = getState().data;
  if (uniswapPricesQuery) {
    uniswapPricesQuery.refetch({ addresses });
  } else {
    const newQuery = uniswapClient.watchQuery({
      fetchPolicy: 'network-only',
      pollInterval: 15000, // 15 seconds
      query: UNISWAP_PRICES_QUERY,
      variables: {
        addresses,
      },
    });

    const newSubscription = newQuery.subscribe({
      next: async ({ data }) => {
        if (data && data.exchanges) {
          const nativePriceOfEth = ethereumUtils.getEthPriceUnit(assets);
          const exchangeAddresses = map(data.exchanges, property('id'));

          const yesterday = getUnixTime(subDays(new Date(), 1));
          const historicalPriceCalls = map(exchangeAddresses, address =>
            get24HourPrice(address, yesterday)
          );
          const historicalPriceResults = await Promise.all(
            historicalPriceCalls
          );
          const mappedHistoricalData = keyBy(
            historicalPriceResults,
            'exchangeAddress'
          );
          const missingHistoricalPrices = mapValues(
            mappedHistoricalData,
            value => divide(nativePriceOfEth, value.price)
          );

          const mappedPricingData = keyBy(data.exchanges, 'id');
          const missingPrices = mapValues(mappedPricingData, value =>
            divide(nativePriceOfEth, value.price)
          );
          const missingPriceInfo = mapValues(
            missingPrices,
            (currentPrice, key) => {
              const historicalPrice = get(missingHistoricalPrices, `[${key}]`);
              const tokenAddress = get(
                mappedPricingData,
                `[${key}].tokenAddress`
              );
              const relativePriceChange = historicalPrice
                ? ((currentPrice - historicalPrice) / currentPrice) * 100
                : 0;
              return {
                price: currentPrice,
                relativePriceChange,
                tokenAddress,
              };
            }
          );
          const tokenPricingInfo = mapKeys(missingPriceInfo, 'tokenAddress');

          saveAssetPricesFromUniswap(tokenPricingInfo, accountAddress, network);
          dispatch({
            payload: tokenPricingInfo,
            type: DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP,
          });
        }
      },
    });
    dispatch({
      payload: {
        uniswapPricesQuery: newQuery,
        uniswapPricesSubscription: newSubscription,
      },
      type: DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION,
    });
  }
};

const get24HourPrice = async (exchangeAddress, yesterday) => {
  const result = await uniswapClient.query({
    query: UNISWAP_24HOUR_PRICE_QUERY,
    variables: {
      exchangeAddress,
      fetchPolicy: 'network-only',
      timestamp: yesterday,
    },
  });
  return get(result, 'data.exchangeHistoricalDatas[0]');
};

export const assetPricesReceived = message => (dispatch, getState) => {
  const { tokenOverrides } = getState().data;
  const assets = get(message, 'payload.prices', {});
  if (isEmpty(assets)) return;
  const parsedAssets = mapValues(assets, asset =>
    parseAsset(asset, tokenOverrides)
  );
  dispatch({
    payload: parsedAssets,
    type: DATA_UPDATE_GENERIC_ASSETS,
  });
};

export const assetPricesChanged = message => (dispatch, getState) => {
  const price = get(message, 'payload.prices[0]');
  const assetAddress = get(message, 'meta.asset_code');
  if (isNil(price) || isNil(assetAddress)) return;
  const { genericAssets } = getState().data;
  const genericAsset = {
    ...get(genericAssets, assetAddress),
    price,
  };
  const updatedAssets = {
    ...genericAssets,
    [assetAddress]: genericAsset,
  };
  dispatch({
    payload: updatedAssets,
    type: DATA_UPDATE_GENERIC_ASSETS,
  });
};

export const dataAddNewTransaction = (
  txDetails,
  accountAddressToUpdate = null,
  disableTxnWatcher = false
) => async (dispatch, getState) => {
  const { transactions } = getState().data;
  const { accountAddress, nativeCurrency, network } = getState().settings;
  if (
    accountAddressToUpdate &&
    toLower(accountAddressToUpdate) !== toLower(accountAddress)
  )
    return;

  try {
    const parsedTransaction = await parseNewTransaction(
      txDetails,
      nativeCurrency
    );
    const _transactions = [parsedTransaction, ...transactions];
    dispatch({
      payload: _transactions,
      type: DATA_ADD_NEW_TRANSACTION_SUCCESS,
    });
    saveLocalTransactions(_transactions, accountAddress, network);
    if (!disableTxnWatcher) {
      dispatch(watchPendingTransactions(accountAddress));
    }
    return parsedTransaction;
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

const getConfirmedState = type => {
  switch (type) {
    case TransactionTypes.authorize:
      return TransactionStatusTypes.approved;
    case TransactionTypes.deposit:
      return TransactionStatusTypes.deposited;
    case TransactionTypes.withdraw:
      return TransactionStatusTypes.withdrew;
    case TransactionTypes.receive:
      return TransactionStatusTypes.received;
    case TransactionTypes.purchase:
      return TransactionStatusTypes.purchased;
    default:
      return TransactionStatusTypes.sent;
  }
};

export const dataWatchPendingTransactions = () => async (
  dispatch,
  getState
) => {
  const { transactions } = getState().data;
  if (!transactions.length) return true;
  let txStatusesDidChange = false;

  const [pending, remainingTransactions] = partition(
    transactions,
    txn => txn.pending
  );

  if (isEmpty(pending)) return true;

  const updatedPendingTransactions = await Promise.all(
    pending.map(async tx => {
      const updatedPending = { ...tx };
      const txHash = ethereumUtils.getHash(tx);
      try {
        const txObj = await getTransactionReceipt(txHash);
        if (txObj && txObj.blockNumber) {
          const minedAt = Math.floor(Date.now() / 1000);
          txStatusesDidChange = true;
          if (!isZero(txObj.status)) {
            const newStatus = getConfirmedState(tx.type);
            updatedPending.status = newStatus;
          } else {
            updatedPending.status = TransactionStatusTypes.failed;
          }
          updatedPending.pending = false;
          updatedPending.minedAt = minedAt;
        }
      } catch (error) {
        logger.log('Error watching pending txn', error);
      }
      return updatedPending;
    })
  );
  const updatedTransactions = concat(
    updatedPendingTransactions,
    remainingTransactions
  );

  if (txStatusesDidChange) {
    dispatch(updatePurchases(updatedTransactions));
    const { accountAddress, network } = getState().settings;
    dispatch({
      payload: updatedTransactions,
      type: DATA_UPDATE_TRANSACTIONS,
    });
    saveLocalTransactions(updatedTransactions, accountAddress, network);

    const pendingTx = updatedTransactions.find(tx => tx.pending);
    if (!pendingTx) {
      return true;
    }
  }

  return false;
};

const updatePurchases = updatedTransactions => dispatch => {
  const confirmedPurchases = filter(updatedTransactions, txn => {
    return (
      txn.type === TransactionTypes.purchase &&
      txn.status !== TransactionStatusTypes.purchasing
    );
  });
  dispatch(addCashUpdatePurchases(confirmedPurchases));
};

const watchPendingTransactions = (
  accountAddressToWatch,
  remainingTries = TXN_WATCHER_MAX_TRIES
) => async (dispatch, getState) => {
  pendingTransactionsHandle && clearTimeout(pendingTransactionsHandle);
  if (remainingTries === 0) return;

  const { accountAddress: currentAccountAddress } = getState().settings;
  if (currentAccountAddress !== accountAddressToWatch) return;

  const done = await dispatch(dataWatchPendingTransactions());

  if (!done) {
    pendingTransactionsHandle = setTimeout(() => {
      dispatch(
        watchPendingTransactions(accountAddressToWatch, remainingTries - 1)
      );
    }, 1000);
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  assetPricesFromUniswap: {},
  assets: [], // for account-specific assets
  genericAssets: {},
  isLoadingAssets: true,
  isLoadingTransactions: true,
  tokenOverrides: tokenOverrides,
  transactions: [],
  uniswapPricesQuery: null,
  uniswapPricesSubscription: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION:
      return {
        ...state,
        uniswapPricesQuery: action.payload.uniswapPricesQuery,
        uniswapPricesSubscription: action.payload.uniswapPricesSubscription,
      };
    case DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP:
      return { ...state, assetPricesFromUniswap: action.payload };
    case DATA_UPDATE_GENERIC_ASSETS:
      return { ...state, genericAssets: action.payload };
    case DATA_UPDATE_ASSETS:
      return { ...state, assets: action.payload, isLoadingAssets: false };
    case DATA_UPDATE_TRANSACTIONS:
      return {
        ...state,
        isLoadingTransactions: false,
        transactions: action.payload,
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
    case DATA_LOAD_ASSETS_REQUEST:
      return {
        ...state,
        isLoadingAssets: true,
      };
    case DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS:
      return {
        ...state,
        assetPricesFromUniswap: action.payload,
      };
    case DATA_LOAD_ASSETS_SUCCESS:
      return {
        ...state,
        assets: action.payload,
        isLoadingAssets: false,
      };
    case DATA_LOAD_ASSETS_FAILURE:
      return {
        ...state,
        isLoadingAssets: false,
      };
    case DATA_ADD_NEW_TRANSACTION_SUCCESS:
      return {
        ...state,
        transactions: action.payload,
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
