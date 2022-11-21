import { concat, isEmpty, isNil, keyBy, keys, toLower } from 'lodash';
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
  addressAssetsReceived,
  AddressAssetsReceivedMessage,
  assetPricesChanged,
  AssetPricesChangedMessage,
  assetPricesReceived,
  AssetPricesReceivedMessage,
  disableGenericAssetsFallbackIfNeeded,
  DISPERSION_SUCCESS_CODE,
  MessageMeta,
  portfolioReceived,
  PortfolioReceivedMessage,
  transactionsReceived,
  TransactionsReceivedMessage,
  transactionsRemoved,
  TransactionsRemovedMessage,
} from './data';
import {
  fallbackExplorerClearState,
  fallbackExplorerInit,
  fetchOnchainBalances,
  MainnetAssetDiscoveryMessage,
  onMainnetAssetDiscoveryResponse,
} from './fallbackExplorer';
import { optimismExplorerInit } from './optimismExplorer';
import { AppGetState, AppState } from './store';
import { disableCharts, forceFallbackProvider } from '@/config/debug';
import { ZerionAsset } from '@/entities';
import {
  checkForTheMerge,
  getProviderForNetwork,
  isHardHat,
} from '@/handlers/web3';
import ChartTypes, { ChartType } from '@/helpers/chartTypes';
import currencyTypes from '@/helpers/currencyTypes';
import { Network } from '@/helpers/networkTypes';
import {
  BNB_MAINNET_ADDRESS,
  DPI_ADDRESS,
  ETH_ADDRESS,
  MATIC_MAINNET_ADDRESS,
} from '@/references';
import { ethereumUtils, TokensListenedCache } from '@/utils';
import logger from '@/utils/logger';

// -- Constants --------------------------------------- //
const EXPLORER_UPDATE_SOCKETS = 'explorer/EXPLORER_UPDATE_SOCKETS';
const EXPLORER_CLEAR_STATE = 'explorer/EXPLORER_CLEAR_STATE';
const EXPLORER_ENABLE_FALLBACK = 'explorer/EXPLORER_ENABLE_FALLBACK';
const EXPLORER_DISABLE_FALLBACK = 'explorer/EXPLORER_DISABLE_FALLBACK';
const EXPLORER_SET_FALLBACK_HANDLER = 'explorer/EXPLORER_SET_FALLBACK_HANDLER';

let assetInfoHandle: ReturnType<typeof setTimeout> | null = null;

const TRANSACTIONS_LIMIT = 250;
const ZERION_ASSETS_TIMEOUT = 15000; // 15 seconds
const ASSET_INFO_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const messages = {
  ADDRESS_ASSETS: {
    APPENDED: 'appended address assets',
    CHANGED: 'changed address assets',
    RECEIVED: 'received address assets',
    RECEIVED_ARBITRUM: 'received address arbitrum-assets',
    RECEIVED_OPTIMISM: 'received address optimism-assets',
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
    RECEIVED_OPTIMISM: 'received address optimism-transactions',
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
  MAINNET_ASSET_DISCOVERY: 'received address mainnet-assets-discovery',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
};

// -- Types ------------------------------------------- //

// The `explorer` reducer's state.
interface ExplorerState {
  // A handler for the asset initialization timeout.
  assetsTimeoutHandler: ReturnType<typeof setTimeout> | null;

  // Whether or not the fallback provider is enabled.
  fallback: boolean;

  // A socket for the address endpoint.
  addressSocket: Socket | null;

  // The address subscribed to on the address socket.
  addressSubscribed: string | null;

  // A socket for the assets endpoint.
  assetsSocket: Socket | null;
}

// A `ZerionAsset` with additional fields available for L2 assets.
type ZerionAsseWithL2Fields = ZerionAsset & {
  mainnet_address: string;
  network: string;
};

/**
 * A message from the Zerion API indicating that L2 assets were received.
 * Note, unlike a `AddressAssetsReceivedMessage`, the `payload.assets` field is
 * an array, not an object.
 */
interface L2AddressAssetsReceivedMessage {
  payload?: {
    assets?: {
      asset: ZerionAsseWithL2Fields;
    }[];
  };
  meta?: MessageMeta;
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
 * An action for disabling the fallback data provider.
 */
interface ExplorerDisableFallbackAction {
  type: typeof EXPLORER_DISABLE_FALLBACK;
}

/**
 * An action for enabling the fallback data provider.
 */
interface ExplorerEnableFallbackAction {
  type: typeof EXPLORER_ENABLE_FALLBACK;
}

/**
 * An action for setting the asset timeout handler for the `explorer` reducer.
 */
interface ExplorerSetFallbackHandlerAction {
  type: typeof EXPLORER_SET_FALLBACK_HANDLER;
  payload: Pick<ExplorerState, 'assetsTimeoutHandler'>;
}

/**
 * An action for the `explorer` reducer.
 */
type ExplorerAction =
  | ExplorerUpdateSocketsAction
  | ExplorerClearStateAction
  | ExplorerDisableFallbackAction
  | ExplorerEnableFallbackAction
  | ExplorerSetFallbackHandlerAction;

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

/**
 * An ordering option, either ascending or descending.
 */
type OrderType = 'asc' | 'desc';

// -- Actions ---------------------------------------- //

/**
 * Creates a socket with a given endpoint and the correct configuration.
 *
 * @param endpoint The endpoint.
 * @returns The new socket
 */
const createSocket = (endpoint: string): Socket =>
  io(`${config.data_endpoint}/${endpoint}`, {
    // @ts-expect-error
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
    scope: ['assets', 'transactions'],
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
 * Configures a mainnet asset discovery request.
 *
 * @param address The address to request assets for.
 * @param currency The currency to use.
 * @param action The API action.
 * @returns Arguments for an `emit` function call.
 */
const mainnetAssetDiscovery = (
  address: string,
  currency: string,
  action = 'get'
): SocketEmitArguments => [
  action,
  {
    payload: {
      address,
      currency: toLower(currency),
    },
    scope: ['mainnet-assets-discovery'],
  },
];

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
    BNB_MAINNET_ADDRESS
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
 * Configures an asset information request.
 *
 * @param currency The currency to use.
 * @param order The sort order.
 * @returns The arguments for an `emit` function call.
 */
const assetInfoRequest = (
  currency: string,
  order: OrderType = 'desc'
): SocketEmitArguments => [
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

/**
 * Configures an asset request.
 *
 * @param address The wallet address.
 * @param currency The currency to use.
 * @returns The arguments for an `emit` function call.
 */
const addressAssetsRequest = (
  address: string,
  currency: string
): SocketEmitArguments => [
  'get',
  {
    payload: {
      address,
      currency: toLower(currency),
    },
    scope: ['assets'],
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
 * @param assetAddress The address to fetch.
 */
export const fetchAssetPrices = (assetAddress: string) => (
  _: Dispatch,
  getState: AppGetState
) => {
  const { assetsSocket } = getState().explorer;
  const { nativeCurrency } = getState().settings;

  const payload: SocketEmitArguments = [
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
 * Disables the fallback explorer if it has been enabled.
 */
const disableFallbackIfNeeded = () => (
  dispatch: ThunkDispatch<AppState, unknown, ExplorerDisableFallbackAction>,
  getState: AppGetState
) => {
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

/**
 * Checks whether or not a response message from Zerion is valid.
 *
 * @param msg The Zerion asset message.
 * @returns Whether or not the response is valid.
 */
const isValidAssetsResponseFromZerion = (msg: AddressAssetsReceivedMessage) => {
  // Check that the payload meta is valid
  if (msg?.meta?.status === DISPERSION_SUCCESS_CODE) {
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

/**
 * Clears the explorer's state and unsubscribes from listeners.
 */
export const explorerClearState = () => (
  dispatch: ThunkDispatch<AppState, unknown, ExplorerClearStateAction>
) => {
  dispatch(disableFallbackIfNeeded());
  dispatch(explorerUnsubscribe());
  dispatch({ type: EXPLORER_CLEAR_STATE });
};

/**
 * Initializes the explorer, creating sockets and configuring listeners.
 */
export const explorerInit = () => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    | ExplorerUpdateSocketsAction
    | ExplorerEnableFallbackAction
    | ExplorerSetFallbackHandlerAction
  >,
  getState: AppGetState
) => {
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
  checkForTheMerge(provider, network);
  if (
    isHardHat(providerUrl) ||
    network !== Network.mainnet ||
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

    // we want to get ETH info ASAP
    dispatch(emitAssetRequest(ETH_ADDRESS));

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

  if (network === Network.mainnet) {
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

/**
 * Emits a mainnet asset discovery request using the current account address.
 */
export const emitMainnetAssetDiscoveryRequest = (
  _: Dispatch,
  getState: AppGetState
) => {
  const { addressSocket } = getState().explorer;
  const { accountAddress, nativeCurrency } = getState().settings;
  addressSocket!.emit(...mainnetAssetDiscovery(accountAddress, nativeCurrency));
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
 * Emits an asset information request. The result is handled by a listener
 * in `listenOnAssetMessages`.
 */
export const emitAssetInfoRequest = () => (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  assetInfoHandle && clearTimeout(assetInfoHandle);

  const { nativeCurrency } = getState().settings;
  const { assetsSocket } = getState().explorer;
  assetsSocket?.emit(...assetInfoRequest(nativeCurrency));
  assetsSocket?.emit(...assetInfoRequest(nativeCurrency, 'asc'));

  assetInfoHandle = setTimeout(() => {
    dispatch(emitAssetInfoRequest());
  }, ASSET_INFO_TIMEOUT);
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
 * Initializes the explorer for a given layer-2 network.
 *
 * @param network The `Network` to use.
 */
export const explorerInitL2 = (network: Network | null = null) => (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  if (getState().settings.network === Network.mainnet) {
    switch (network) {
      case Network.arbitrum:
      case Network.polygon:
        // Fetch all assets from refraction
        dispatch(fetchAssetsFromRefraction());
        break;
      case Network.optimism:
        // Start watching optimism assets
        dispatch(fetchAssetsFromRefraction());
        // Once covalent supports is official, we should get rid of the optimism explorer
        dispatch(optimismExplorerInit());
        break;
      default:
        // Start watching all L2 assets
        dispatch(fetchAssetsFromRefraction());
        dispatch(optimismExplorerInit());
    }
  }
};

/**
 * Fetches the current wallet's assets. The result is handled by a listener
 * in `listenOnAddressMessages`.
 */
const fetchAssetsFromRefraction = () => (
  _: Dispatch,
  getState: AppGetState
) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const { addressSocket } = getState().explorer;
  addressSocket!.emit(...addressAssetsRequest(accountAddress, nativeCurrency));
};

/**
 * Handles an incoming Zerion message for address asset information on a
 * layer-2 network.
 *
 * @param message The Zerion message.
 * @param network The network/
 */
const l2AddressAssetsReceived = (
  message: L2AddressAssetsReceivedMessage,
  network: Network
) => (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  const { genericAssets } = getState().data;

  const newAssets:
    | { asset: ZerionAsseWithL2Fields }[]
    | undefined = message?.payload?.assets?.map(asset => {
    const mainnetAddress = toLower(asset?.asset?.mainnet_address);
    const uniqueId = `${asset?.asset?.asset_code}_${asset?.asset?.network}`;
    const fallbackAsset =
      (mainnetAddress &&
        (ethereumUtils.getAccountAsset(mainnetAddress) ||
          genericAssets[mainnetAddress])) ||
      ethereumUtils.getAccountAsset(uniqueId) ||
      genericAssets[asset?.asset?.asset_code];

    if (fallbackAsset) {
      return {
        ...asset,
        asset: {
          ...asset?.asset,
          price: {
            ...asset?.asset?.price,
            ...fallbackAsset.price,
          } as ZerionAsseWithL2Fields['price'],
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
    messages.ADDRESS_TRANSACTIONS.APPENDED,
    (message: TransactionsReceivedMessage) => {
      logger.log('txns appended', message?.payload?.transactions);
      dispatch(transactionsReceived(message, true));
      // Fetch balances onchain to override zerion's
      // which is likely behind
      dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
    }
  );

  socket.on(
    messages.ADDRESS_TRANSACTIONS.CHANGED,
    (message: TransactionsReceivedMessage) => {
      logger.log('txns changed', message?.payload?.transactions);
      dispatch(transactionsReceived(message, true));
      // Fetch balances onchain to override zerion's
      // which is likely behind
      dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
    }
  );

  socket.on(
    messages.ADDRESS_TRANSACTIONS.REMOVED,
    (message: TransactionsRemovedMessage) => {
      logger.log('txns removed', message?.payload?.transactions);
      dispatch(transactionsRemoved(message));
      // Fetch balances onchain to override zerion's
      // which is likely behind
      dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
    }
  );

  socket.on(
    messages.ADDRESS_ASSETS.RECEIVED_ARBITRUM,
    (message: L2AddressAssetsReceivedMessage) => {
      dispatch(l2AddressAssetsReceived(message, Network.arbitrum));
    }
  );

  socket.on(
    messages.ADDRESS_ASSETS.RECEIVED_OPTIMISM,
    (message: L2AddressAssetsReceivedMessage) => {
      dispatch(l2AddressAssetsReceived(message, Network.optimism));
    }
  );

  socket.on(
    messages.ADDRESS_ASSETS.RECEIVED_POLYGON,
    (message: L2AddressAssetsReceivedMessage) => {
      dispatch(l2AddressAssetsReceived(message, Network.polygon));
    }
  );

  socket.on(
    messages.ADDRESS_ASSETS.RECEIVED,
    (message: AddressAssetsReceivedMessage) => {
      dispatch(addressAssetsReceived(message));
      if (isValidAssetsResponseFromZerion(message)) {
        logger.log(
          '😬 Cancelling fallback data provider listener. Zerion is good!'
        );
        dispatch(disableFallbackIfNeeded());
        dispatch(optimismExplorerInit());
        // Fetch balances onchain to override zerion's
        // which is likely behind
        dispatch(
          fetchOnchainBalances({ keepPolling: false, withPrices: false })
        );
      }
    }
  );

  socket.on(
    messages.ADDRESS_ASSETS.APPENDED,
    (message: AddressAssetsReceivedMessage) => {
      dispatch(addressAssetsReceived(message, true));
      dispatch(disableFallbackIfNeeded());
      // Fetch balances onchain to override zerion's
      // which is likely behind
      dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
    }
  );

  socket.on(
    messages.ADDRESS_ASSETS.CHANGED,
    (message: AddressAssetsReceivedMessage) => {
      dispatch(addressAssetsReceived(message, false, true));
      dispatch(disableFallbackIfNeeded());
      // Fetch balances onchain to override zerion's
      // which is likely behind
      dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
    }
  );

  socket.on(
    messages.ADDRESS_ASSETS.REMOVED,
    (message: AddressAssetsReceivedMessage) => {
      dispatch(addressAssetsReceived(message, false, false, true));
      dispatch(disableFallbackIfNeeded());
      // Fetch balances onchain to override zerion's
      // which is likely behind
      dispatch(fetchOnchainBalances({ keepPolling: false, withPrices: false }));
    }
  );

  socket.on(
    messages.MAINNET_ASSET_DISCOVERY,
    (message: MainnetAssetDiscoveryMessage) => {
      onMainnetAssetDiscoveryResponse(message);
    }
  );
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ExplorerState = {
  addressSocket: null,
  addressSubscribed: null,
  assetsSocket: null,
  assetsTimeoutHandler: null,
  fallback: false,
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
