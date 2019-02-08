import {
  omitBy, pickBy, forEach, mapValues, values,
} from 'lodash';
import { commonStorage } from 'balance-common';
import { AlertIOS } from 'react-native';
import lang from 'i18n-js';
import WalletConnect from '@walletconnect/react-native';
import { DEVICE_LANGUAGE } from '../helpers/constants';
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

const whitelist = [
  'https://manager.balance.io',
];

const getNativeOptions = async () => {
  const language = DEVICE_LANGUAGE.replace(/[-_](\w?)+/gi, '').toLowerCase();
  const token = await getFCMToken();

  const nativeOptions = {
    clientMeta: {
      description: 'Store and secure all your ERC-20 tokens in one place',
      url: 'https://balance.io',
      icons: ['https://avatars0.githubusercontent.com/u/19879255?s=200&v=4'],
      name: 'Balance Wallet',
      ssl: true,
    },
    push: {
      url: 'https://us-central1-balance-424a3.cloudfunctions.net',
      type: 'fcm',
      token,
      peerMeta: true,
      language,
    },
  };

  return nativeOptions;
};

export const walletConnectOnSessionRequest = (uriString) => async (dispatch) => {
  let walletConnector = null;
  try {
    const nativeOptions = await getNativeOptions();
    try {
      console.log('walletConnectOnSessionRequest uriString', uriString);
      walletConnector = new WalletConnect(
        {
          uri: uriString,
        },
        nativeOptions,
      );
      await commonStorage.saveWalletConnectSession(walletConnector.peerId, walletConnector.session);
    } catch (error) {
      console.log(error);
      AlertIOS.alert(lang.t('wallet.wallet_connect.error'));
    }
  } catch (error) {
    AlertIOS.alert(lang.t('wallet.wallet_connect.missing_fcm'));
  }
  if (walletConnector) {
    await checkPushNotificationPermissions();

    dispatch(setPendingRequest(walletConnector));

    walletConnector.on('wc_sessionRequest', (error, payload) => {
      if (error) {
        throw error;
      }

      const { peerId, peerMeta } = payload.params[0];
      console.log('on("wc_sessionRequest")', peerMeta);

      // TODO: Delete next line and fix open WalletConnectConfimationModal
      dispatch(walletConnectApproveSession(walletConnector.handshakeTopic));
      // if (whitelist.includes(peerMeta.url)) {
      //   dispatch(walletConnectApproveSession(walletConnector.handshakeTopic));
      // } else {
      //   console.log('open WalletConnectConfimationModal');
      //   Navigation.handleAction({
      //     routeName: 'WalletConnectConfimationModal',
      //     params: { handshakeTopic: walletConnector.handshakeTopic, peerId, peerMeta },
      //   });
      // }
    });
  }
};

export const walletConnectInitAllConnectors = () => async dispatch => {
  let walletConnectors = {};
  try {
    const allSessions = await commonStorage.getAllValidWalletConnectSessions();

    const nativeOptions = getNativeOptions();

    walletConnectors = mapValues(allSessions, session => {
      const walletConnector = new WalletConnect(
        {
          session,
        },
        nativeOptions,
      );
      return walletConnector;
    });
  } catch (error) {
    AlertIOS.alert('Unable to retrieve all WalletConnect sessions.');
    walletConnectors = {};
  }
  if (walletConnectors) {
    dispatch({
      payload: walletConnectors,
      type: WALLETCONNECT_INIT_SESSIONS,
    });
  }
};

export const setPendingRequest = (walletConnector) => (dispatch, getState) => {
  const { pendingRequests } = getState().walletconnect;
  console.log('setPendingRequest handshakeTopic', walletConnector.handshakeTopic);
  const updatedPendingRequests = {
    ...pendingRequests,
    [walletConnector.handshakeTopic]: walletConnector,
  };
  dispatch({ type: WALLETCONNECT_ADD_REQUEST, payload: updatedPendingRequests });
};

export const getPendingRequest = (handshakeTopic) => (dispatch, getState) => {
  const { pendingRequests } = getState().walletconnect;
  console.log('setPendingRequest handshakeTopic', handshakeTopic);
  const pendingRequest = pendingRequests[handshakeTopic];
  return pendingRequest;
};

export const removePendingRequest = (handshakeTopic) => (dispatch, getState) => {
  const { pendingRequests } = getState().walletconnect;
  const updatedPendingRequests = pendingRequests;
  console.log('removePendingRequest handshakeTopic', handshakeTopic);
  if (updatedPendingRequests[handshakeTopic]) {
    delete updatedPendingRequests[handshakeTopic];
  }
  dispatch({ type: WALLETCONNECT_REMOVE_REQUEST, payload: updatedPendingRequests });
};

export const setWalletConnector = (walletConnector) => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  console.log('setWalletConnector handshakeTopic', walletConnector.handshakeTopic);
  console.log('setWalletConnector peerId', walletConnector.peerId);
  const updatedWalletConnectors = {
    ...walletConnectors,
    [walletConnector.peerId]: walletConnector,
  };
  dispatch({ type: WALLETCONNECT_ADD_SESSION, payload: updatedWalletConnectors });
};

export const getWalletConnector = (peerId) => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  console.log('setWalletConnector peerId', peerId);
  const walletConnector = walletConnectors[peerId];
  return walletConnector;
};

export const removeWalletConnector = (peerId) => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const updatedWalletConnectors = walletConnectors;
  console.log('removeWalletConnector peerId', peerId);
  if (updatedWalletConnectors[peerId]) {
    delete updatedWalletConnectors[peerId];
  }
  dispatch({ type: WALLETCONNECT_REMOVE_SESSION, payload: updatedWalletConnectors });
};

export const walletConnectApproveSession = (handshakeTopic) => (dispatch, getState) => {
  // TODO: Replace fixed chainId with getState().settings value
  const chainId = 1;
  const { accountAddress } = getState().settings;
  // const { accountAddress, chainId } = getState().settings;

  const walletConnector = dispatch(getPendingRequest(handshakeTopic));

  walletConnector.approveSession({ chainId, accounts: [accountAddress] });

  dispatch(removePendingRequest(handshakeTopic));

  walletConnector.on('call_request', (error, payload) => {
    if (error) {
      throw error;
    }

    const { peerId } = walletConnector;
    const requestId = payload.id;
    const dappName = walletConnector.peerMeta.name;
    const autoOpened = true;

    const transactionDetails = dispatch(addTransactionToApprove(peerId, requestId, payload, dappName));

    if (transactionDetails) {
      Navigation.handleAction({
        routeName: 'ConfirmRequest',
        params: { transactionDetails, autoOpened },
      });
    } else {
      AlertIOS.alert('This request has expired.');
    }
  });

  walletConnector.on('disconnect', (error, payload) => {
    if (error) {
      throw error;
    }

    dispatch(walletConnectDisconnectAllByDappName(walletConnector.peerMeta.name));
  });

  dispatch(setWalletConnector(walletConnector));
};

export const walletConnectRejectSession = (handshakeTopic) => (dispatch, getState) => {
  const walletConnector = dispatch(getPendingRequest(handshakeTopic));

  walletConnector.rejectSession();

  dispatch(removePendingRequest(handshakeTopic));
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
    AlertIOS.alert('Failed to disconnect all WalletConnect sessions');
  }
};

export const walletConnectSendStatus = (peerId, requestId, result) => async (dispatch, getState) => {
  const walletConnector = getState().walletconnect.walletConnectors[peerId];
  if (walletConnector) {
    try {
      if (result) {
        await walletConnector.approveCallRequest(requestId, { result });
      } else {
        await walletConnector.rejectCallRequest(requestId);
      }
    } catch (error) {
      AlertIOS.alert('Failed to send request status to WalletConnect.');
    }
  } else {
    AlertIOS.alert('WalletConnect session has expired while trying to send request status. Please reconnect.');
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
