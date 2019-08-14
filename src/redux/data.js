import {
  concat,
  filter,
  find,
  findIndex,
  get,
  includes,
  isEmpty,
  isNil,
  map,
  partition,
  remove,
  slice,
  uniqBy,
} from 'lodash';
import { DATA_API_KEY, DATA_ORIGIN } from 'react-native-dotenv';
import {
  getAssets,
  getLocalTransactions,
  removeAssets,
  removeLocalTransactions,
  saveAssets,
  saveLocalTransactions,
} from '../handlers/commonStorage';
import io from 'socket.io-client'; import { parseAccountAssets } from '../parsers/accounts';
import { parseNewTransaction } from '../parsers/newTransaction';
import { parseTransactions } from '../parsers/transactions';
import { getFamilies } from '../parsers/uniqueTokens';
import { isLowerCaseMatch } from '../utils';
import { uniswapAddLiquidityTokens, uniswapUpdateLiquidityTokens } from './uniswap';

// -- Constants --------------------------------------- //

const DATA_UPDATE_ASSETS = 'data/DATA_UPDATE_ASSETS';
const DATA_UPDATE_TRANSACTIONS = 'data/DATA_UPDATE_TRANSACTIONS';

const DATA_UPDATE_ADDRESS_SOCKET = 'data/DATA_UPDATE_ADDRESS_SOCKET';

const DATA_LOAD_ASSETS_REQUEST = 'data/DATA_LOAD_ASSETS_REQUEST';
const DATA_LOAD_ASSETS_SUCCESS = 'data/DATA_LOAD_ASSETS_SUCCESS';
const DATA_LOAD_ASSETS_FAILURE = 'data/DATA_LOAD_ASSETS_FAILURE';

const DATA_LOAD_TRANSACTIONS_REQUEST = 'data/DATA_LOAD_TRANSACTIONS_REQUEST';
const DATA_LOAD_TRANSACTIONS_SUCCESS = 'data/DATA_LOAD_TRANSACTIONS_SUCCESS';
const DATA_LOAD_TRANSACTIONS_FAILURE = 'data/DATA_LOAD_TRANSACTIONS_FAILURE';

const DATA_ADD_NEW_TRANSACTION_SUCCESS = 'data/DATA_ADD_NEW_TRANSACTION_SUCCESS';

const DATA_CLEAR_STATE = 'data/DATA_CLEAR_STATE';

const messages = {
  ASSETS: {
    APPENDED: 'appended address assets',
    CHANGED: 'changed address assets',
    RECEIVED: 'received address assets',
  },
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  TRANSACTIONS: {
    APPENDED: 'appended address transactions',
    RECEIVED: 'received address transactions',
    REMOVED: 'removed address transactions',
  },
};

// -- Actions ---------------------------------------- //

const createSocket = endpoint => io(
  `wss://api.zerion.io/${endpoint}?api_token=${DATA_API_KEY}`,
  {
    extraHeaders: { Origin: DATA_ORIGIN },
    transports: ['websocket'],
  },
);

/* eslint-disable camelcase */
const addressSubscription = (address, currency, action = 'subscribe') => [
  action,
  {
    payload: {
      address,
      currency,
      transactions_limit: 1000,
    },
    scope: ['assets', 'transactions'],
  },
];
/* eslint-disable camelcase */

export const dataLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
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

const dataUnsubscribe = () => (dispatch, getState) => {
  const { addressSocket } = getState().data;
  const { accountAddress, nativeCurrency } = getState().settings;
  if (!isNil(addressSocket)) {
    addressSocket.emit(...addressSubscription(
      accountAddress,
      nativeCurrency.toLowerCase(),
      'unsubscribe',
    ));
    addressSocket.close();
  }
};

export const dataClearState = () => (dispatch, getState) => {
  dispatch(dataUnsubscribe());
  const { accountAddress, network } = getState().settings;
  removeAssets(accountAddress, network);
  removeLocalTransactions(accountAddress, network);
  dispatch({ type: DATA_CLEAR_STATE });
};

export const dataInit = () => (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const addressSocket = createSocket('address');
  dispatch({
    payload: addressSocket,
    type: DATA_UPDATE_ADDRESS_SOCKET,
  });
  addressSocket.on(messages.CONNECT, () => {
    addressSocket.emit(...addressSubscription(accountAddress, nativeCurrency.toLowerCase()));
    dispatch(listenOnNewMessages(addressSocket));
  });
};

const dedupePendingTransactions = (pendingTransactions, parsedTransactions) => {
  let updatedPendingTransactions = pendingTransactions;
  if (pendingTransactions.length) {
    updatedPendingTransactions = filter(updatedPendingTransactions, (pendingTxn) => {
      const matchingElement = find(parsedTransactions, (txn) => txn.hash
        && (txn.hash.toLowerCase().startsWith(pendingTxn.hash.toLowerCase())
        || (txn.nonce && (txn.nonce >= pendingTxn.nonce))));
      return !matchingElement;
    });
  }
  return updatedPendingTransactions;
};

export const dedupeAssetsWithFamilies = (families) => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { assets } = getState().data;
  if (assets.length) {
    const dedupedAssets = filter(assets, (asset) => {
      const matchingElement = find(families, (family) => family === get(asset, 'address'));
      return !matchingElement;
    });
    saveAssets(accountAddress, dedupedAssets, network);
    dispatch({
      payload: dedupedAssets,
      type: DATA_UPDATE_ASSETS,
    });
  }
};

const dedupeUniqueTokens = assets => (dispatch, getState) => {
  const { uniqueTokens } = getState().uniqueTokens;
  const uniqueTokenFamilies = getFamilies(uniqueTokens);
  let updatedAssets = assets;
  if (assets.length) {
    updatedAssets = filter(updatedAssets, (asset) => {
      const matchingElement = find(uniqueTokenFamilies, (uniqueTokenFamily) => uniqueTokenFamily === get(asset, 'asset.asset_code'));
      return !matchingElement;
    });
  }
  return updatedAssets;
};

const checkMeta = message => (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const address = get(message, 'meta.address');
  const currency = get(message, 'meta.currency');
  return isLowerCaseMatch(address, accountAddress) && isLowerCaseMatch(currency, nativeCurrency);
};

const transactionsReceived = message => (dispatch, getState) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;

  let transactionData = get(message, 'payload.transactions', []);
  if (!transactionData.length) return;

  const { accountAddress, nativeCurrency, network } = getState().settings;
  const { transactions } = getState().data;

  const lastSuccessfulTxn = find(transactions, (txn) => txn.hash && !txn.pending);
  const lastTxHash = lastSuccessfulTxn ? lastSuccessfulTxn.hash : '';
  if (lastTxHash) {
    const lastTxnHashIndex = findIndex(transactionData, (txn) => lastTxHash.startsWith(txn.hash));
    if (lastTxnHashIndex > -1) {
      transactionData = slice(transactionData, 0, lastTxnHashIndex);
    }
  }
  if (!transactionData.length) return;

  const parsedTransactions = parseTransactions(transactionData, nativeCurrency);
  const partitions = partition(transactions, (txn) => txn.pending);
  const pendingTransactions = partitions[0];
  const remainingTransactions = partitions[1];

  const updatedPendingTransactions = dedupePendingTransactions(pendingTransactions, parsedTransactions);
  const updatedResults = concat(updatedPendingTransactions, parsedTransactions, remainingTransactions);
  const dedupedResults = uniqBy(updatedResults, (txn) => txn.hash);

  saveLocalTransactions(accountAddress, dedupedResults, network);
  dispatch({
    payload: dedupedResults,
    type: DATA_UPDATE_TRANSACTIONS,
  });
};

const transactionsAppended = message => (dispatch, getState) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;

  const transactionData = get(message, 'payload.transactions', []);
  if (!transactionData.length) return;
  const { accountAddress, nativeCurrency, network } = getState().settings;
  const { transactions } = getState().data;
  const partitions = partition(transactions, (txn) => txn.pending);
  const pendingTransactions = partitions[0];
  const remainingTransactions = partitions[1];

  const parsedTransactions = parseTransactions(transactionData, nativeCurrency);
  const updatedPendingTransactions = dedupePendingTransactions(pendingTransactions, parsedTransactions);
  const updatedResults = concat(updatedPendingTransactions, parsedTransactions, remainingTransactions);
  const dedupedResults = uniqBy(updatedResults, (txn) => txn.hash);

  saveLocalTransactions(accountAddress, updatedResults, network);
  dispatch({
    payload: dedupedResults,
    type: DATA_UPDATE_TRANSACTIONS,
  });
};

const transactionsRemoved = message => (dispatch, getState) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;

  const transactionData = get(message, 'payload.transactions', []);
  if (!transactionData.length) return;
  const { accountAddress, network } = getState().settings;
  const { transactions } = getState().data;
  const removeHashes = map(transactionData, txn => txn.hash);
  remove(transactions, (txn) => includes(removeHashes, txn.hash));

  saveLocalTransactions(accountAddress, transactions, network);
  dispatch({
    payload: transactions,
    type: DATA_UPDATE_TRANSACTIONS,
  });
};

const assetsReceived = (message, append = false, change = false) => (dispatch, getState) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;

  const { accountAddress, network } = getState().settings;
  const assets = get(message, 'payload.assets', []);
  const liquidityTokens = remove(
    assets,
    asset => get(asset, 'asset.symbol', '') === 'UNI'
  );
  if (append) {
    dispatch(uniswapAddLiquidityTokens(liquidityTokens));
  }
  if (!append && !change) {
    dispatch(uniswapUpdateLiquidityTokens(liquidityTokens));
  }
  const updatedAssets = dispatch(dedupeUniqueTokens(assets));
  if (!updatedAssets.length) return;
  let parsedAssets = parseAccountAssets(updatedAssets);
  if (append || change) {
    const { assets: existingAssets } = getState().data;
    parsedAssets = uniqBy(concat(parsedAssets, existingAssets), (item) => item.uniqueId);
  }
  saveAssets(accountAddress, parsedAssets, network);
  dispatch({
    payload: parsedAssets,
    type: DATA_UPDATE_ASSETS,
  });
};

const listenOnNewMessages = socket => (dispatch, getState) => {
  socket.on(messages.TRANSACTIONS.RECEIVED, (message) => {
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.TRANSACTIONS.APPENDED, (message) => {
    dispatch(transactionsAppended(message));
  });

  socket.on(messages.TRANSACTIONS.REMOVED, (message) => {
    dispatch(transactionsRemoved(message));
  });

  socket.on(messages.ASSETS.RECEIVED, (message) => {
    dispatch(assetsReceived(message));
  });

  socket.on(messages.ASSETS.APPENDED, (message) => {
    dispatch(assetsReceived(message, true));
  });

  socket.on(messages.ASSETS.CHANGED, (message) => {
    dispatch(assetsReceived(message, false, true));
  });
};

export const dataAddNewTransaction = txDetails => (dispatch, getState) => new Promise((resolve, reject) => {
  const { transactions } = getState().data;
  const { accountAddress, nativeCurrency, network } = getState().settings;
  parseNewTransaction(txDetails, nativeCurrency)
    .then(parsedTransaction => {
      const _transactions = [parsedTransaction, ...transactions];
      saveLocalTransactions(accountAddress, _transactions, network);
      dispatch({
        payload: _transactions,
        type: DATA_ADD_NEW_TRANSACTION_SUCCESS,
      });
      resolve(true);
    })
    .catch(error => {
      reject(error);
    });
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  addressSocket: null,
  assets: [],
  loadingAssets: false,
  loadingTransactions: false,
  transactions: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case DATA_UPDATE_ADDRESS_SOCKET:
    return { ...state, addressSocket: action.payload };
  case DATA_UPDATE_ASSETS:
    return { ...state, assets: action.payload };
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
  case DATA_LOAD_ASSETS_SUCCESS:
    return {
      ...state,
      assets: action.payload,
      loadingAssets: false,
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
