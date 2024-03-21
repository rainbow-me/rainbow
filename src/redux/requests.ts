import { Dispatch } from 'redux';
import { SignClientTypes } from '@walletconnect/types';
import { AppGetState } from './store';
import { maybeSignUri } from '@/handlers/imgix';
import { getLocalRequests, removeLocalRequest, saveLocalRequests } from '@/handlers/localstorage/walletconnectRequests';
import { omitFlatten } from '@/helpers/utilities';
import { getRequestDisplayDetails } from '@/parsers';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';
import { Network } from '@/networks/types';

// -- Constants --------------------------------------- //

export const REQUESTS_UPDATE_REQUESTS_TO_APPROVE = 'requests/REQUESTS_UPDATE_REQUESTS_TO_APPROVE';
const REQUESTS_CLEAR_STATE = 'requests/REQUESTS_CLEAR_STATE';

// Requests expire automatically after 1 hour
const EXPIRATION_THRESHOLD_IN_MS = 1000 * 60 * 60;

// -- Actions ----------------------------------------- //

export interface RequestData {
  dappName: string;
  imageUrl: string | undefined;
  address: string;
  network: Network;
  dappUrl: string;
  payload: any;
  displayDetails: RequestDisplayDetails | null | Record<string, never>;
}
/**
 * A request stored in state.
 */
export interface WalletconnectRequestData extends RequestData {
  /**
   * The WalletConnect client ID for the request.
   */
  clientId: string;

  /**
   * The WalletConnect peer ID for the request.
   */
  peerId: string;

  /**
   * The request ID.
   */
  requestId: number;

  /**
   * The URL scheme to use for re-opening the dapp, or null.
   */
  dappScheme: string | null;

  /**
   * The display details loaded for the request.
   */
  displayDetails: RequestDisplayDetails | null | Record<string, never>;

  /**
   * Adds additional data to the request and serves as a notice that this
   * request originated from a WC v2 session
   */
  walletConnectV2RequestValues?: {
    sessionRequestEvent: SignClientTypes.EventArguments['session_request'];
    address: string;
    chainId: number;
    onComplete?: (type: string) => void;
  };
}

/**
 * Display details loaded for a request.
 */
interface RequestDisplayDetails {
  /**
   * Data loaded for the request, depending on the type of request.
   */
  request: any;

  /**
   * The timestamp for the request.
   */
  timestampInMs: number;
}

/**
 * Represents the current state of the `requests` reducer.
 */
interface RequestsState {
  /**
   * Current requests, as an object mapping request IDs to `WalletconnectRequestData`
   * objects.
   */
  requests: {
    [requestId: number]: WalletconnectRequestData;
  };
}

/**
 * An action for the `requests` reducer.
 */
type RequestsAction = RequestsUpdateRequestsToApproveAction | RequestsClearStateAction;

/**
 * The action for updating the requests to approve in state.
 */
interface RequestsUpdateRequestsToApproveAction {
  type: typeof REQUESTS_UPDATE_REQUESTS_TO_APPROVE;
  payload: RequestsState['requests'];
}

/**
 * The action for resetting the state.
 */
interface RequestsClearStateAction {
  type: typeof REQUESTS_CLEAR_STATE;
}

/**
 * Loads requests from local storage into state.
 */
export const requestsLoadState = () => async (dispatch: Dispatch<RequestsUpdateRequestsToApproveAction>, getState: AppGetState) => {
  const { accountAddress, network } = getState().settings;
  try {
    const requests = await getLocalRequests(accountAddress, network);
    const _requests = requests || {};
    dispatch({ payload: _requests, type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

/**
 * Adds a new request to state and updates local storage.
 *
 * @param clientId The WalletConnect client ID.
 * @param peerId The WalletConnect peer ID.
 * @param requestId The WalletConnect request ID.
 * @param payload The request payload.
 * @param peerMeta The WalletConnect peer metadata.
 */
export const addRequestToApprove =
  (
    clientId: string,
    peerId: string,
    requestId: number,
    payload: any,
    peerMeta:
      | undefined
      | null
      | {
          name?: string;
          url?: string;
          scheme?: string;
          icons?: string[];
        }
  ) =>
  (dispatch: Dispatch<RequestsUpdateRequestsToApproveAction>, getState: AppGetState) => {
    const { requests } = getState().requests;
    const { walletConnectors } = getState().walletconnect;
    const { accountAddress, network, nativeCurrency } = getState().settings;
    const walletConnector = walletConnectors[peerId];
    // @ts-expect-error "_chainId" is private.
    const chainId = walletConnector._chainId;
    const requestNetwork = ethereumUtils.getNetworkFromChainId(Number(chainId));
    // @ts-expect-error "_accounts" is private.
    const address = walletConnector._accounts[0];
    const dappNetwork = ethereumUtils.getNetworkFromChainId(Number(chainId));
    const displayDetails = getRequestDisplayDetails(payload, nativeCurrency, dappNetwork);
    const oneHourAgoTs = Date.now() - EXPIRATION_THRESHOLD_IN_MS;
    // @ts-expect-error This fails to compile as `displayDetails` does not
    // always return an object with `timestampInMs`. Still, the error thrown
    // by an invalid access might be caught or expected elsewhere, so for now
    // `ts-expect-error` is used.
    if (displayDetails.timestampInMs < oneHourAgoTs) {
      logger.log('request expired!');
      return;
    }
    const unsafeImageUrl = peerMeta?.icons?.[0];
    const imageUrl = maybeSignUri(unsafeImageUrl, { w: 200 });
    const dappName = peerMeta?.name || 'Unknown Dapp';
    const dappUrl = peerMeta?.url || 'Unknown Url';
    const dappScheme = peerMeta?.scheme || null;

    const request: WalletconnectRequestData = {
      address,
      network: requestNetwork,
      clientId,
      dappName,
      dappScheme,
      dappUrl,
      displayDetails,
      imageUrl,
      payload,
      peerId,
      requestId,
    };
    const updatedRequests = { ...requests, [requestId]: request };
    dispatch({
      payload: updatedRequests,
      type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE,
    });
    saveLocalRequests(updatedRequests, accountAddress, network);
    return request;
  };

/**
 * Filters requests that match a given client ID.
 *
 * @param topic The client ID to filter for.
 * @returns The matching requests.
 */
export const requestsForTopic =
  (topic: string | undefined) =>
  (dispatch: unknown, getState: AppGetState): WalletconnectRequestData[] => {
    const { requests } = getState().requests;
    return Object.values(requests).filter(({ clientId }) => clientId === topic);
  };

/**
 * Resets the state.
 */
export const requestsResetState = () => (dispatch: Dispatch<RequestsClearStateAction>) => dispatch({ type: REQUESTS_CLEAR_STATE });

/**
 * Removes a request from state by its request ID.
 *
 * @param requestId The request ID to remove.
 */
export const removeRequest = (requestId: number) => (dispatch: Dispatch<RequestsUpdateRequestsToApproveAction>, getState: AppGetState) => {
  const { accountAddress, network } = getState().settings;
  const { requests } = getState().requests;
  const updatedRequests = omitFlatten(requests, [requestId]);
  removeLocalRequest(accountAddress, network, requestId);
  dispatch({
    payload: updatedRequests,
    type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE,
  });
};

// -- Reducer ----------------------------------------- //

const INITIAL_STATE: RequestsState = {
  requests: {},
};

export default (state: RequestsState = INITIAL_STATE, action: RequestsAction): RequestsState => {
  switch (action.type) {
    case REQUESTS_UPDATE_REQUESTS_TO_APPROVE:
      return {
        ...state,
        requests: action.payload,
      };
    case REQUESTS_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
