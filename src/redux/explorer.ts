import { concat, isEmpty, isNil, keys, toLower } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { io, Socket } from 'socket.io-client';
import { getExperimetalFlag, L2_TXS } from '../config/experimental';
import config from '../model/config';
import {
  assetChartsReceived,
  ChartsReceivedMessage,
  DEFAULT_CHART_TYPE,
} from './charts';
import {
  assetPricesChanged,
  AssetPricesChangedMessage,
  assetPricesReceived,
  AssetPricesReceivedMessage,
  portfolioReceived,
  PortfolioReceivedMessage,
  transactionsReceived,
  TransactionsReceivedMessage,
} from './data';
import { AppGetState, AppState } from './store';
import { disableCharts } from '@/config/debug';
import { getProviderForNetwork, isHardHat } from '@/handlers/web3';
import ChartTypes, { ChartType } from '@/helpers/chartTypes';
import currencyTypes from '@/helpers/currencyTypes';
import { Network } from '@/helpers/networkTypes';
import {
  BNB_MAINNET_ADDRESS,
  DPI_ADDRESS,
  ETH_ADDRESS,
  MATIC_MAINNET_ADDRESS,
  OP_ADDRESS,
} from '@/references';
import { TokensListenedCache } from '@/utils';
import logger from '@/utils/logger';

// -- Constants --------------------------------------- //
const EXPLORER_UPDATE_SOCKETS = 'explorer/EXPLORER_UPDATE_SOCKETS';
const EXPLORER_CLEAR_STATE = 'explorer/EXPLORER_CLEAR_STATE';

const TRANSACTIONS_LIMIT = 250;

const messages = {
  ADDRESS_PORTFOLIO: {
    RECEIVED: 'received address portfolio',
  },
  ADDRESS_TRANSACTIONS: {
    APPENDED: 'appended address transactions',
    RECEIVED: 'received address transactions',
    RECEIVED_ARBITRUM: 'received address arbitrum-transactions',
    RECEIVED_OPTIMISM: 'received address optimism-transactions',
    RECEIVED_POLYGON: 'received address polygon-transactions',
    RECEIVED_BSC: 'received address bsc-transactions',
    RECEIVED_ZORA: 'received address zora-transactions',
    RECEIVED_BASE: 'received address base-transactions',
  },
  ASSET_CHARTS: {
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

// -- Types ------------------------------------------- //

// The `explorer` reducer's state.
interface ExplorerState {
  // A socket for the address endpoint.
  addressSocket: Socket | null;

  // The address subscribed to on the address socket.
  addressSubscribed: string | null;

  // A socket for the assets endpoint.
  assetsSocket: Socket | null;
}

/**
 * An action for updating the `explorer` reducer's active sockets.
 */
interface ExplorerUpdateSocketsAction {
  type: typeof EXPLORER_UPDATE_SOCKETS;
  payload: Pick<
    ExplorerState,
    'addressSocket' | 'addressSubscribed' | 'assetsSocket'
  >;
}

/**
 * An action for clearing the `explorer` reducer's state.
 */
interface ExplorerClearStateAction {
  type: typeof EXPLORER_CLEAR_STATE;
}

/**
 * An action for the `explorer` reducer.
 */
type ExplorerAction = ExplorerUpdateSocketsAction | ExplorerClearStateAction;

/**
 * A socket subscription action for the Zerion API.
 * See https://docs.zerion.io/websockets/websocket-api-overview#actions.
 */
type SocketSubscriptionActionType = 'subscribe' | 'unsubscribe';

/**
 * A socket "get" action for the Zerion API. See
 * https://docs.zerion.io/websockets/websocket-api-overview#actions.
 */
type SocketGetActionType = 'get';

/**
 * An array representing arguments for a call to `emit` on a socket.
 */
type SocketEmitArguments = Parameters<Socket['emit']>;

// -- Actions ---------------------------------------- //

/**
 * Creates a socket with a given endpoint and the correct configuration.
 *
 * @param endpoint The endpoint.
 * @returns The new socket
 */
const createSocket = (endpoint: string): Socket =>
  io(`${config.data_endpoint}/${endpoint}`, {
    extraHeaders: { origin: config.data_origin },
    query: {
      api_token: config.data_api_key,
    },
    transports: ['websocket'],
  });

/**
 * Configures a subscription to an address.
 *
 * @param address The address.
 * @param currency The currency to use.
 * @param action The subscription asset.
 * @returns The arguments for the `emit` function call.
 */
const addressSubscription = (
  address: string,
  currency: string,
  action: SocketSubscriptionActionType = 'subscribe'
): SocketEmitArguments => [
  action,
  {
    payload: {
      address,
      currency: toLower(currency),
      transactions_limit: TRANSACTIONS_LIMIT,
    },
    scope: ['transactions'],
  },
];

/**
 * Configures a portfolio subscription.
 *
 * @param address The address to subscribe to.
 * @param currency The currency to use.
 * @param action The API action.
 * @returns Arguments for an `emit` function call.
 */
const portfolioSubscription = (
  address: string,
  currency: string,
  action: SocketGetActionType = 'get'
): SocketEmitArguments => [
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

/**
 * Configures a notifications subscription.
 *
 * @param address The address to subscribe to.
 * @returns Arguments for an `emit` function call.
 */
export const notificationsSubscription = (address: string) => (
  _: Dispatch,
  getState: AppGetState
) => {
  const { addressSocket } = getState().explorer;

  const payload: SocketEmitArguments = [
    'get',
    {
      payload: {
        address,
        action: 'subscribe',
      },
      scope: ['notifications'],
    },
  ];
  addressSocket?.emit(...payload);
};

/**
 * Configures an asset price subscription.
 *
 * @param tokenAddresses The token addresses to watch.
 * @param currency The currency to use.
 * @param action The subscription action.
 * @returns The arguments for an `emit` function call.
 */
const assetPricesSubscription = (
  tokenAddresses: string[],
  currency: string,
  action: SocketSubscriptionActionType = 'subscribe'
): SocketEmitArguments => {
  const assetCodes = concat(
    tokenAddresses,
    ETH_ADDRESS,
    DPI_ADDRESS,
    MATIC_MAINNET_ADDRESS,
    BNB_MAINNET_ADDRESS,
    OP_ADDRESS
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

/**
 * Arguments to `emit` for an ETH-USD price subscription.
 */
const ethUSDSubscription: SocketEmitArguments = [
  'subscribe',
  {
    payload: {
      asset_codes: [ETH_ADDRESS],
      currency: currencyTypes.usd,
    },
    scope: ['prices'],
  },
];

/**
 * Configures a layer-2 transaction history request for a given address.
 *
 * @param address The wallet address.
 * @param currency The currency to use.
 * @returns The arguments for an `emit` function call.
 */
const l2AddressTransactionHistoryRequest = (
  address: string,
  currency: string
): SocketEmitArguments => [
  'get',
  {
    payload: {
      address,
      currency: toLower(currency),
      transactions_limit: TRANSACTIONS_LIMIT,
    },
    scope: [
      `${Network.arbitrum}-transactions`,
      `${Network.optimism}-transactions`,
      `${Network.polygon}-transactions`,
      `${Network.bsc}-transactions`,
      `${Network.zora}-transactions`,
      `${Network.base}-transactions`,
    ],
  },
];

/**
 * Configures a chart retrieval request for assets.
 *
 * @param assetCodes The asset addresses.
 * @param currency The currency to use.
 * @param chartType The `ChartType` to use.
 * @param action The request action.
 * @returns Arguments for an `emit` function call.
 */
const chartsRetrieval = (
  assetCodes: string[],
  currency: string,
  chartType: ChartType,
  action: SocketGetActionType = 'get'
): SocketEmitArguments => [
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

/**
 * Emits an asset price request. The result is handled by a listener in
 * `listenOnAssetMessages`.
 *
 * @param assetAddress The address or addresses to fetch.
 */
export const fetchAssetPrices = (assetAddress: string | string[]) => (
  _: Dispatch,
  getState: AppGetState
) => {
  const { assetsSocket } = getState().explorer;
  const { nativeCurrency } = getState().settings;

  const assetCodes = Array.isArray(assetAddress)
    ? assetAddress
    : [assetAddress];

  const payload: SocketEmitArguments = [
    'get',
    {
      payload: {
        asset_codes: assetCodes,
        currency: toLower(nativeCurrency),
      },
      scope: ['prices'],
    },
  ];
  assetsSocket?.emit(...payload);
};

/**
 * Unsubscribes from existing asset subscriptions.
 */
const explorerUnsubscribe = () => (_: Dispatch, getState: AppGetState) => {
  const {
    addressSocket,
    addressSubscribed,
    assetsSocket,
  } = getState().explorer;
  const { nativeCurrency } = getState().settings;
  const { pairs } = getState().uniswap;
  if (!isNil(addressSocket)) {
    addressSocket.emit(
      ...addressSubscription(addressSubscribed!, nativeCurrency, 'unsubscribe')
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

/**
 * Clears the explorer's state and unsubscribes from listeners.
 */
export const explorerClearState = () => (
  dispatch: ThunkDispatch<AppState, unknown, ExplorerClearStateAction>
) => {
  dispatch(explorerUnsubscribe());
  dispatch({ type: EXPLORER_CLEAR_STATE });
};

/**
 * Initializes the explorer, creating sockets and configuring listeners.
 */
export const explorerInit = () => async (
  dispatch: ThunkDispatch<AppState, unknown, ExplorerUpdateSocketsAction>,
  getState: AppGetState
) => {
  const { network, accountAddress, nativeCurrency } = getState().settings;
  const { pairs } = getState().uniswap;
  const { addressSocket, assetsSocket } = getState().explorer;

  // if there is another socket unsubscribe first
  if (addressSocket || assetsSocket) {
    dispatch(explorerUnsubscribe());
  }

  const provider = await getProviderForNetwork(network);
  const providerUrl = provider?.connection?.url;
  if (isHardHat(providerUrl) || network !== Network.mainnet) {
    return;
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
    dispatch(emitAssetRequest(keys(pairs)));

    // we want to get ETH info ASAP
    dispatch(emitAssetRequest(ETH_ADDRESS));

    if (!disableCharts) {
      // We need this for Uniswap Pools profit calculation
      dispatch(emitChartsRequest([ETH_ADDRESS, DPI_ADDRESS], ChartTypes.month));
      dispatch(
        emitChartsRequest([ETH_ADDRESS], ChartTypes.day, currencyTypes.usd)
      );
    }
  });
};

/**
 * Emits a portfolio request. The result is handled by a listener in
 * `listenOnAddressMessages`.
 *
 * @param address The address.
 * @param currency The currency to use.
 */
export const emitPortfolioRequest = (address: string, currency?: string) => (
  _: Dispatch,
  getState: AppGetState
) => {
  const nativeCurrency = currency || getState().settings.nativeCurrency;
  const { addressSocket } = getState().explorer;

  addressSocket?.emit(...portfolioSubscription(address, nativeCurrency));
};

/**
 * Subscribes to asset price information. The result is handled by a listener
 * in `listenOnAssetMessages`.
 *
 * @param assetAddress The asset address or addresses to request.
 */
export const emitAssetRequest = (assetAddress: string | string[]) => (
  _: Dispatch,
  getState: AppGetState
) => {
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

/**
 * Emits a chart information request for an asset or assets. The result
 * is handled by a listener in `listenOnAssetMessages`.
 *
 * @param assetAddress The asset address or addresses.
 * @param chartType The `ChartType` to request.
 * @param givenNativeCurrency The currency to use.
 */
export const emitChartsRequest = (
  assetAddress: string | string[],
  chartType: ChartType = DEFAULT_CHART_TYPE,
  givenNativeCurrency?: string | undefined
) => (_: Dispatch, getState: AppGetState) => {
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

/**
 * Emits a layer-2 transaction history request for the current address. The
 * result is handled by a listener in `listenOnAddressMessages`.
 */
export const emitL2TransactionHistoryRequest = () => (
  _: Dispatch,
  getState: AppGetState
) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const { addressSocket } = getState().explorer;
  addressSocket!.emit(
    ...l2AddressTransactionHistoryRequest(accountAddress, nativeCurrency)
  );
};

/**
 * Adds asset message listeners to a given socket.
 *
 * @param socket The socket to add listeners to.
 */
const listenOnAssetMessages = (socket: Socket) => (
  dispatch: ThunkDispatch<AppState, unknown, never>
) => {
  socket.on(messages.ASSETS.RECEIVED, (message: AssetPricesReceivedMessage) => {
    dispatch(assetPricesReceived(message));
  });

  socket.on(messages.ASSETS.CHANGED, (message: AssetPricesChangedMessage) => {
    dispatch(assetPricesChanged(message));
  });

  socket.on(
    messages.ASSET_CHARTS.RECEIVED,
    (message: ChartsReceivedMessage) => {
      // logger.log('charts received', message?.payload?.charts);
      dispatch(assetChartsReceived(message));
    }
  );
};

/**
 * Adds listeners for address information messages to a given socket.
 *
 * @param socket The socket to add listeners to.
 */
const listenOnAddressMessages = (socket: Socket) => (
  dispatch: ThunkDispatch<AppState, unknown, never>
) => {
  socket.on(
    messages.ADDRESS_PORTFOLIO.RECEIVED,
    (message: PortfolioReceivedMessage) => {
      dispatch(portfolioReceived(message));
    }
  );

  socket.on(
    messages.ADDRESS_TRANSACTIONS.RECEIVED,
    (message: TransactionsReceivedMessage) => {
      // logger.log('mainnet txns received', message?.payload?.transactions);

      if (getExperimetalFlag(L2_TXS)) {
        dispatch(emitL2TransactionHistoryRequest());
      }
      dispatch(transactionsReceived(message));
    }
  );

  socket.on(
    messages.ADDRESS_TRANSACTIONS.RECEIVED_ARBITRUM,
    (message: TransactionsReceivedMessage) => {
      // logger.log('arbitrum txns received', message?.payload?.transactions);
      dispatch(transactionsReceived(message));
    }
  );

  socket.on(
    messages.ADDRESS_TRANSACTIONS.RECEIVED_OPTIMISM,
    (message: TransactionsReceivedMessage) => {
      // logger.log('optimism txns received', message?.payload?.transactions);
      dispatch(transactionsReceived(message));
    }
  );

  socket.on(
    messages.ADDRESS_TRANSACTIONS.RECEIVED_POLYGON,
    (message: TransactionsReceivedMessage) => {
      // logger.log('polygon txns received', message?.payload?.transactions);
      dispatch(transactionsReceived(message));
    }
  );

  socket.on(
    messages.ADDRESS_TRANSACTIONS.RECEIVED_BSC,
    (message: TransactionsReceivedMessage) => {
      // logger.log('bsc txns received', message?.payload?.transactions);
      dispatch(transactionsReceived(message));
    }
  );
  socket.on(
    messages.ADDRESS_TRANSACTIONS.RECEIVED_ZORA,
    (message: TransactionsReceivedMessage) => {
      // logger.log('zora txns received', message?.payload?.transactions);
      dispatch(transactionsReceived(message));
    }
  );
  socket.on(
    messages.ADDRESS_TRANSACTIONS.RECEIVED_BASE,
    (message: TransactionsReceivedMessage) => {
      // logger.log('base txns received', message?.payload?.transactions);
      dispatch(transactionsReceived(message));
    }
  );

  socket.on(
    messages.ADDRESS_TRANSACTIONS.APPENDED,
    (message: TransactionsReceivedMessage) => {
      logger.log('txns appended', message?.payload?.transactions);
      dispatch(transactionsReceived(message, true));
    }
  );
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ExplorerState = {
  addressSocket: null,
  addressSubscribed: null,
  assetsSocket: null,
};

export default (
  state: ExplorerState = INITIAL_STATE,
  action: ExplorerAction
): ExplorerState => {
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
