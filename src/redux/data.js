import { get } from 'lodash';
import { commonStorage } from '@rainbow-me/rainbow-common';
import io from 'socket.io-client';
import { parseAccountAssets } from '../helpers/parsers';

// -- Constants --------------------------------------- //

const DATA_INIT_ASSETS = 'data/DATA_INIT_ASSETS';

// -- Actions ---------------------------------------- //

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

const createSocket = endpoint => io(
  `wss://api.zerion.io/${endpoint}`,
  {
    transports: ['websocket'],
    extraHeaders: {
      'Origin': 'ios://rainbow-wallet', // TODO hide
    },
  },
);

const addressSubscription = (address, currency) => [
  'subscribe',
  {
    //scope: ['assets', 'transactions'],
    scope: ['assets'],
    payload: {
      address,
      currency,
      "transactions_limit": 1000,
    }
  }
];

export const dataInit = () => (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const addressSocket = createSocket('address');
  addressSocket.on(messages.CONNECT, () => {
    addressSocket.emit(...addressSubscription(accountAddress, nativeCurrency.toLowerCase()));
  });
  // TODO need to move this up earlier or no?
  dispatch(listenOnNewMessages(addressSocket));
};

const listenOnNewMessages = socket => dispatch => {
  socket.on(messages.TRANSACTIONS.RECEIVED, (e) => {
    console.log('on received transactions', e);
  });

  socket.on(messages.TRANSACTIONS.APPENDED, (e) => {
    console.log('on appended transactions', e);
  });

  socket.on(messages.TRANSACTIONS.REMOVED, (e) => {
    console.log('on removed transactions', e);
  });

  socket.on(messages.ASSETS.RECEIVED, (e) => {
    console.log('on received assets', e);
    const address = get(e, 'meta.address');
    const assets = get(e, 'payload.assets', []);
    if (address && assets.length) {
      const parsedAssets = parseAccountAssets(assets);
      commonStorage.saveAssets(address, parsedAssets, 'mainnet');
      dispatch({
        payload: parsedAssets,
        type: DATA_INIT_ASSETS,
      });
    }
  });

  socket.on(messages.ASSETS.CHANGED, (e) => {
    console.log('on change address assets', e);
  });

  socket.on(messages.ERROR, (e) => {
    console.log('on error', e);
  });

  socket.on(messages.DISCONNECT, (e) => {
    console.log('disconnected', e);
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  assets: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case DATA_INIT_ASSETS:
    return { ...state, assets: action.payload };
  default:
    return state;
  }
};
