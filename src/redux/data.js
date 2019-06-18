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
import { DATA_ORIGIN } from 'react-native-dotenv';
import {
  getAssets,
  getLocalTransactions,
  removeAssets,
  removeLocalTransactions,
  saveAssets,
  saveLocalTransactions,
} from '../handlers/commonStorage';
import io from 'socket.io-client';
import { parseAccountAssets } from '../parsers/accounts';
import { parseNewTransaction } from '../parsers/newTransaction';
import { parseTransactions } from '../parsers/transactions';
import { getFamilies } from '../parsers/uniqueTokens';

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
  TRANSACTIONS: {
    APPENDED: 'appended address transactions',
    RECEIVED: 'received address transactions', REMOVED: 'removed address transactions',
  },
};

// -- Actions ---------------------------------------- //

const createSocket = endpoint => io(
  `wss://api.zerion.io/${endpoint}`,
  {
    transports: ['websocket'],
    extraHeaders: {
      'Origin': DATA_ORIGIN,
    },
  },
);

const addressSubscription = (address, currency, action='subscribe') => [
  action,
  {
    scope: ['assets', 'transactions'],
    payload: {
      address,
      currency,
      "transactions_limit": 1000,
    }
  }
];

export const dataLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  try {
    dispatch({ type: DATA_LOAD_ASSETS_REQUEST });
    const assets = await getAssets(accountAddress, network);
    dispatch({
      type: DATA_LOAD_ASSETS_SUCCESS,
      payload: assets,
    });
  } catch (error) {
    dispatch({ type: DATA_LOAD_ASSETS_FAILURE });
  }
  try {
    dispatch({ type: DATA_LOAD_TRANSACTIONS_REQUEST });
    const transactions = await getLocalTransactions(accountAddress, network);
    dispatch({
      type: DATA_LOAD_TRANSACTIONS_SUCCESS,
      payload: transactions,
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
      'unsubscribe'
    ));
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
  console.log('data init');
  const { accountAddress, nativeCurrency } = getState().settings;
  const addressSocket = createSocket('address');
  dispatch({
    payload: addressSocket,
    type: DATA_UPDATE_ADDRESS_SOCKET,
  });
  addressSocket.on(messages.CONNECT, () => {
    console.log('on connect');
    addressSocket.emit(...addressSubscription(accountAddress, nativeCurrency.toLowerCase()));
  });
  // TODO need to move this up earlier or no?
  dispatch(listenOnNewMessages(addressSocket));
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
      const matchingElement = find(families, (family) =>
        family === get(asset, 'address'));
      return !matchingElement;
    });
    saveAssets(accountAddress, dedupedAssets, network);
    dispatch({
      payload: dedupedAssets,
      type: DATA_UPDATE_ASSETS,
    });
  }
};

const dedupeUniqueTokens = (assets, uniqueTokens) => {
  const uniqueTokenFamilies = getFamilies(uniqueTokens);
  let updatedAssets = assets;
  if (assets.length) {
    updatedAssets = filter(updatedAssets, (asset) => {
      const matchingElement = find(uniqueTokenFamilies, (uniqueTokenFamily) =>
        uniqueTokenFamily === get(asset, 'asset.asset_code'));
      return !matchingElement;
    });
  }
  return updatedAssets;
};

const listenOnNewMessages = socket => (dispatch, getState) => {

  socket.on(messages.TRANSACTIONS.RECEIVED, (e) => {
    const { nativeCurrency, network } = getState().settings;
    const address = get(e, 'meta.address');
    let transactionData = get(e, 'payload.transactions', []);
    console.log('on transactions received', transactionData);

    if (address && transactionData.length) {
      const { transactions } = getState().data;
      const lastSuccessfulTxn = find(transactions, (txn) => txn.hash && !txn.pending);
      const lastTxHash = lastSuccessfulTxn ? lastSuccessfulTxn.hash : '';
      if (lastTxHash) {
        const lastTxnHashIndex = findIndex(transactionData, (txn) => { return lastTxHash.startsWith(txn.hash) });
        if (lastTxnHashIndex > -1) {
          transactionData = slice(transactionData, 0, lastTxnHashIndex);
        }
      }
      if (!isEmpty(transactionData)) {
        const parsedTransactions = parseTransactions(transactionData, nativeCurrency);

        const partitions = partition(transactions, (txn) => txn.pending);
        const pendingTransactions = partitions[0];
        const remainingTransactions = partitions[1];

        const updatedPendingTransactions = dedupePendingTransactions(pendingTransactions, parsedTransactions)
        const updatedResults = concat(updatedPendingTransactions, parsedTransactions, remainingTransactions);
        const dedupedResults = uniqBy(updatedResults, (txn) => txn.hash);

        saveLocalTransactions(address, dedupedResults, network);
        dispatch({
          payload: dedupedResults,
          type: DATA_UPDATE_TRANSACTIONS,
        });
      }
    }
  });

  socket.on(messages.TRANSACTIONS.APPENDED, (e) => {
    const { nativeCurrency, network } = getState().settings;
    const address = get(e, 'meta.address');
    let transactionData = get(e, 'payload.transactions', []);
    console.log('on appended transactions', transactionData);
    if (address && transactionData.length) {
      const { transactions } = getState().data;
      const partitions = partition(transactions, (txn) => txn.pending);
      const pendingTransactions = partitions[0];
      const remainingTransactions = partitions[1];

      const parsedTransactions = parseTransactions(transactionData, nativeCurrency);
      const updatedPendingTransactions = dedupePendingTransactions(pendingTransactions, parsedTransactions)
      const updatedResults = concat(updatedPendingTransactions, parsedTransactions, remainingTransactions);
      const dedupedResults = uniqBy(updatedResults, (txn) => txn.hash);

      saveLocalTransactions(address, updatedResults, network);
      dispatch({
        payload: dedupedResults,
        type: DATA_UPDATE_TRANSACTIONS,
      });
    }
  });

  socket.on(messages.TRANSACTIONS.REMOVED, (e) => {
    const { nativeCurrency, network } = getState().settings;
    const address = get(e, 'meta.address');
    let transactionData = get(e, 'payload.transactions', []);
    console.log('on removed transactions', transactionData);
    if (address && transactionData.length) {
      const { transactions } = getState().data;
      const removeHashes = map(transactionData, txn => txn.hash);
      const results = remove(transactions, (txn) => includes(removeHashes, txn.hash));

      saveLocalTransactions(address, updatedResults, network);
      dispatch({
        payload: results,
        type: DATA_UPDATE_TRANSACTIONS,
      });
    }
  });

  socket.on(messages.ASSETS.RECEIVED, (e) => {
    const { network } = getState().settings;
    const { uniqueTokens } = getState().uniqueTokens;
    console.log('on received assets', e);
    const address = get(e, 'meta.address');
    const assets = get(e, 'payload.assets', []);
    const updatedAssets = dedupeUniqueTokens(assets, uniqueTokens);
    if (address && updatedAssets.length) {
      const parsedAssets = parseAccountAssets(updatedAssets);
      saveAssets(address, parsedAssets, network);
      dispatch({
        payload: parsedAssets,
        type: DATA_UPDATE_ASSETS,
      });
    }
  });

  socket.on(messages.ASSETS.APPENDED, (e) => {
    const { network } = getState().settings;
    const { uniqueTokens } = getState().uniqueTokens;
    console.log('on appended new assets', e);
    const address = get(e, 'meta.address');
    const newAssets = get(e, 'payload.assets', []);
    const updatedNewAssets = dedupeUniqueTokens(newAssets, uniqueTokens);
    if (address && newAssets.length) {
      const parsedNewAssets = parseAccountAssets(updatedNewAssets);
      const { assets } = getState().data;
      const updatedAssets = concat(assets, parsedNewAssets);
      saveAssets(address, updatedAssets, network);
      dispatch({
        payload: updatedAssets,
        type: DATA_UPDATE_ASSETS,
      });
    }
  });

  socket.on(messages.ASSETS.CHANGED, (e) => {
    const { network } = getState().settings;
    console.log('on change address assets', e);
    const address = get(e, 'meta.address');
    const changedAssets = get(e, 'payload.assets', []);
    if (address && changedAssets.length) {
      const parsedChangedAssets = parseAccountAssets(changedAssets);
      const { assets } = getState().data;
      const updatedAssets = uniqBy(concat(parsedChangedAssets, assets), (item) => item.uniqueId);
      saveAssets(address, updatedAssets, network);
      dispatch({
        payload: updatedAssets,
        type: DATA_UPDATE_ASSETS,
      });
    }
  });

  socket.on(messages.ERROR, (e) => {
    console.log('on error', e);
  });

  socket.on(messages.DISCONNECT, (e) => {
    console.log('disconnected', e);
  });
};

export const dataAddNewTransaction = txDetails => (dispatch, getState) => new Promise((resolve, reject) => {
  const { transactions } = getState().data;
  const { accountAddress, nativeCurrency, network } = getState().settings;
  parseNewTransaction(txDetails, nativeCurrency)
    .then(parsedTransaction => {
      let _transactions = [parsedTransaction, ...transactions];
      saveLocalTransactions(accountAddress, _transactions, network);
      dispatch({
        type: DATA_ADD_NEW_TRANSACTION_SUCCESS,
        payload: _transactions,
      });
      resolve(true);
    })
    .catch(error => {
      reject(false);
    });
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  addressSocket: null,
  assets: [],
  loadingAssets: false,
  transactions: [],
  loadingTransactions: false,
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
      loadingTransactions: false
    };
  case DATA_LOAD_ASSETS_REQUEST:
    return {
      ...state,
      loadingAssets: true,
    };
  case DATA_LOAD_ASSETS_SUCCESS:
    return {
      ...state,
      loadingAssets: false,
      assets: action.payload,
    };
  case DATA_LOAD_ASSETS_FAILURE:
    return {
      ...state,
      loadingAssets: false
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
