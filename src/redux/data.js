import { getUnixTime, subDays } from 'date-fns';
import {
  concat,
  filter,
  get,
  includes,
  isNil,
  keyBy,
  map,
  mapKeys,
  mapValues,
  property,
  remove,
  uniqBy,
} from 'lodash';
import { uniswapClient } from '../apollo/client';
import {
  UNISWAP_24HOUR_PRICE_QUERY,
  UNISWAP_PRICES_QUERY,
} from '../apollo/queries';
import {
  getAssetPricesFromUniswap,
  getAssets,
  getCompoundAssets,
  getLocalTransactions,
  removeAssetPricesFromUniswap,
  removeAssets,
  removeCompoundAssets,
  removeLocalTransactions,
  saveAssetPricesFromUniswap,
  saveAssets,
  saveCompoundAssets,
  saveLocalTransactions,
} from '../handlers/localstorage/accountLocal';
import { apiGetTokenOverrides } from '../handlers/tokenOverrides';
import { getTransactionByHash } from '../handlers/web3';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import { divide } from '../helpers/utilities';
import { parseAccountAssets } from '../parsers/accounts';
import { parseCompoundDeposits } from '../parsers/compound';
import { parseNewTransaction } from '../parsers/newTransaction';
import parseTransactions from '../parsers/transactions';
import {
  loweredTokenOverridesFallback,
  shitcoinBlacklist,
} from '../references';
import { ethereumUtils, isLowerCaseMatch } from '../utils';
import {
  uniswapRemovePendingApproval,
  uniswapUpdateLiquidityTokens,
} from './uniswap';

let watchPendingTransactionsHandler = null;

// -- Constants --------------------------------------- //

const DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP =
  'data/DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP';
const DATA_UPDATE_ASSETS = 'data/DATA_UPDATE_ASSETS';
const DATA_UPDATE_COMPOUND_ASSETS = 'data/DATA_UPDATE_COMPOUND_ASSETS';
const DATA_UPDATE_TRANSACTIONS = 'data/DATA_UPDATE_TRANSACTIONS';
const DATA_UPDATE_TOKEN_OVERRIDES = 'data/DATA_UPDATE_TOKEN_OVERRIDES';
const DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION =
  'data/DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION';

const DATA_LOAD_ASSETS_REQUEST = 'data/DATA_LOAD_ASSETS_REQUEST';
const DATA_LOAD_ASSETS_SUCCESS = 'data/DATA_LOAD_ASSETS_SUCCESS';
const DATA_LOAD_ASSETS_FAILURE = 'data/DATA_LOAD_ASSETS_FAILURE';

const DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS =
  'data/DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS';

const DATA_LOAD_COMPOUND_ASSETS_SUCCESS =
  'data/DATA_LOAD_COMPOUND_ASSETS_SUCCESS';

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
    const compoundAssets = await getCompoundAssets(accountAddress, network);
    dispatch({
      payload: compoundAssets,
      type: DATA_LOAD_COMPOUND_ASSETS_SUCCESS,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
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

export const dataTokenOverridesInit = () => async dispatch => {
  try {
    const tokenOverrides = await apiGetTokenOverrides();
    dispatch(dataUpdateTokenOverrides(tokenOverrides));
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const dataClearState = () => (dispatch, getState) => {
  const { uniswapPricesSubscription } = getState().data;
  const { accountAddress, network } = getState().settings;
  uniswapPricesSubscription &&
    uniswapPricesSubscription.unsubscribe &&
    uniswapPricesSubscription.unsubscribe();
  removeAssets(accountAddress, network);
  removeAssetPricesFromUniswap(accountAddress, network);
  removeCompoundAssets(accountAddress, network);
  removeLocalTransactions(accountAddress, network);
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

export const transactionsReceived = (message, appended = false) => (
  dispatch,
  getState
) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;
  const transactionData = get(message, 'payload.transactions', []);
  if (!transactionData.length) return;
  const { accountAddress, nativeCurrency, network } = getState().settings;
  const { transactions, tokenOverrides } = getState().data;
  if (!transactionData.length) return;
  const { approvalTransactions, dedupedResults } = parseTransactions(
    transactionData,
    accountAddress,
    nativeCurrency,
    transactions,
    tokenOverrides,
    appended
  );
  dispatch(uniswapRemovePendingApproval(approvalTransactions));
  dispatch({
    payload: dedupedResults,
    type: DATA_UPDATE_TRANSACTIONS,
  });
  saveLocalTransactions(dedupedResults, accountAddress, network);
};

export const transactionsRemoved = message => (dispatch, getState) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;

  const transactionData = get(message, 'payload.transactions', []);
  if (!transactionData.length) return;
  const { accountAddress, network } = getState().settings;
  const { transactions } = getState().data;
  const removeHashes = map(transactionData, txn => txn.hash);
  remove(transactions, txn => includes(removeHashes, txn.hash));

  dispatch({
    payload: transactions,
    type: DATA_UPDATE_TRANSACTIONS,
  });
  saveLocalTransactions(transactions, accountAddress, network);
};

export const addressAssetsReceived = (
  message,
  append = false,
  change = false
) => (dispatch, getState) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;

  const { tokenOverrides } = getState().data;
  const { accountAddress, network } = getState().settings;
  const { uniqueTokens } = getState().uniqueTokens;
  const assets = get(message, 'payload.assets', []);
  const liquidityTokens = remove(assets, asset => {
    const symbol = get(asset, 'asset.symbol', '');
    return symbol === 'UNI' || symbol === 'uni-v1';
  });
  dispatch(uniswapUpdateLiquidityTokens(liquidityTokens, append || change));
  let parsedAssets = parseAccountAssets(assets, uniqueTokens, tokenOverrides);
  if (append || change) {
    const { assets: existingAssets } = getState().data;
    parsedAssets = uniqBy(
      concat(parsedAssets, existingAssets),
      item => item.uniqueId
    );
  }

  parsedAssets = parsedAssets.filter(
    asset =>
      // Shitcoin filtering
      shitcoinBlacklist[network].indexOf(get(asset, 'address')) === -1 &&
      !!Number(get(asset, 'balance.amount'))
  );

  if (!change) {
    const missingPriceAssetAddresses = map(
      filter(parsedAssets, asset => isNil(asset.price)),
      property('address')
    );
    dispatch(subscribeToMissingPrices(missingPriceAssetAddresses));
  }
  saveAssets(parsedAssets, accountAddress, network);
  dispatch({
    payload: parsedAssets,
    type: DATA_UPDATE_ASSETS,
  });
};

const subscribeToMissingPrices = addresses => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { assets, uniswapPricesSubscription } = getState().data;
  if (uniswapPricesSubscription) {
    uniswapPricesSubscription.refetch({ addresses });
  } else {
    const newSubscription = uniswapClient.watchQuery({
      fetchPolicy: 'network-only',
      pollInterval: 15000, // 15 seconds
      query: UNISWAP_PRICES_QUERY,
      variables: {
        addresses,
      },
    });

    newSubscription.subscribe({
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
      payload: newSubscription,
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

export const compoundInfoReceived = message => (dispatch, getState) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;
  const { tokenOverrides } = getState().data;
  const { accountAddress, network } = getState().settings;
  const deposits = get(message, 'payload.info.deposits', []);
  const parsedDeposits = parseCompoundDeposits(deposits, tokenOverrides);
  dispatch({
    payload: parsedDeposits,
    type: DATA_UPDATE_COMPOUND_ASSETS,
  });
  saveCompoundAssets(parsedDeposits, accountAddress, network);
};

export const dataUpdateTokenOverrides = tokenOverrides => dispatch =>
  dispatch({
    payload: tokenOverrides,
    type: DATA_UPDATE_TOKEN_OVERRIDES,
  });

export const dataAddNewTransaction = (txDetails, disableTxnWatcher) => (
  dispatch,
  getState
) =>
  new Promise((resolve, reject) => {
    const { transactions } = getState().data;
    const { accountAddress, nativeCurrency, network } = getState().settings;
    parseNewTransaction(txDetails, nativeCurrency)
      .then(parsedTransaction => {
        const _transactions = [parsedTransaction, ...transactions];
        dispatch({
          payload: _transactions,
          type: DATA_ADD_NEW_TRANSACTION_SUCCESS,
        });
        saveLocalTransactions(_transactions, accountAddress, network);
        if (!disableTxnWatcher) {
          dispatch(startPendingTransactionWatcher());
        }
        resolve(true);
      })
      .catch(error => {
        reject(error);
      });
  });

export const dataWatchPendingTransactions = () => async (
  dispatch,
  getState
) => {
  const { transactions } = getState().data;
  if (!transactions.length) return false;
  const updatedTransactions = [...transactions];
  let txStatusesDidChange = false;

  const pending = filter(transactions, ['pending', true]);
  await Promise.all(
    pending.map(async (tx, index) => {
      const txHash = tx.hash.split('-').shift();
      try {
        const txObj = await getTransactionByHash(txHash);
        if (txObj && txObj.blockNumber) {
          const minedAt = Math.floor(Date.now() / 1000);
          txStatusesDidChange = true;
          updatedTransactions[index].status = TransactionStatusTypes.sent;
          updatedTransactions[index].pending = false;
          updatedTransactions[index].minedAt = minedAt;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
    })
  );

  if (txStatusesDidChange) {
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

const startPendingTransactionWatcher = () => async dispatch => {
  watchPendingTransactionsHandler &&
    clearTimeout(watchPendingTransactionsHandler);

  const done = await dispatch(dataWatchPendingTransactions());

  if (!done) {
    watchPendingTransactionsHandler = setTimeout(() => {
      dispatch(startPendingTransactionWatcher());
    }, 1000);
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  assetPricesFromUniswap: {},
  assets: [],
  compoundAssets: [],
  loadingAssets: false,
  loadingTransactions: false,
  tokenOverrides: loweredTokenOverridesFallback,
  transactions: [],
  uniswapPricesSubscription: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION:
      return { ...state, uniswapPricesSubscription: action.payload };
    case DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP:
      return { ...state, assetPricesFromUniswap: action.payload };
    case DATA_UPDATE_ASSETS:
      return { ...state, assets: action.payload };
    case DATA_UPDATE_COMPOUND_ASSETS:
      return { ...state, compoundAssets: action.payload };
    case DATA_UPDATE_TOKEN_OVERRIDES:
      return { ...state, tokenOverrides: action.payload };
    case DATA_UPDATE_TRANSACTIONS:
      return { ...state, transactions: action.payload };
    case DATA_LOAD_TRANSACTIONS_REQUEST:
      return {
        ...state,
        loadingTransactions: true,
      };
    case DATA_LOAD_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        loadingTransactions: false,
        transactions: action.payload,
      };
    case DATA_LOAD_TRANSACTIONS_FAILURE:
      return {
        ...state,
        loadingTransactions: false,
      };
    case DATA_LOAD_ASSETS_REQUEST:
      return {
        ...state,
        loadingAssets: true,
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
        loadingAssets: false,
      };
    case DATA_LOAD_COMPOUND_ASSETS_SUCCESS:
      return {
        ...state,
        compoundAssets: action.payload,
      };
    case DATA_LOAD_ASSETS_FAILURE:
      return {
        ...state,
        loadingAssets: false,
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
