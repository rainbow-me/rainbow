import { isNil, toLower } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { io, Socket } from 'socket.io-client';
import { getExperimetalFlag, L2_TXS } from '@/config/experimental';
import { getRemoteConfig } from '@/model/remoteConfig';
import { transactionsReceived, TransactionsReceivedMessage } from './data';
import { AppGetState, AppState } from './store';
import { getProviderForNetwork, isHardHat } from '@/handlers/web3';
import { Network } from '@/helpers/networkTypes';
import logger from '@/utils/logger';

// -- Constants --------------------------------------- //
const EXPLORER_UPDATE_SOCKETS = 'explorer/EXPLORER_UPDATE_SOCKETS';
const EXPLORER_CLEAR_STATE = 'explorer/EXPLORER_CLEAR_STATE';

const TRANSACTIONS_LIMIT = 250;

const messages = {
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
}

/**
 * An action for updating the `explorer` reducer's active sockets.
 */
interface ExplorerUpdateSocketsAction {
  type: typeof EXPLORER_UPDATE_SOCKETS;
  payload: Pick<ExplorerState, 'addressSocket' | 'addressSubscribed'>;
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
const createSocket = (endpoint: string): Socket => {
  const { data_endpoint, data_origin, data_api_key } = getRemoteConfig();
  return io(`${data_endpoint}/${endpoint}`, {
    extraHeaders: { origin: data_origin },
    query: {
      api_token: data_api_key,
    },
    transports: ['websocket'],
  });
};

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
 * Configures a notifications subscription.
 *
 * @param address The address to subscribe to.
 * @returns Arguments for an `emit` function call.
 */
export const notificationsSubscription = (address: string) => (_: Dispatch, getState: AppGetState) => {
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
 * Configures a layer-2 transaction history request for a given address.
 *
 * @param address The wallet address.
 * @param currency The currency to use.
 * @returns The arguments for an `emit` function call.
 */
const l2AddressTransactionHistoryRequest = (address: string, currency: string): SocketEmitArguments => [
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
 * Unsubscribes from existing asset subscriptions.
 */
const explorerUnsubscribe = () => (_: Dispatch, getState: AppGetState) => {
  const { addressSocket, addressSubscribed } = getState().explorer;
  const { nativeCurrency } = getState().settings;
  if (!isNil(addressSocket)) {
    addressSocket.emit(...addressSubscription(addressSubscribed!, nativeCurrency, 'unsubscribe'));
    addressSocket.close();
  }
};

/**
 * Clears the explorer's state and unsubscribes from listeners.
 */
export const explorerClearState = () => (dispatch: ThunkDispatch<AppState, unknown, ExplorerClearStateAction>) => {
  dispatch(explorerUnsubscribe());
  dispatch({ type: EXPLORER_CLEAR_STATE });
};

/**
 * Initializes the explorer, creating sockets and configuring listeners.
 */
export const explorerInit =
  () => async (dispatch: ThunkDispatch<AppState, unknown, ExplorerUpdateSocketsAction>, getState: AppGetState) => {
    const { network, accountAddress, nativeCurrency } = getState().settings;
    const { addressSocket } = getState().explorer;

    // if there is another socket unsubscribe first
    if (addressSocket) {
      dispatch(explorerUnsubscribe());
    }

    const provider = await getProviderForNetwork(network);
    const providerUrl = provider?.connection?.url;
    if (isHardHat(providerUrl) || network !== Network.mainnet) {
      return;
    }

    const newAddressSocket = createSocket('address');
    dispatch({
      payload: {
        addressSocket: newAddressSocket,
        addressSubscribed: accountAddress,
      },
      type: EXPLORER_UPDATE_SOCKETS,
    });

    dispatch(listenOnAddressMessages(newAddressSocket));

    newAddressSocket.on(messages.CONNECT, () => {
      newAddressSocket.emit(...addressSubscription(accountAddress, nativeCurrency));
    });
  };

/**
 * Emits a layer-2 transaction history request for the current address. The
 * result is handled by a listener in `listenOnAddressMessages`.
 */
export const emitL2TransactionHistoryRequest = () => (_: Dispatch, getState: AppGetState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const { addressSocket } = getState().explorer;
  addressSocket!.emit(...l2AddressTransactionHistoryRequest(accountAddress, nativeCurrency));
};

/**
 * Adds listeners for address information messages to a given socket.
 *
 * @param socket The socket to add listeners to.
 */
const listenOnAddressMessages = (socket: Socket) => (dispatch: ThunkDispatch<AppState, unknown, never>) => {
  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED, (message: TransactionsReceivedMessage) => {
    // logger.log('mainnet txns received', message?.payload?.transactions);

    if (getExperimetalFlag(L2_TXS)) {
      dispatch(emitL2TransactionHistoryRequest());
    }
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED_ARBITRUM, (message: TransactionsReceivedMessage) => {
    // logger.log('arbitrum txns received', message?.payload?.transactions);
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED_OPTIMISM, (message: TransactionsReceivedMessage) => {
    // logger.log('optimism txns received', message?.payload?.transactions);
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED_POLYGON, (message: TransactionsReceivedMessage) => {
    // logger.log('polygon txns received', message?.payload?.transactions);
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED_BSC, (message: TransactionsReceivedMessage) => {
    // logger.log('bsc txns received', message?.payload?.transactions);
    dispatch(transactionsReceived(message));
  });
  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED_ZORA, (message: TransactionsReceivedMessage) => {
    // logger.log('zora txns received', message?.payload?.transactions);
    dispatch(transactionsReceived(message));
  });
  socket.on(messages.ADDRESS_TRANSACTIONS.RECEIVED_BASE, (message: TransactionsReceivedMessage) => {
    // logger.log('base txns received', message?.payload?.transactions);
    dispatch(transactionsReceived(message));
  });

  socket.on(messages.ADDRESS_TRANSACTIONS.APPENDED, (message: TransactionsReceivedMessage) => {
    logger.log('txns appended', message?.payload?.transactions);
    dispatch(transactionsReceived(message, true));
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ExplorerState = {
  addressSocket: null,
  addressSubscribed: null,
};

export default (state: ExplorerState = INITIAL_STATE, action: ExplorerAction): ExplorerState => {
  switch (action.type) {
    case EXPLORER_UPDATE_SOCKETS:
      return {
        ...state,
        addressSocket: action.payload.addressSocket,
        addressSubscribed: action.payload.addressSubscribed,
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
