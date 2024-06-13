import { isNil } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { io, Socket } from 'socket.io-client';
import { getRemoteConfig } from '@/model/remoteConfig';
import { AppGetState, AppState } from './store';
import { getProviderForNetwork, isHardHat } from '@/handlers/web3';
import { Network } from '@/helpers/networkTypes';

// -- Constants --------------------------------------- //
const EXPLORER_UPDATE_SOCKETS = 'explorer/EXPLORER_UPDATE_SOCKETS';
const EXPLORER_CLEAR_STATE = 'explorer/EXPLORER_CLEAR_STATE';

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
 * Unsubscribes from existing asset subscriptions.
 */
const explorerUnsubscribe = () => (_: Dispatch, getState: AppGetState) => {
  const { addressSocket } = getState().explorer;
  if (!isNil(addressSocket)) {
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
export const explorerInit = () => (dispatch: ThunkDispatch<AppState, unknown, ExplorerUpdateSocketsAction>, getState: AppGetState) => {
  const { network, accountAddress } = getState().settings;
  const { addressSocket } = getState().explorer;

  // if there is another socket unsubscribe first
  if (addressSocket) {
    dispatch(explorerUnsubscribe());
  }

  const provider = getProviderForNetwork(network);
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
