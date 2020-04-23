import { isNil, toLower } from 'lodash';
import { DATA_API_KEY, DATA_ORIGIN } from 'react-native-dotenv';
import io from 'socket.io-client';
import { chartExpandedAvailable } from '../config/experimental';
import NetworkTypes from '../helpers/networkTypes';
import { addressChartsReceived } from './charts';
import {
  addressAssetsReceived,
  transactionsReceived,
  transactionsRemoved,
} from './data';
import {
  testnetExplorerClearState,
  testnetExplorerInit,
} from './testnetExplorer';

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
  },
  ADDRESS_CHARTS: {
    APPENDED: 'appended chart points',
    CHANGED: 'changed chart points',
    RECEIVED: 'received address charts',
  },
  ADDRESS_TRANSACTIONS: {
    APPENDED: 'appended address transactions',
    RECEIVED: 'received address transactions',
    REMOVED: 'removed address transactions',
  },
  ASSETS: {
    CHANGED: 'changed price',
    RECEIVED: 'received assets',
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
  const { addressSocket } = getState().explorer;
  const { chartType } = getState().charts;
  const { accountAddress, nativeCurrency } = getState().settings;
  if (!isNil(addressSocket)) {
    addressSocket.emit(
      ...addressSubscription(accountAddress, nativeCurrency, 'unsubscribe')
    );
    if (chartExpandedAvailable) {
      addressSocket.emit(
        ...chartsSubscription(
          accountAddress,
          nativeCurrency,
          chartType,
          'unsubscribe'
        )
      );
    }
    addressSocket.close();
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

export const explorerInit = () => (dispatch, getState) => {
  const { network, accountAddress, nativeCurrency } = getState().settings;
  const { chartType } = getState().charts;

  // Fallback to the testnet data provider
  // if we're not on mainnnet
  if (network !== NetworkTypes.mainnet) {
    return dispatch(testnetExplorerInit());
  }

  const addressSocket = createSocket('address');
  dispatch({
    payload: addressSocket,
    type: EXPLORER_UPDATE_SOCKETS,
  });
  addressSocket.on(messages.CONNECT, () => {
    addressSocket.emit(...addressSubscription(accountAddress, nativeCurrency));
    if (chartExpandedAvailable) {
      addressSocket.emit(
        ...chartsSubscription(accountAddress, nativeCurrency, chartType)
      );
    }
    dispatch(listenOnAddressMessages(addressSocket));
  });
};

const listenOnAddressMessages = socket => dispatch => {
  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED, message => {
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.APPENDED, message => {
    dispatch(transactionsReceived(message, true));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.REMOVED, message => {
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
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case EXPLORER_UPDATE_SOCKETS:
      return {
        ...state,
        addressSocket: action.payload,
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
