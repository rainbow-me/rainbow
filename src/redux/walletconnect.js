import analytics from '@segment/analytics-react-native';
import WalletConnect from '@walletconnect/react-native';
import lang from 'i18n-js';
import { forEach, mapValues, omitBy, pickBy, values } from 'lodash';
import { Alert } from 'react-native';
import {
  getAllValidWalletConnectSessions,
  saveWalletConnectSession,
  removeWalletConnect,
  removeWalletConnectSessions,
} from '../handlers/localstorage/walletconnect';
import { sendRpcCall } from '../handlers/web3';
import {
  getFCMToken,
  checkPushNotificationPermissions,
} from '../model/firebase';
import { isSigningMethod } from '../utils/signingMethods';
import { addRequestToApprove } from './requests';

// -- Constants --------------------------------------- //

const WALLETCONNECT_ADD_REQUEST = 'walletconnect/WALLETCONNECT_ADD_REQUEST';
const WALLETCONNECT_REMOVE_REQUEST =
  'walletconnect/WALLETCONNECT_REMOVE_REQUEST';

const WALLETCONNECT_ADD_SESSION = 'walletconnect/WALLETCONNECT_ADD_SESSION';
const WALLETCONNECT_REMOVE_SESSION =
  'walletconnect/WALLETCONNECT_REMOVE_SESSION';

const WALLETCONNECT_INIT_SESSIONS = 'walletconnect/WALLETCONNECT_INIT_SESSIONS';
const WALLETCONNECT_CLEAR_STATE = 'walletconnect/WALLETCONNECT_CLEAR_STATE';

// -- Actions ---------------------------------------- //
const getNativeOptions = async () => {
  const language = 'en'; // TODO use lang from settings
  const token = await getFCMToken();

  const nativeOptions = {
    clientMeta: {
      description: 'Rainbow makes exploring Ethereum fun and accessible 🌈',
      icons: ['https://avatars2.githubusercontent.com/u/48327834?s=200&v=4'],
      name: '🌈 Rainbow',
      ssl: true,
      url: 'https://rainbow.me',
    },
    push: {
      language,
      peerMeta: true,
      token,
      type: 'fcm',
      url: 'https://wcpush.rainbow.me',
    },
  };

  return nativeOptions;
};

export const walletConnectOnSessionRequest = (
  uri,
  callback
) => async dispatch => {
  let walletConnector = null;
  try {
    const nativeOptions = await getNativeOptions();
    try {
      walletConnector = new WalletConnect({ uri }, nativeOptions);
      walletConnector.on('session_request', (error, payload) => {
        if (error) {
          throw error;
        }

        const { peerId, peerMeta } = payload.params[0];
        dispatch(setPendingRequest(peerId, walletConnector));
        dispatch(walletConnectApproveSession(peerId, callback));
        analytics.track('Approved new WalletConnect session', {
          dappName: peerMeta.name,
          dappUrl: peerMeta.url,
        });
      });
    } catch (error) {
      Alert.alert(lang.t('wallet.wallet_connect.error'));
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.wallet_connect.missing_fcm'));
  }
  if (walletConnector) {
    await checkPushNotificationPermissions();
  }
};

const listenOnNewMessages = walletConnector => dispatch => {
  walletConnector.on('call_request', (error, payload) => {
    if (error) throw error;
    const { clientId, peerId, peerMeta } = walletConnector;
    const requestId = payload.id;
    if (!isSigningMethod(payload.method)) {
      sendRpcCall(payload)
        .then(result => {
          walletConnector.approveRequest({
            id: payload.id,
            result,
          });
        })
        .catch(() => {
          walletConnector.rejectRequest({
            error: { message: 'JSON RPC method not supported' },
            id: payload.id,
          });
        });
      return;
    }
    dispatch(
      addRequestToApprove(clientId, peerId, requestId, payload, peerMeta)
    );
  });
  walletConnector.on('disconnect', error => {
    if (error) throw error;
    dispatch(
      walletConnectDisconnectAllByDappName(walletConnector.peerMeta.name)
    );
  });
  return walletConnector;
};

export const walletConnectClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeWalletConnect(accountAddress, network);
  dispatch({ type: WALLETCONNECT_CLEAR_STATE });
};

export const walletConnectLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  let walletConnectors = {};
  try {
    const allSessions = await getAllValidWalletConnectSessions(
      accountAddress,
      network
    );

    const nativeOptions = await getNativeOptions();

    walletConnectors = mapValues(allSessions, session => {
      const walletConnector = new WalletConnect({ session }, nativeOptions);
      return dispatch(listenOnNewMessages(walletConnector));
    });
  } catch (error) {
    walletConnectors = {};
  }
  if (walletConnectors) {
    dispatch({
      payload: walletConnectors,
      type: WALLETCONNECT_INIT_SESSIONS,
    });
  }
};

export const setPendingRequest = (peerId, walletConnector) => (
  dispatch,
  getState
) => {
  const { pendingRequests } = getState().walletconnect;
  const updatedPendingRequests = {
    ...pendingRequests,
    [peerId]: walletConnector,
  };
  dispatch({
    payload: updatedPendingRequests,
    type: WALLETCONNECT_ADD_REQUEST,
  });
};

export const getPendingRequest = peerId => (dispatch, getState) => {
  const { pendingRequests } = getState().walletconnect;
  return pendingRequests[peerId];
};

export const removePendingRequest = peerId => (dispatch, getState) => {
  const { pendingRequests } = getState().walletconnect;
  const updatedPendingRequests = pendingRequests;
  if (updatedPendingRequests[peerId]) {
    delete updatedPendingRequests[peerId];
  }
  dispatch({
    payload: updatedPendingRequests,
    type: WALLETCONNECT_REMOVE_REQUEST,
  });
};

export const setWalletConnector = walletConnector => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const updatedWalletConnectors = {
    ...walletConnectors,
    [walletConnector.peerId]: walletConnector,
  };
  dispatch({
    payload: updatedWalletConnectors,
    type: WALLETCONNECT_ADD_SESSION,
  });
};

export const getWalletConnector = peerId => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const walletConnector = walletConnectors[peerId];
  return walletConnector;
};

export const removeWalletConnector = peerId => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const updatedWalletConnectors = walletConnectors;
  if (updatedWalletConnectors[peerId]) {
    delete updatedWalletConnectors[peerId];
  }
  dispatch({
    payload: updatedWalletConnectors,
    type: WALLETCONNECT_REMOVE_SESSION,
  });
};

export const walletConnectApproveSession = (peerId, callback) => (
  dispatch,
  getState
) => {
  const { accountAddress, chainId, network } = getState().settings;

  const walletConnector = dispatch(getPendingRequest(peerId));
  walletConnector.approveSession({
    accounts: [accountAddress],
    chainId,
  });

  dispatch(removePendingRequest(peerId));
  saveWalletConnectSession(
    walletConnector.peerId,
    walletConnector.session,
    accountAddress,
    network
  );

  const listeningWalletConnector = dispatch(
    listenOnNewMessages(walletConnector)
  );

  dispatch(setWalletConnector(listeningWalletConnector));
  if (callback) {
    callback();
  }
};

export const walletConnectRejectSession = peerId => dispatch => {
  const walletConnector = dispatch(getPendingRequest(peerId));

  walletConnector.rejectSession();

  dispatch(removePendingRequest(peerId));
};

export const walletConnectDisconnectAllByDappName = dappName => async (
  dispatch,
  getState
) => {
  const { walletConnectors } = getState().walletconnect;
  const { accountAddress, network } = getState().settings;
  const matchingWalletConnectors = values(
    pickBy(walletConnectors, session => session.peerMeta.name === dappName)
  );
  try {
    const peerIds = values(
      mapValues(
        matchingWalletConnectors,
        walletConnector => walletConnector.peerId
      )
    );
    await removeWalletConnectSessions(peerIds, accountAddress, network);
    forEach(matchingWalletConnectors, walletConnector =>
      walletConnector.killSession()
    );
    dispatch({
      payload: omitBy(walletConnectors, wc => wc.peerMeta.name === dappName),
      type: WALLETCONNECT_REMOVE_SESSION,
    });
  } catch (error) {
    Alert.alert('Failed to disconnect all WalletConnect sessions');
  }
};

export const walletConnectSendStatus = (peerId, requestId, result) => async (
  dispatch,
  getState
) => {
  const walletConnector = getState().walletconnect.walletConnectors[peerId];
  if (walletConnector) {
    try {
      if (result) {
        await walletConnector.approveRequest({ id: requestId, result });
      } else {
        await walletConnector.rejectRequest({
          error: { message: 'User rejected request' },
          id: requestId,
        });
      }
    } catch (error) {
      Alert.alert('Failed to send request status to WalletConnect.');
    }
  } else {
    Alert.alert(
      'WalletConnect session has expired while trying to send request status. Please reconnect.'
    );
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  pendingRequests: {},
  walletConnectors: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WALLETCONNECT_ADD_REQUEST:
      return { ...state, pendingRequests: action.payload };
    case WALLETCONNECT_REMOVE_REQUEST:
      return { ...state, pendingRequests: action.payload };
    case WALLETCONNECT_ADD_SESSION:
      return { ...state, walletConnectors: action.payload };
    case WALLETCONNECT_REMOVE_SESSION:
      return { ...state, walletConnectors: action.payload };
    case WALLETCONNECT_INIT_SESSIONS:
      return { ...state, walletConnectors: action.payload };
    case WALLETCONNECT_CLEAR_STATE:
      return { ...state, ...INITIAL_STATE };
    default:
      return state;
  }
};
