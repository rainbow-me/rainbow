import { concat, get, uniqBy } from 'lodash';
import { commonStorage } from '@rainbow-me/rainbow-common';
import io from 'socket.io-client';
import { parseAccountAssets } from '../helpers/parsers';

// -- Constants --------------------------------------- //

const DATA_UPDATE_ASSETS = 'data/DATA_UPDATE_ASSETS';
const DATA_LOAD_ASSETS_REQUEST = 'data/DATA_LOAD_ASSETS_REQUEST';
const DATA_LOAD_ASSETS_SUCCESS = 'data/DATA_LOAD_ASSETS_SUCCESS';
const DATA_LOAD_ASSETS_FAILURE = 'data/DATA_LOAD_ASSETS_FAILURE';

const DATA_CLEAR_STATE = 'data/DATA_CLEAR_STATE';

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

export const assetsLoadState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({ type: DATA_LOAD_ASSETS_REQUEST });
  commonStorage.getAssets(accountAddress, network)
    .then(assets => {
      console.log('from storage', assets);
      dispatch({
        type: DATA_LOAD_ASSETS_SUCCESS,
        payload: assets,
      });
    }).catch(error => {
      console.log('assets load state error', error);
      dispatch({ type: DATA_LOAD_ASSETS_FAILURE });
    });
};

const assetsClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  commonStorage.removeAssets(accountAddress, network);
  dispatch({ type: DATA_CLEAR_STATE });
};

export const dataInit = () => (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const addressSocket = createSocket('address');
  addressSocket.on(messages.CONNECT, () => {
    addressSocket.emit(...addressSubscription(accountAddress, nativeCurrency.toLowerCase()));
  });
  // TODO need to move this up earlier or no?
  dispatch(listenOnNewMessages(addressSocket));
};

const listenOnNewMessages = socket => (dispatch, getState) => {
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
        type: DATA_UPDATE_ASSETS,
      });
    }
  });

  socket.on(messages.ASSETS.APPENDED, (e) => {
    console.log('on appended new assets', e);
    const address = get(e, 'meta.address');
    const newAssets = get(e, 'payload.assets', []);
    if (address && newAssets.length) {
      const parsedNewAssets = parseAccountAssets(newAssets);
      const { assets } = getState().data;
      const updatedAssets = concat(assets, parsedNewAssets);
      commonStorage.saveAssets(address, updatedAssets, 'mainnet');
      dispatch({
        payload: updatedAssets,
        type: DATA_UPDATE_ASSETS,
      });
    }
  });

  socket.on(messages.ASSETS.CHANGED, (e) => {
    console.log('on change address assets', e);
    const address = get(e, 'meta.address');
    const changedAssets = get(e, 'payload.assets', []);
    if (address && changedAssets.length) {
      const parsedChangedAssets = parseAccountAssets(changedAssets);
      const { assets } = getState().data;
      const updatedAssets = uniqBy(concat(parsedChangedAssets, assets), (item) => item.uniqueId);
      commonStorage.saveAssets(address, updatedAssets, 'mainnet');
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

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  assets: [],
  loadingAssets: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case DATA_UPDATE_ASSETS:
    return { ...state, assets: action.payload };
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
  case DATA_CLEAR_STATE:
    return {
      ...state,
      ...INITIAL_ASSETS_STATE,
    };
  default:
    return state;
  }
};
