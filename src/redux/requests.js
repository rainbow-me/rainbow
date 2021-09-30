import { filter, omit, values } from 'lodash';
import {
  getLocalRequests,
  removeLocalRequest,
  saveLocalRequests,
} from '@rainbow-me/handlers/localstorage/walletconnectRequests';
import { getDappMetadata } from '@rainbow-me/helpers/dappNameHandler';
import { getAddressAndChainIdFromWCAccount } from '@rainbow-me/model/walletConnect';
import { getRequestDisplayDetails } from '@rainbow-me/parsers';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

// -- Constants --------------------------------------- //
const REQUESTS_UPDATE_REQUESTS_TO_APPROVE =
  'requests/REQUESTS_UPDATE_REQUESTS_TO_APPROVE';
const REQUESTS_CLEAR_STATE = 'requests/REQUESTS_CLEAR_STATE';

// Requests expire automatically after 1 hour
const EXPIRATION_THRESHOLD_IN_MS = 1000 * 60 * 60;

export const WC_VERSION_2 = 'v2';
export const WC_REQUEST_VERSION_2 = 2;
export const WC_VERSION_1 = 'v1';

export const requestsLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  try {
    const requests = await getLocalRequests(accountAddress, network);
    const _requests = requests || {};
    dispatch({ payload: _requests, type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const addRequestToApprove = (
  clientId,
  peerId,
  requestId,
  payload,
  peerMeta
) => (dispatch, getState) => {
  const { requests } = getState().requests;
  const { walletConnectors } = getState().walletconnect;
  const { accountAddress, network, nativeCurrency } = getState().settings;
  const walletConnector = walletConnectors[peerId];
  const chainId = walletConnector._chainId;
  const dappNetwork = ethereumUtils.getNetworkFromChainId(Number(chainId));
  const displayDetails = getRequestDisplayDetails(
    payload,
    nativeCurrency,
    dappNetwork
  );
  const oneHourAgoTs = Date.now() - EXPIRATION_THRESHOLD_IN_MS;
  if (displayDetails.timestampInMs < oneHourAgoTs) {
    logger.log('request expired!');
    return;
  }
  const { imageUrl, dappName, dappUrl } = getDappMetadata();
  const dappScheme = peerMeta.scheme || null;

  const request = {
    clientId,
    dappName,
    dappScheme,
    dappUrl,
    displayDetails,
    imageUrl,
    payload,
    peerId,
    requestId,
    version: WC_VERSION_1,
  };
  const updatedRequests = { ...requests, [requestId]: request };
  dispatch({
    payload: updatedRequests,
    type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE,
  });
  saveLocalRequests(updatedRequests, accountAddress, network);
  return request;
};

export const addRequestToApproveV2 = (requestId, session, payload) => (
  dispatch,
  getState
) => {
  const { requests } = getState().requests;
  const { accountAddress, network, nativeCurrency } = getState().settings;
  const account = session.state.accounts?.[0];
  const { address, chainId } = getAddressAndChainIdFromWCAccount(account);
  const dappNetwork = ethereumUtils.getNetworkFromChainId(Number(chainId));
  const displayDetails = getRequestDisplayDetails(
    payload,
    nativeCurrency,
    dappNetwork
  );
  const oneHourAgoTs = Date.now() - EXPIRATION_THRESHOLD_IN_MS;
  if (displayDetails.timestampInMs < oneHourAgoTs) {
    logger.log('request expired!');
    return;
  }
  const peerMeta = session.peer.metadata;
  const { imageUrl, dappName, dappUrl } = getDappMetadata(peerMeta);
  const dappScheme = peerMeta.scheme || null;
  const request = {
    address,
    chainId,
    dappName,
    dappScheme,
    dappUrl,
    displayDetails,
    imageUrl,
    payload,
    requestId,
    version: WC_VERSION_2,
  };
  const updatedRequests = { ...requests, [requestId]: request };
  dispatch({
    payload: updatedRequests,
    type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE,
  });
  saveLocalRequests(updatedRequests, accountAddress, network);
  return request;
};

export const requestsForTopic = topic => (dispatch, getState) => {
  const { requests } = getState().requests;
  return filter(values(requests), { clientId: topic });
};

export const requestsResetState = () => dispatch =>
  dispatch({ type: REQUESTS_CLEAR_STATE });

export const removeRequest = requestId => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { requests } = getState().requests;
  const updatedRequests = omit(requests, [requestId]);
  removeLocalRequest(accountAddress, network, requestId);
  dispatch({
    payload: updatedRequests,
    type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  requests: {},
};

export default (state = INITIAL_STATE, action) => {
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
