import { get, isNil, keys, toLower } from 'lodash';
import { DATA_API_KEY, DATA_ORIGIN } from 'react-native-dotenv';
import io from 'socket.io-client';
import { chartExpandedAvailable } from '../config/experimental';
import NetworkTypes from '../helpers/networkTypes';
import { addressChartsReceived } from './charts';
import {
  addressAssetsReceived,
  assetPricesChanged,
  assetPricesReceived,
  transactionsReceived,
  transactionsRemoved,
} from './data';
import {
  testnetExplorerClearState,
  testnetExplorerInit,
} from './testnetExplorer';
import logger from 'logger';

// -- Constants --------------------------------------- //
const EXPLORER_UPDATE_SOCKETS = 'explorer/EXPLORER_UPDATE_SOCKETS';
const EXPLORER_CLEAR_STATE = 'explorer/EXPLORER_CLEAR_STATE';

const TRANSACTIONS_LIMIT = 1000;
const ASSET_CHARTS_LIMIT = 10000;

const messages = {
  ADDRESS_ASSETS: {
    APPENDED: 'appended address assets',
    CHANGED: 'changed address assets',
    RECEIVED: 'received address assets',
    REMOVED: 'removed address assets',
  },
  ADDRESS_CHARTS: {
    APPENDED: 'appended chart points',
    CHANGED: 'changed chart points',
    RECEIVED: 'received address charts',
  },
  ADDRESS_TRANSACTIONS: {
    APPENDED: 'appended address transactions',
    CHANGED: 'changed address transactions',
    RECEIVED: 'received address transactions',
    REMOVED: 'removed address transactions',
  },
  ASSETS: {
    CHANGED: 'changed assets prices',
    RECEIVED: 'received assets prices',
  },
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
};

// -- Actions ---------------------------------------- //
const createSocket = endpoint =>
  io(`wss://api-v4.zerion.io/${endpoint}`, {
    extraHeaders: { origin: DATA_ORIGIN },
    query: {
      api_token: `${DATA_API_KEY}`,
    },
    transports: ['websocket'],
  });

const addressSubscription = (address, currency, action = 'subscribe') => [
  action,
  {
    payload: {
      address,
      currency: toLower(currency),
      transactions_limit: TRANSACTIONS_LIMIT,
    },
    scope: ['assets', 'transactions'],
  },
];

const assetsSubscription = (assetCodes, currency, action = 'subscribe') => [
  action,
  {
    payload: {
      asset_codes: assetCodes,
      currency: toLower(currency),
    },
    scope: ['prices'],
  },
];

const chartsSubscription = (
  address,
  currency,
  chartType,
  action = 'subscribe'
) => [
  action,
  {
    payload: {
      address,
      chart_type: chartType,
      currency: toLower(currency),
      max_assets: ASSET_CHARTS_LIMIT,
      min_percentage: 0,
    },
    scope: ['charts'],
  },
];

const explorerUnsubscribe = () => (dispatch, getState) => {
  const {
    addressSocket,
    addressSubscribed,
    assetsSocket,
  } = getState().explorer;
  const { chartType } = getState().charts;
  const { nativeCurrency } = getState().settings;
  const { pairs } = getState().uniswap;
  if (!isNil(addressSocket)) {
    addressSocket.emit(
      ...addressSubscription(addressSubscribed, nativeCurrency, 'unsubscribe')
    );
    if (chartExpandedAvailable) {
      addressSocket.emit(
        ...chartsSubscription(
          addressSubscribed,
          nativeCurrency,
          chartType,
          'unsubscribe'
        )
      );
    }
    addressSocket.close();
  }
  if (!isNil(assetsSocket)) {
    assetsSocket.emit(
      ...assetsSubscription(keys(pairs), nativeCurrency, 'unsubscribe')
    );
    assetsSocket.close();
  }
};

export const explorerClearState = () => (dispatch, getState) => {
  const { network } = getState().settings;
  // if we're not on mainnnet clear the testnet state
  if (network !== NetworkTypes.mainnet) {
    return testnetExplorerClearState();
  }
  dispatch(explorerUnsubscribe());
  dispatch({ type: EXPLORER_CLEAR_STATE });
};

export const explorerInit = () => async (dispatch, getState) => {
  const { network, accountAddress, nativeCurrency } = getState().settings;
  const { pairs } = getState().uniswap;
  const { chartType } = getState().charts;
  const { addressSocket, assetsSocket } = getState().explorer;

  // if there is another socket unsubscribe first
  if (addressSocket || assetsSocket) {
    dispatch(explorerUnsubscribe());
  }

  // Fallback to the testnet data provider
  // if we're not on mainnnet
  if (network !== NetworkTypes.mainnet) {
    return dispatch(testnetExplorerInit());
  }

  const newAddressSocket = createSocket('address');
  const newAssetsSocket = createSocket('assets');
  dispatch({
    payload: {
      addressSocket: newAddressSocket,
      addressSubscribed: accountAddress,
      assetsSocket: newAssetsSocket,
    },
    type: EXPLORER_UPDATE_SOCKETS,
  });

  dispatch(listenOnAddressMessages(newAddressSocket));

  newAddressSocket.on(messages.CONNECT, () => {
    newAddressSocket.emit(
      ...addressSubscription(accountAddress, nativeCurrency)
    );
    if (chartExpandedAvailable) {
      newAddressSocket.emit(
        ...chartsSubscription(accountAddress, nativeCurrency, chartType)
      );
    }
  });

  dispatch(listenOnAssetMessages(newAssetsSocket));

  newAssetsSocket.on(messages.CONNECT, () => {
    newAssetsSocket.emit(...assetsSubscription(keys(pairs), nativeCurrency));
  });
};

const listenOnAssetMessages = socket => dispatch => {
  socket.on(messages.ASSETS.RECEIVED, message => {
    dispatch(assetPricesReceived(message));
  });

  socket.on(messages.ASSETS.CHANGED, message => {
    dispatch(assetPricesChanged(message));
  });
};

const listenOnAddressMessages = socket => dispatch => {
  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED, message => {
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.APPENDED, message => {
    logger.log('txns appended', get(message, 'payload.transactions', []));
    dispatch(transactionsReceived(message, true));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.CHANGED, message => {
    logger.log('txns changed', get(message, 'payload.transactions', []));
    dispatch(transactionsReceived(message, true));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.REMOVED, message => {
    logger.log('txns removed', get(message, 'payload.transactions', []));
    dispatch(transactionsRemoved(message));
  });

  socket.on(messages.ADDRESS_ASSETS.RECEIVED, message => {
    dispatch(addressAssetsReceived(message));
  });

  socket.on(messages.ADDRESS_ASSETS.APPENDED, message => {
    dispatch(addressAssetsReceived(message, true));
  });

  socket.on(messages.ADDRESS_ASSETS.CHANGED, message => {
    dispatch(addressAssetsReceived(message, false, true));
  });

  socket.on(messages.ADDRESS_ASSETS.REMOVED, message => {
    dispatch(addressAssetsReceived(message, false, false, true));
  });

  socket.on(messages.ADDRESS_CHARTS.RECEIVED, message => {
    dispatch(addressChartsReceived(message));
  });

  socket.on(messages.ADDRESS_CHARTS.APPENDED, message => {
    dispatch(addressChartsReceived(message, true));
  });

  socket.on(messages.ADDRESS_CHARTS.CHANGED, message => {
    dispatch(addressChartsReceived(message, false, true));
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  addressSocket: null,
  addressSubscribed: null,
  assetsSocket: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case EXPLORER_UPDATE_SOCKETS:
      return {
        ...state,
        addressSocket: action.payload.addressSocket,
        addressSubscribed: action.payload.addressSubscribed,
        assetsSocket: action.payload.assetsSocket,
      };
    case EXPLORER_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
