import { concat, isEmpty, isNil, keyBy, keys, toLower } from 'lodash';
import io from 'socket.io-client';
import { getExperimetalFlag, L2_TXS } from '../config/experimental';
import config from '../model/config';
import { assetChartsReceived, DEFAULT_CHART_TYPE } from './charts';
import {
  addressAssetsReceived,
  assetPricesChanged,
  assetPricesReceived,
  disableGenericAssetsFallbackIfNeeded,
  portfolioReceived,
  transactionsReceived,
  transactionsRemoved,
} from './data';
/* eslint-disable-next-line import/no-cycle */
import {
  fallbackExplorerClearState,
  fallbackExplorerInit,
  fetchOnchainBalances,
} from './fallbackExplorer';
// eslint-disable-next-line import/no-cycle
import { optimismExplorerInit } from './optimismExplorer';
import { updateTopMovers } from './topMovers';
import { disableCharts, forceFallbackProvider } from '@rainbow-me/config/debug';
import { getProviderForNetwork, isHardHat } from '@rainbow-me/handlers/web3';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import currencyTypes from '@rainbow-me/helpers/currencyTypes';
import NetworkTypes from '@rainbow-me/helpers/networkTypes';
import {
  DPI_ADDRESS,
  ETH_ADDRESS,
  MATIC_MAINNET_ADDRESS,
} from '@rainbow-me/references';
import { ethereumUtils, TokensListenedCache } from '@rainbow-me/utils';
import logger from 'logger';

// -- Constants --------------------------------------- //
const EXPLORER_UPDATE_SOCKETS = 'explorer/EXPLORER_UPDATE_SOCKETS';
const EXPLORER_CLEAR_STATE = 'explorer/EXPLORER_CLEAR_STATE';
const EXPLORER_ENABLE_FALLBACK = 'explorer/EXPLORER_ENABLE_FALLBACK';
const EXPLORER_DISABLE_FALLBACK = 'explorer/EXPLORER_DISABLE_FALLBACK';
const EXPLORER_SET_FALLBACK_HANDLER = 'explorer/EXPLORER_SET_FALLBACK_HANDLER';

let assetInfoHandle = null;

const TRANSACTIONS_LIMIT = 250;
const ZERION_ASSETS_TIMEOUT = 15000; // 15 seconds
const ASSET_INFO_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const messages = {
  ADDRESS_ASSETS: {
    APPENDED: 'appended address assets',
    CHANGED: 'changed address assets',
    RECEIVED: 'received address assets',
    RECEIVED_ARBITRUM: 'received address arbitrum-assets',
    RECEIVED_POLYGON: 'received address polygon-assets',
    REMOVED: 'removed address assets',
  },
  ADDRESS_PORTFOLIO: {
    RECEIVED: 'received address portfolio',
  },
  ADDRESS_TRANSACTIONS: {
    APPENDED: 'appended address transactions',
    CHANGED: 'changed address transactions',
    RECEIVED: 'received address transactions',
    RECEIVED_ARBITRUM: 'received address arbitrum-transactions',
    RECEIVED_POLYGON: 'received address polygon-transactions',
    REMOVED: 'removed address transactions',
  },
  ASSET_CHARTS: {
    APPENDED: 'appended chart points',
    CHANGED: 'changed chart points',
    RECEIVED: 'received assets charts',
  },
  ASSET_INFO: {
    RECEIVED: 'received assets info',
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
  io(`${config.data_endpoint}/${endpoint}`, {
    extraHeaders: { origin: config.data_origin },
    query: {
      api_token: config.data_api_key,
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

const portfolioSubscription = (address, currency, action = 'get') => [
  action,
  {
    payload: {
      address,
      currency: toLower(currency),
      portfolio_fields: 'all',
    },
    scope: ['portfolio'],
  },
];

const assetPricesSubscription = (
  tokenAddresses,
  currency,
  action = 'subscribe'
) => {
  const assetCodes = concat(
    tokenAddresses,
    ETH_ADDRESS,
    DPI_ADDRESS,
    MATIC_MAINNET_ADDRESS
  );
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

const ethUSDSubscription = [
  'subscribe',
  {
    payload: {
      asset_codes: [ETH_ADDRESS],
      currency: currencyTypes.usd,
    },
    scope: ['prices'],
  },
];

const assetInfoRequest = (currency, order = 'desc') => [
  'get',
  {
    payload: {
      currency: toLower(currency),
      limit: 12,
      offset: 0,
      order_by: {
        'relative_changes.1d': order,
      },
      search_query: '#Token is:verified',
    },
    scope: ['info'],
  },
];

const addressAssetsRequest = (address, currency) => [
  'get',
  {
    payload: {
      address,
      currency: toLower(currency),
    },
    scope: ['assets'],
  },
];

const l2AddressTransactionHistoryRequest = (address, currency) => [
  'get',
  {
    payload: {
      address,
      currency: toLower(currency),
      transactions_limit: TRANSACTIONS_LIMIT,
    },
    scope: [
      `${NetworkTypes.arbitrum}-transactions`,
      `${NetworkTypes.polygon}-transactions`,
    ],
  },
];

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

export const fetchAssetPrices = assetAddress => (dispatch, getState) => {
  const { assetsSocket } = getState().explorer;
  const { nativeCurrency } = getState().settings;

  const payload = [
    'get',
    {
      payload: {
        asset_codes: [assetAddress],
        currency: toLower(nativeCurrency),
      },
      scope: ['prices'],
    },
  ];
  assetsSocket?.emit(...payload);
};

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
      ...assetPricesSubscription(keys(pairs), nativeCurrency, 'unsubscribe')
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
  const provider = await getProviderForNetwork(network);
  const providerUrl = provider?.connection?.url;
  if (
    isHardHat(providerUrl) ||
    network !== NetworkTypes.mainnet ||
    forceFallbackProvider
  ) {
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
    const newAssetsEmitted = dispatch(emitAssetRequest(keys(pairs)));
    if (!newAssetsEmitted) {
      disableGenericAssetsFallbackIfNeeded();
    }

    dispatch(emitAssetInfoRequest());
    if (!disableCharts) {
      // We need this for Uniswap Pools profit calculation
      dispatch(emitChartsRequest([ETH_ADDRESS, DPI_ADDRESS], ChartTypes.month));
      dispatch(
        emitChartsRequest([ETH_ADDRESS], ChartTypes.month, currencyTypes.usd)
      );
      dispatch(
        emitChartsRequest([ETH_ADDRESS], ChartTypes.day, currencyTypes.usd)
      );
    }
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

export const emitPortfolioRequest = (address, currency) => (
  dispatch,
  getState
) => {
  const nativeCurrency = currency || getState().settings.nativeCurrency;
  const { addressSocket } = getState().explorer;

  addressSocket?.emit(...portfolioSubscription(address, nativeCurrency));
};

export const emitAssetRequest = assetAddress => (dispatch, getState) => {
  const { nativeCurrency } = getState().settings;
  const { assetsSocket } = getState().explorer;

  const assetCodes = Array.isArray(assetAddress)
    ? assetAddress
    : [assetAddress];

  const newAssetsCodes = assetCodes.filter(
    code => !TokensListenedCache?.[nativeCurrency]?.[code]
  );

  newAssetsCodes.forEach(code => {
    if (!TokensListenedCache?.[nativeCurrency]) {
      TokensListenedCache[nativeCurrency] = {};
    }
    assetsSocket && (TokensListenedCache[nativeCurrency][code] = true);
  });

  if (assetsSocket) {
    if (newAssetsCodes.length > 0) {
      assetsSocket.emit(
        ...assetPricesSubscription(newAssetsCodes, nativeCurrency)
      );
      assetsSocket.emit(...ethUSDSubscription);
      return true;
    }
  } else {
    setTimeout(() => emitAssetRequest(assetAddress), 100);
  }
  return false;
};

export const emitAssetInfoRequest = () => (dispatch, getState) => {
  assetInfoHandle && clearTimeout(assetInfoHandle);

  const { nativeCurrency } = getState().settings;
  const { assetsSocket } = getState().explorer;
  assetsSocket?.emit(...assetInfoRequest(nativeCurrency));
  assetsSocket?.emit(...assetInfoRequest(nativeCurrency, 'asc'));

  assetInfoHandle = setTimeout(() => {
    dispatch(emitAssetInfoRequest());
  }, ASSET_INFO_TIMEOUT);
};

export const emitChartsRequest = (
  assetAddress,
  chartType = DEFAULT_CHART_TYPE,
  givenNativeCurrency
) => (dispatch, getState) => {
  const nativeCurrency =
    givenNativeCurrency || getState().settings.nativeCurrency;
  const { assetsSocket } = getState().explorer;
  const assetCodes = Array.isArray(assetAddress)
    ? assetAddress
    : [assetAddress];
  if (!isEmpty(assetCodes)) {
    assetsSocket?.emit(
      ...chartsRetrieval(assetCodes, nativeCurrency, chartType)
    );
  }
};

export const emitL2TransactionHistoryRequest = () => (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const { addressSocket } = getState().explorer;
  addressSocket.emit(
    ...l2AddressTransactionHistoryRequest(accountAddress, nativeCurrency)
  );
};

const listenOnAssetMessages = socket => dispatch => {
  socket.on(messages.ASSET_INFO.RECEIVED, message => {
    dispatch(updateTopMovers(message));
  });

  socket.on(messages.ASSETS.RECEIVED, message => {
    dispatch(assetPricesReceived(message));
  });

  socket.on(messages.ASSETS.CHANGED, message => {
    dispatch(assetPricesChanged(message));
  });

  socket.on(messages.ASSET_CHARTS.RECEIVED, message => {
    // logger.log('charts received', message?.payload?.charts);
    dispatch(assetChartsReceived(message));
  });
};

export const explorerInitL2 = (network = null) => (dispatch, getState) => {
  if (getState().settings.network === NetworkTypes.mainnet) {
    switch (network) {
      case NetworkTypes.arbitrum:
      case NetworkTypes.polygon:
        // Fetch all assets from refraction
        dispatch(fetchAssetsFromRefraction());
        break;
      case NetworkTypes.optimism:
        // Start watching optimism assets
        dispatch(optimismExplorerInit());
        break;
      default:
        // Start watching all L2 assets
        dispatch(fetchAssetsFromRefraction());
        dispatch(optimismExplorerInit());
    }
  }
};

const fetchAssetsFromRefraction = () => (_dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const { addressSocket } = getState().explorer;
  addressSocket.emit(...addressAssetsRequest(accountAddress, nativeCurrency));
};

const l2AddressAssetsReceived = (message, network) => (dispatch, getState) => {
  const { genericAssets } = getState().data;

  const newAssets = message?.payload?.assets?.map(asset => {
    const mainnetAddress = toLower(asset?.asset?.mainnet_address);
    const fallbackAsset =
      mainnetAddress &&
      (ethereumUtils.getAccountAsset(mainnetAddress) ||
        genericAssets[mainnetAddress]);

    if (fallbackAsset) {
      return {
        ...asset,
        asset: {
          ...asset?.asset,
          price: {
            ...asset?.asset?.price,
            ...fallbackAsset.price,
          },
        },
      };
    }
    return asset;
  });

  // temporary until backend supports sending back map for L2 data
  const newAssetsMap = keyBy(
    newAssets,
    asset => `${asset.asset.asset_code}_${asset.asset.network}`
  );
  const updatedMessage = {
    ...message,
    payload: {
      ...message?.payload,
      assets: newAssetsMap,
    },
  };

  dispatch(addressAssetsReceived(updatedMessage, false, false, false, network));
};

const listenOnAddressMessages = socket => dispatch => {
  socket.on(messages.ADDRESS_PORTFOLIO.RECEIVED, message => {
    dispatch(portfolioReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED, message => {
    // logger.log('mainnet txns received', message?.payload?.transactions);

    if (getExperimetalFlag(L2_TXS)) {
      dispatch(emitL2TransactionHistoryRequest());
    }
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED_ARBITRUM, message => {
    // logger.log('arbitrum txns received', message?.payload?.transactions);
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED_POLYGON, message => {
    // logger.log('polygon txns received', message?.payload?.transactions);
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.APPENDED, message => {
    logger.log('txns appended', message?.payload?.transactions);
    dispatch(transactionsReceived(message, true));
    // Fetch balances onchain to override zerion's
    // which is likely behind
    dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.CHANGED, message => {
    logger.log('txns changed', message?.payload?.transactions);
    dispatch(transactionsReceived(message, true));
    // Fetch balances onchain to override zerion's
    // which is likely behind
    dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.REMOVED, message => {
    logger.log('txns removed', message?.payload?.transactions);
    dispatch(transactionsRemoved(message));
    // Fetch balances onchain to override zerion's
    // which is likely behind
    dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
  });

  socket.on(messages.ADDRESS_ASSETS.RECEIVED_ARBITRUM, message => {
    dispatch(l2AddressAssetsReceived(message, NetworkTypes.arbitrum));
  });

  socket.on(messages.ADDRESS_ASSETS.RECEIVED_POLYGON, message => {
    dispatch(l2AddressAssetsReceived(message, NetworkTypes.polygon));
  });

  socket.on(messages.ADDRESS_ASSETS.RECEIVED, message => {
    dispatch(addressAssetsReceived(message));
    if (isValidAssetsResponseFromZerion(message)) {
      logger.log(
        '😬 Cancelling fallback data provider listener. Zerion is good!'
      );
      dispatch(disableFallbackIfNeeded());
      dispatch(explorerInitL2(NetworkTypes.optimism));
      // Fetch balances onchain to override zerion's
      // which is likely behind
      dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
    }
  });

  socket.on(messages.ADDRESS_ASSETS.APPENDED, message => {
    dispatch(addressAssetsReceived(message, true));
    dispatch(disableFallbackIfNeeded());
    // Fetch balances onchain to override zerion's
    // which is likely behind
    dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
  });

  socket.on(messages.ADDRESS_ASSETS.CHANGED, message => {
    dispatch(addressAssetsReceived(message, false, true));
    dispatch(disableFallbackIfNeeded());
    // Fetch balances onchain to override zerion's
    // which is likely behind
    dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
  });

  socket.on(messages.ADDRESS_ASSETS.REMOVED, message => {
    dispatch(addressAssetsReceived(message, false, false, true));
    dispatch(disableFallbackIfNeeded());
    // Fetch balances onchain to override zerion's
    // which is likely behind
    dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
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
