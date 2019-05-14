import {
  forEach,
  mapValues,
  omitBy,
  pickBy,
  values,
} from 'lodash';
import { commonStorage } from '@rainbow-me/rainbow-common';
import { Alert } from 'react-native';
import lang from 'i18n-js';
import WalletConnect from '@walletconnect/react-native';
import { getFCMToken, checkPushNotificationPermissions } from '../model/firebase';
import { addTransactionToApprove } from './transactionsToApprove';
import Navigation from '../navigation';

// -- Constants --------------------------------------- //

const WALLETCONNECT_ADD_REQUEST = 'walletconnect/WALLETCONNECT_ADD_REQUEST';
const WALLETCONNECT_REMOVE_REQUEST = 'walletconnect/WALLETCONNECT_REMOVE_REQUEST';

const WALLETCONNECT_ADD_SESSION = 'walletconnect/WALLETCONNECT_ADD_SESSION';
const WALLETCONNECT_REMOVE_SESSION = 'walletconnect/WALLETCONNECT_REMOVE_SESSION';

const WALLETCONNECT_INIT_SESSIONS = 'walletconnect/WALLETCONNECT_INIT_SESSIONS';

// -- Actions ---------------------------------------- //

// TODO store approved list
const previouslyApprovedDapps = [
];

const getNativeOptions = async () => {
  const language = 'en'; // TODO use lang from settings
  const token = await getFCMToken();

  const nativeOptions = {
    clientMeta: {
      description: 'Rainbow makes exploring Ethereum fun and accessible 🌈',
      url: 'https://rainbow.me',
      icons: ['https://avatars2.githubusercontent.com/u/48327834?s=200&v=4'],
      name: '🌈 Rainbow',
      ssl: true,
    },
    push: {
      url: 'https://wcpush.rainbow.me',
      type: 'fcm',
      token,
      peerMeta: true,
      language,
    },
  };

  return nativeOptions;
};

export const walletConnectOnSessionRequest = (uri, callback) => async (dispatch) => {
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
        /*
        if (previouslyApprovedDapps.includes(peerMeta.url)) {
          dispatch(walletConnectApproveSession(peerId));
        } else {
          Navigation.handleAction({
            routeName: 'WalletConnectConfirmationModal',
            params: { peerId, peerMeta },
          });
        }
        */
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
    if (error) {
      throw error;
    }

    const { peerId, peerMeta } = walletConnector;
    const requestId = payload.id;
    const autoOpened = true;

    const transactionDetails = dispatch(addTransactionToApprove(peerId, requestId, payload, peerMeta));

    if (transactionDetails) {
      Navigation.handleAction({
        routeName: 'ConfirmRequest',
        params: { transactionDetails, autoOpened },
      });
    } else {
      Alert.alert('This request has expired.');
    }
  });
  walletConnector.on('disconnect', (error, payload) => {
    if (error) {
      throw error;
    }

    dispatch(walletConnectDisconnectAllByDappName(walletConnector.peerMeta.name));
  });
  return walletConnector;
};

export const walletConnectInitAllConnectors = () => async dispatch => {
  let walletConnectors = {};
  try {
    const allSessions = await commonStorage.getAllValidWalletConnectSessions();

    const nativeOptions = await getNativeOptions();

    walletConnectors = mapValues(allSessions, session => {
      const walletConnector = new WalletConnect(
        {
          session,
        },
        nativeOptions,
      );
      return dispatch(listenOnNewMessages(walletConnector));
    });
  } catch (error) {
    Alert.alert('Unable to retrieve all WalletConnect sessions.');
    walletConnectors = {};
  }
  if (walletConnectors) {
    dispatch({
      payload: walletConnectors,
      type: WALLETCONNECT_INIT_SESSIONS,
    });
  }
};

export const setPendingRequest = (peerId, walletConnector) => (dispatch, getState) => {
  const { pendingRequests } = getState().walletconnect;
  const updatedPendingRequests = {
    ...pendingRequests,
    [peerId]: walletConnector,
  };
  dispatch({ type: WALLETCONNECT_ADD_REQUEST, payload: updatedPendingRequests });
};

export const getPendingRequest = (peerId) => (dispatch, getState) => {
  const { pendingRequests } = getState().walletconnect;
  return pendingRequests[peerId];
};

export const removePendingRequest = (peerId) => (dispatch, getState) => {
  const { pendingRequests } = getState().walletconnect;
  const updatedPendingRequests = pendingRequests;
  if (updatedPendingRequests[peerId]) {
    delete updatedPendingRequests[peerId];
  }
  dispatch({ type: WALLETCONNECT_REMOVE_REQUEST, payload: updatedPendingRequests });
};

export const setWalletConnector = (walletConnector) => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const updatedWalletConnectors = {
    ...walletConnectors,
    [walletConnector.peerId]: walletConnector,
  };
  dispatch({ type: WALLETCONNECT_ADD_SESSION, payload: updatedWalletConnectors });
};

export const getWalletConnector = (peerId) => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const walletConnector = walletConnectors[peerId];
  return walletConnector;
};

export const removeWalletConnector = (peerId) => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const updatedWalletConnectors = walletConnectors;
  if (updatedWalletConnectors[peerId]) {
    delete updatedWalletConnectors[peerId];
  }
  dispatch({ type: WALLETCONNECT_REMOVE_SESSION, payload: updatedWalletConnectors });
};

export const walletConnectApproveSession = (peerId, callback) => (dispatch, getState) => {
  const { accountAddress, chainId } = getState().settings;

  const walletConnector = dispatch(getPendingRequest(peerId));
  walletConnector.approveSession({ chainId, accounts: [accountAddress] });

  dispatch(removePendingRequest(peerId));
  commonStorage.saveWalletConnectSession(walletConnector.peerId, walletConnector.session);

  const listeningWalletConnector = dispatch(listenOnNewMessages(walletConnector));

  dispatch(setWalletConnector(listeningWalletConnector));
  if (callback) {
    callback();
  }
};

export const walletConnectRejectSession = (peerId) => (dispatch, getState) => {
  const walletConnector = dispatch(getPendingRequest(peerId));

  walletConnector.rejectSession();

  dispatch(removePendingRequest(peerId));
};

export const walletConnectDisconnectAllByDappName = dappName => async (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const matchingWalletConnectors = values(pickBy(walletConnectors, session => session.peerMeta.name === dappName));
  try {
    const peerIds = values(mapValues(matchingWalletConnectors, walletConnector => walletConnector.peerId));
    await commonStorage.removeWalletConnectSessions(peerIds);
    forEach(walletConnectors, walletConnector => walletConnector.killSession());
    dispatch({
      payload: omitBy(walletConnectors, (wc) => wc.peerMeta.name === dappName),
      type: WALLETCONNECT_REMOVE_SESSION,
    });
  } catch (error) {
    Alert.alert('Failed to disconnect all WalletConnect sessions');
  }
};

export const walletConnectSendStatus = (peerId, requestId, result) => async (dispatch, getState) => {
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
    Alert.alert('WalletConnect session has expired while trying to send request status. Please reconnect.');
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
  default:
    return state;
  }
};
