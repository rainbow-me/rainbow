import { Dispatch } from 'redux';
import { AppGetState } from './store';
import { maybeSignUri } from '@/handlers/imgix';
import {
  getLocalRequests,
  removeLocalRequest,
  saveLocalRequests,
} from '@/handlers/localstorage/walletconnectRequests';
import { dappLogoOverride, dappNameOverride } from '@/helpers/dappNameHandler';
import { omitFlatten } from '@/helpers/utilities';
import { getRequestDisplayDetails } from '@/parsers';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';

// -- Constants --------------------------------------- //

const REQUESTS_UPDATE_REQUESTS_TO_APPROVE =
  'requests/REQUESTS_UPDATE_REQUESTS_TO_APPROVE';
const REQUESTS_CLEAR_STATE = 'requests/REQUESTS_CLEAR_STATE';

// Requests expire automatically after 1 hour
const EXPIRATION_THRESHOLD_IN_MS = 1000 * 60 * 60;

// -- Actions ----------------------------------------- //

/**
 * A request stored in state.
 */
export interface RequestData {
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
   * The name of the dapp the user is connecting to.
   */
  dappName: string;

  /**
   * The URL scheme to use for re-opening the dapp, or null.
   */
  dappScheme: string | null;

  /**
   * The URL for the dapp.
   */
  dappUrl: string;

  /**
   * The display details loaded for the request.
   */
  displayDetails: RequestDisplayDetails | null | Record<string, never>;

  /**
   * The image URL for the dapp, or undefined.
   */
  imageUrl: string | undefined;

  /**
   * The payload for the request.
   */
  payload: any;
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
   * Current requests, as an object mapping request IDs to `RequestData`
   * objects.
   */
  requests: {
    [requestId: number]: RequestData;
  };
}

/**
 * An action for the `requests` reducer.
 */
type RequestsAction =
  | RequestsUpdateRequestsToApproveAction
  | RequestsClearStateAction;

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
export const requestsLoadState = () => async (
  dispatch: Dispatch<RequestsUpdateRequestsToApproveAction>,
  getState: AppGetState
) => {
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
export const addRequestToApprove = (
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
) => (
  dispatch: Dispatch<RequestsUpdateRequestsToApproveAction>,
  getState: AppGetState
) => {
  const { requests } = getState().requests;
  const { walletConnectors } = getState().walletconnect;
  const { accountAddress, network, nativeCurrency } = getState().settings;
  const walletConnector = walletConnectors[peerId];
  // @ts-expect-error "_chainId" is private.
  const chainId = walletConnector._chainId;
  const dappNetwork = ethereumUtils.getNetworkFromChainId(Number(chainId));
  const displayDetails = getRequestDisplayDetails(
    payload,
    nativeCurrency,
    dappNetwork
  );
  const oneHourAgoTs = Date.now() - EXPIRATION_THRESHOLD_IN_MS;
  // @ts-expect-error This fails to compile as `displayDetails` does not
  // always return an object with `timestampInMs`. Still, the error thrown
  // by an invalid access might be caught or expected elsewhere, so for now
  // `ts-expect-error` is used.
  if (displayDetails.timestampInMs < oneHourAgoTs) {
    logger.log('request expired!');
    return;
  }
  const unsafeImageUrl =
    dappLogoOverride(peerMeta?.url) || peerMeta?.icons?.[0];
  const imageUrl = maybeSignUri(unsafeImageUrl);
  const dappName =
    dappNameOverride(peerMeta?.url) || peerMeta?.name || 'Unknown Dapp';
  const dappUrl = peerMeta?.url || 'Unknown Url';
  const dappScheme = peerMeta?.scheme || null;

  const request: RequestData = {
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
export const requestsForTopic = (topic: string) => (
  dispatch: unknown,
  getState: AppGetState
): RequestData[] => {
  const { requests } = getState().requests;
  return Object.values(requests).filter(({ clientId }) => clientId === topic);
};

/**
 * Resets the state.
 */
export const requestsResetState = () => (
  dispatch: Dispatch<RequestsClearStateAction>
) => dispatch({ type: REQUESTS_CLEAR_STATE });

/**
 * Removes a request from state by its request ID.
 *
 * @param requestId The request ID to remove.
 */
export const removeRequest = (requestId: number) => (
  dispatch: Dispatch<RequestsUpdateRequestsToApproveAction>,
  getState: AppGetState
) => {
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

export default (
  state: RequestsState = INITIAL_STATE,
  action: RequestsAction
): RequestsState => {
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
