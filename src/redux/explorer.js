import { concat, get, isNil, keys, map, toLower } from 'lodash';
import { DATA_API_KEY, DATA_ORIGIN } from 'react-native-dotenv';
import io from 'socket.io-client';
import { assetChartsReceived, DEFAULT_CHART_TYPE } from './charts';
import {
  addressAssetsReceived,
  assetPricesChanged,
  assetPricesReceived,
  transactionsReceived,
  transactionsRemoved,
} from './data';
import {
  fallbackExplorerClearState,
  fallbackExplorerInit,
} from './fallbackExplorer';
import { disableCharts, forceFallbackProvider } from '@rainbow-me/config/debug';
import NetworkTypes from '@rainbow-me/helpers/networkTypes';
import logger from 'logger';

// -- Constants --------------------------------------- //
const EXPLORER_UPDATE_SOCKETS = 'explorer/EXPLORER_UPDATE_SOCKETS';
const EXPLORER_CLEAR_STATE = 'explorer/EXPLORER_CLEAR_STATE';
const EXPLORER_ENABLE_FALLBACK = 'explorer/EXPLORER_ENABLE_FALLBACK';
const EXPLORER_DISABLE_FALLBACK = 'explorer/EXPLORER_DISABLE_FALLBACK';
const EXPLORER_SET_FALLBACK_HANDLER = 'explorer/EXPLORER_SET_FALLBACK_HANDLER';

const TRANSACTIONS_LIMIT = 1000;
const ZERION_ASSETS_TIMEOUT = 15000; // 15 seconds

const messages = {
  ADDRESS_ASSETS: {
    APPENDED: 'appended address assets',
    CHANGED: 'changed address assets',
    RECEIVED: 'received address assets',
    REMOVED: 'removed address assets',
  },
  ADDRESS_TRANSACTIONS: {
    APPENDED: 'appended address transactions',
    CHANGED: 'changed address transactions',
    RECEIVED: 'received address transactions',
    REMOVED: 'removed address transactions',
  },
  ASSET_CHARTS: {
    APPENDED: 'appended chart points',
    CHANGED: 'changed chart points',
    RECEIVED: 'received assets charts',
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

const assetsSubscription = (pairs, currency, action = 'subscribe') => {
  const assetCodes = concat(keys(pairs), 'eth');
  return [
    action,
    {
      payload: {
        asset_codes: assetCodes,
        currency: toLower(currency),
      },
      scope: ['prices'],
    },
  ];
};

const chartsRetrieval = (assetCodes, currency, chartType, action = 'get') => [
  action,
  {
    payload: {
      asset_codes: assetCodes,
      charts_type: chartType,
      currency: toLower(currency),
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
  const { nativeCurrency } = getState().settings;
  const { pairs } = getState().uniswap;
  if (!isNil(addressSocket)) {
    addressSocket.emit(
      ...addressSubscription(addressSubscribed, nativeCurrency, 'unsubscribe')
    );
    addressSocket.close();
  }
  if (!isNil(assetsSocket)) {
    assetsSocket.emit(
      ...assetsSubscription(pairs, nativeCurrency, 'unsubscribe')
    );
    assetsSocket.close();
  }
};

const disableFallbackIfNeeded = () => (dispatch, getState) => {
  const { fallback, assetsTimeoutHandler } = getState().explorer;

  if (fallback) {
    logger.log('😬 Disabling fallback data provider!');
    dispatch(fallbackExplorerClearState());
  }
  assetsTimeoutHandler && clearTimeout(assetsTimeoutHandler);

  dispatch({
    type: EXPLORER_DISABLE_FALLBACK,
  });
};

const isValidAssetsResponseFromZerion = msg => {
  // Check that the payload meta is valid
  if (msg?.meta?.status === 'ok') {
    // Check that there's an assets property in the payload
    if (msg.payload?.assets) {
      const assets = keys(msg.payload.assets);
      // Check that we have assets
      if (assets.length > 0) {
        return true;
      }
    }
  }
  return false;
};

export const explorerClearState = () => dispatch => {
  dispatch(disableFallbackIfNeeded());
  dispatch(explorerUnsubscribe());
  dispatch({ type: EXPLORER_CLEAR_STATE });
};

export const explorerInit = () => async (dispatch, getState) => {
  const { network, accountAddress, nativeCurrency } = getState().settings;
  const { pairs } = getState().uniswap;
  const { addressSocket, assetsSocket } = getState().explorer;

  // if there is another socket unsubscribe first
  if (addressSocket || assetsSocket) {
    dispatch(explorerUnsubscribe());
    dispatch(disableFallbackIfNeeded());
  }

  // Fallback to the testnet data provider
  // if we're not on mainnnet
  if (network !== NetworkTypes.mainnet || forceFallbackProvider) {
    return dispatch(fallbackExplorerInit());
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
  });

  dispatch(listenOnAssetMessages(newAssetsSocket));

  newAssetsSocket.on(messages.CONNECT, () => {
    newAssetsSocket.emit(...assetsSubscription(pairs, nativeCurrency));
  });

  if (network === NetworkTypes.mainnet) {
    const assetsTimeoutHandler = setTimeout(() => {
      logger.log('😬 Zerion timeout. Falling back!');
      dispatch(fallbackExplorerInit());
      dispatch({
        type: EXPLORER_ENABLE_FALLBACK,
      });
    }, ZERION_ASSETS_TIMEOUT);

    dispatch({
      payload: {
        assetsTimeoutHandler,
      },
      type: EXPLORER_SET_FALLBACK_HANDLER,
    });
  }
};

export const emitChartsRequest = (
  assetAddress,
  chartType = DEFAULT_CHART_TYPE
) => (dispatch, getState) => {
  const { nativeCurrency } = getState().settings;
  const { assetsSocket } = getState().explorer;

  let assetCodes;
  if (assetAddress) {
    assetCodes = [assetAddress];
  } else {
    const { assets } = getState().data;
    const assetAddresses = map(assets, 'address');

    const { liquidityTokens } = getState().uniswapLiquidity;
    const lpTokenAddresses = map(liquidityTokens, token => token.address);

    assetCodes = concat(assetAddresses, lpTokenAddresses);
  }
  assetsSocket?.emit?.(
    ...chartsRetrieval(assetCodes, nativeCurrency, chartType)
  );
};

const listenOnAssetMessages = socket => dispatch => {
  socket.on(messages.ASSETS.RECEIVED, message => {
    dispatch(assetPricesReceived(message));
  });

  socket.on(messages.ASSETS.CHANGED, message => {
    dispatch(assetPricesChanged(message));
  });

  socket.on(messages.ASSET_CHARTS.RECEIVED, message => {
    //logger.log('charts received', get(message, 'payload.charts', {}));
    dispatch(assetChartsReceived(message));
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
    if (!disableCharts) {
      dispatch(emitChartsRequest());
    }
    if (isValidAssetsResponseFromZerion(message)) {
      logger.log(
        '😬 Cancelling fallback data provider listener. Zerion is good!'
      );
      dispatch(disableFallbackIfNeeded());
    }
  });

  socket.on(messages.ADDRESS_ASSETS.APPENDED, message => {
    dispatch(addressAssetsReceived(message, true));
    dispatch(disableFallbackIfNeeded());
  });

  socket.on(messages.ADDRESS_ASSETS.CHANGED, message => {
    dispatch(addressAssetsReceived(message, false, true));
    dispatch(disableFallbackIfNeeded());
  });

  socket.on(messages.ADDRESS_ASSETS.REMOVED, message => {
    dispatch(addressAssetsReceived(message, false, false, true));
    dispatch(disableFallbackIfNeeded());
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  addressSocket: null,
  addressSubscribed: null,
  assetsSocket: null,
  assetsTimeoutHandler: null,
  fallback: false,
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
    case EXPLORER_DISABLE_FALLBACK:
      return {
        ...state,
        assetsTimeoutHandler: null,
        fallback: false,
      };
    case EXPLORER_ENABLE_FALLBACK:
      return {
        ...state,
        fallback: true,
      };
    case EXPLORER_SET_FALLBACK_HANDLER:
      return {
        ...state,
        assetsTimeoutHandler: action.payload.assetsTimeoutHandler,
      };
    default:
      return state;
  }
};
