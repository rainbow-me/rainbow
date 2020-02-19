import { isNil, toLower } from 'lodash';
import { DATA_API_KEY, DATA_ORIGIN } from 'react-native-dotenv';
import io from 'socket.io-client';
import {
  addressAssetsReceived,
  compoundInfoReceived,
  transactionsReceived,
  transactionsRemoved,
} from './data';

// -- Constants --------------------------------------- //
const EXPLORER_UPDATE_SOCKETS = 'explorer/EXPLORER_UPDATE_SOCKETS';
const EXPLORER_CLEAR_STATE = 'explorer/EXPLORER_CLEAR_STATE';

const messages = {
  ADDRESS_ASSETS: {
    APPENDED: 'appended address assets',
    CHANGED: 'changed address assets',
    RECEIVED: 'received address assets',
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
  COMPOUND_INFO: {
    RECEIVED: 'received info',
  },
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
};

// -- Actions ---------------------------------------- //
let getCompoundInterval = null;

const createSocket = endpoint =>
  io(`wss://api.zerion.io/${endpoint}?api_token=${DATA_API_KEY}`, {
    extraHeaders: { Origin: DATA_ORIGIN },
    transports: ['websocket'],
  });

const addressSubscription = (address, currency, action = 'subscribe') => [
  action,
  {
    payload: {
      address,
      currency: toLower(currency),
      transactions_limit: 1000,
    },
    scope: ['assets', 'transactions'],
  },
];

const getCompoundInfo = (address, currency) => [
  'get',
  {
    payload: {
      address,
      currency: toLower(currency),
    },
    scope: ['info'],
  },
];

const explorerUnsubscribe = () => (dispatch, getState) => {
  const { addressSocket, compoundSocket } = getState().explorer;
  const { accountAddress, nativeCurrency } = getState().settings;
  if (!isNil(addressSocket)) {
    addressSocket.emit(
      ...addressSubscription(accountAddress, nativeCurrency, 'unsubscribe')
    );
    addressSocket.close();
  }
  if (!isNil(compoundSocket)) {
    compoundSocket.close();
  }
};

export const explorerClearState = () => dispatch => {
  clearInterval(getCompoundInterval);
  dispatch(explorerUnsubscribe());
  dispatch({ type: EXPLORER_CLEAR_STATE });
};

export const explorerInit = () => (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const addressSocket = createSocket('address');
  const compoundSocket = createSocket('compound');
  dispatch({
    payload: { addressSocket, compoundSocket },
    type: EXPLORER_UPDATE_SOCKETS,
  });
  addressSocket.on(messages.CONNECT, () => {
    addressSocket.emit(...addressSubscription(accountAddress, nativeCurrency));
    dispatch(listenOnAddressMessages(addressSocket));
  });
  compoundSocket.on(messages.CONNECT, () => {
    dispatch(listenOnCompoundMessages(compoundSocket));
    dispatch(refreshCompoundData());
  });
};

const refreshCompoundData = () => (dispatch, getState) => {
  const fetchCompoundData = () => {
    const { compoundSocket } = getState().explorer;
    const { accountAddress, nativeCurrency } = getState().settings;
    compoundSocket.emit(...getCompoundInfo(accountAddress, nativeCurrency));
  };
  fetchCompoundData();
  clearInterval(getCompoundInterval);
  getCompoundInterval = setInterval(fetchCompoundData, 15000); // 15 secs
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
};

const listenOnCompoundMessages = socket => dispatch => {
  socket.on(messages.COMPOUND_INFO.RECEIVED, message => {
    dispatch(compoundInfoReceived(message));
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  addressSocket: null,
  compoundSocket: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case EXPLORER_UPDATE_SOCKETS:
      return {
        ...state,
        addressSocket: action.payload.addressSocket,
        compoundSocket: action.payload.compoundSocket,
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
