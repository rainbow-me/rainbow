import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import WalletConnect from '@walletconnect/client';
import lang from 'i18n-js';
import {
  clone,
  forEach,
  get,
  isEmpty,
  mapValues,
  omitBy,
  pickBy,
  values,
} from 'lodash';
import { Alert, InteractionManager, Linking } from 'react-native';
import {
  getAllValidWalletConnectSessions,
  removeWalletConnectSessions,
  saveWalletConnectSession,
} from '../handlers/localstorage/walletconnectSessions';
import { sendRpcCall } from '../handlers/web3';
import { dappLogoOverride, dappNameOverride } from '../helpers/dappNameHandler';
import WalletTypes from '../helpers/walletTypes';
import { getFCMToken } from '../model/firebase';
import { Navigation } from '../navigation';
import { isSigningMethod } from '../utils/signingMethods';
import { addRequestToApprove } from './requests';
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { convertHexToString } from '@rainbow-me/helpers/utilities';
import WalletConnectApprovalSheetType from '@rainbow-me/helpers/walletConnectApprovalSheetTypes';
import Routes from '@rainbow-me/routes';
import { ethereumUtils, watchingAlert } from '@rainbow-me/utils';
import logger from 'logger';

// -- Constants --------------------------------------- //

const WALLETCONNECT_ADD_REQUEST = 'walletconnect/WALLETCONNECT_ADD_REQUEST';
const WALLETCONNECT_REMOVE_REQUEST =
  'walletconnect/WALLETCONNECT_REMOVE_REQUEST';

const WALLETCONNECT_ADD_SESSION = 'walletconnect/WALLETCONNECT_ADD_SESSION';
const WALLETCONNECT_REMOVE_SESSION =
  'walletconnect/WALLETCONNECT_REMOVE_SESSION';

const WALLETCONNECT_INIT_SESSIONS = 'walletconnect/WALLETCONNECT_INIT_SESSIONS';
const WALLETCONNECT_UPDATE_CONNECTORS =
  'walletconnect/WALLETCONNECT_UPDATE_CONNECTORS';

const WALLETCONNECT_CLEAR_STATE = 'walletconnect/WALLETCONNECT_CLEAR_STATE';

const WALLETCONNECT_SET_PENDING_REDIRECT =
  'walletconnect/WALLETCONNECT_SET_PENDING_REDIRECT';
const WALLETCONNECT_REMOVE_PENDING_REDIRECT =
  'walletconnect/WALLETCONNECT_REMOVE_PENDING_REDIRECT';

// -- Actions ---------------------------------------- //
const getNativeOptions = async () => {
  const language = 'en'; // TODO use lang from settings
  let token = null;
  try {
    token = await getFCMToken();
  } catch (error) {
    logger.log(
      'Error getting FCM token, ignoring token for WC connection',
      error
    );
  }

  const nativeOptions = {
    clientMeta: {
      description: 'Rainbow makes exploring Ethereum fun and accessible 🌈',
      icons: ['https://avatars2.githubusercontent.com/u/48327834?s=200&v=4'],
      name: '🌈 Rainbow',
      ssl: true,
      url: 'https://rainbow.me',
    },
    push: token
      ? {
          language,
          peerMeta: true,
          token,
          type: 'fcm',
          url: 'https://wcpush.rainbow.me',
        }
      : undefined,
  };

  return nativeOptions;
};

export const walletConnectSetPendingRedirect = () => dispatch => {
  dispatch({
    type: WALLETCONNECT_SET_PENDING_REDIRECT,
  });
};
export const walletConnectRemovePendingRedirect = (
  type,
  scheme
) => dispatch => {
  dispatch({
    type: WALLETCONNECT_REMOVE_PENDING_REDIRECT,
  });
  if (scheme) {
    Linking.openURL(`${scheme}://`);
  } else {
    return Navigation.handleAction(Routes.WALLET_CONNECT_REDIRECT_SHEET, {
      type,
    });
  }
};

export const walletConnectOnSessionRequest = (
  uri,
  callback
) => async dispatch => {
  let walletConnector = null;
  try {
    const { clientMeta, push } = await getNativeOptions();
    try {
      walletConnector = new WalletConnect({ clientMeta, uri }, push);
      walletConnector.on('session_request', (error, payload) => {
        if (error) {
          analytics.track('Error on wc session_request', {
            error,
            payload,
          });
          logger.log('Error on wc session_request', payload);
          captureException(error);
          throw error;
        }

        const { peerId, peerMeta } = payload.params[0];

        const imageUrl =
          dappLogoOverride(peerMeta.url) || get(peerMeta, 'icons[0]');
        const dappName = dappNameOverride(peerMeta.url) || peerMeta.name;
        const dappUrl = peerMeta.url;
        const dappScheme = peerMeta.scheme;

        analytics.track('Showing Walletconnect session request', {
          dappName,
          dappUrl,
        });

        Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {
          callback: async (approved, chainId, accountAddress) => {
            if (approved) {
              dispatch(setPendingRequest(peerId, walletConnector));
              dispatch(
                walletConnectApproveSession(
                  peerId,
                  callback,
                  dappScheme,
                  chainId,
                  accountAddress
                )
              );
              analytics.track('Approved new WalletConnect session', {
                dappName,
                dappUrl,
              });
            } else {
              await dispatch(
                walletConnectRejectSession(peerId, walletConnector)
              );
              callback && callback('reject', dappScheme);
              analytics.track('Rejected new WalletConnect session', {
                dappName,
                dappUrl,
              });
            }
          },
          meta: {
            dappName,
            dappUrl,
            imageUrl,
          },
        });
      });
    } catch (error) {
      logger.log('Exception during wc session_request');
      analytics.track('Exception on wc session_request', {
        error,
      });
      captureException(error);
      Alert.alert(lang.t('wallet.wallet_connect.error'));
    }
  } catch (error) {
    logger.log('FCM exception during wc session_request');
    analytics.track('FCM exception on wc session_request', {
      error,
    });
    captureException(error);
    Alert.alert(lang.t('wallet.wallet_connect.missing_fcm'));
  }
};

const listenOnNewMessages = walletConnector => (dispatch, getState) => {
  walletConnector.on('call_request', async (error, payload) => {
    logger.log('WC Request!', error, payload);
    if (error) {
      analytics.track('Error on wc call_request', {
        error,
        payload,
      });
      logger.log('Error on wc call_request');
      captureException(error);
      throw error;
    }
    const { clientId, peerId, peerMeta } = walletConnector;
    const imageUrl =
      dappLogoOverride(peerMeta.url) || get(peerMeta, 'icons[0]');
    const dappName = dappNameOverride(peerMeta.url) || peerMeta.name;
    const dappUrl = peerMeta.url;
    const requestId = payload.id;
    if (payload.method === 'wallet_addEthereumChain') {
      const { chainId } = payload.params[0];
      const supportedChains = [
        networkTypes.mainnet,
        networkTypes.ropsten,
        networkTypes.kovan,
        networkTypes.goerli,
        networkTypes.polygon,
        networkTypes.optimism,
        networkTypes.arbitrum,
      ].map(network => ethereumUtils.getChainIdFromNetwork(network).toString());
      const numericChainId = convertHexToString(chainId);
      if (supportedChains.includes(numericChainId)) {
        dispatch(walletConnectSetPendingRedirect());
        Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {
          callback: async approved => {
            if (approved) {
              walletConnector.approveRequest({
                id: requestId,
                result: null,
              });
              const { accountAddress } = getState().settings;
              logger.log('Updating session for chainID', numericChainId);
              await walletConnector.updateSession({
                accounts: [accountAddress],
                chainId: numericChainId,
              });
              saveWalletConnectSession(
                walletConnector.peerId,
                walletConnector.session
              );
              analytics.track('Approved WalletConnect network switch', {
                chainId,
                dappName,
                dappUrl,
              });
              dispatch(walletConnectRemovePendingRedirect('connect'));
            } else {
              walletConnector.rejectRequest({
                error: { message: 'Chain currently not supported' },
                id: requestId,
              });
              analytics.track('Rejected new WalletConnect chain request', {
                dappName,
                dappUrl,
              });
            }
          },
          chainId: Number(numericChainId),
          meta: {
            dappName,
            dappUrl,
            imageUrl,
          },
          type: WalletConnectApprovalSheetType.switch_chain,
        });
      } else {
        logger.log('NOT SUPPORTED CHAIN');
        walletConnector.rejectRequest({
          error: { message: 'Chain currently not supported' },
          id: requestId,
        });
      }

      return;
    } else if (!isSigningMethod(payload.method)) {
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
    } else {
      const { selected } = getState().wallets;
      const selectedWallet = selected || {};
      const isReadOnlyWallet = selectedWallet.type === WalletTypes.readOnly;
      if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        walletConnector.rejectRequest({
          error: { message: 'JSON RPC method not supported' },
          id: payload.id,
        });
        return;
      }
      const { requests: pendingRequests } = getState().requests;
      const request = !pendingRequests[requestId]
        ? await dispatch(
            addRequestToApprove(clientId, peerId, requestId, payload, peerMeta)
          )
        : null;

      if (request) {
        analytics.track('Showing Walletconnect signing request');
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            Navigation.handleAction(Routes.CONFIRM_REQUEST, {
              openAutomatically: true,
              transactionDetails: request,
            });
          }, 1000);
        });
      }
    }
  });
  walletConnector.on('disconnect', error => {
    if (error) {
      throw error;
    }
    dispatch(
      walletConnectDisconnectAllByDappName(walletConnector.peerMeta.name)
    );
  });
  return walletConnector;
};

export const walletConnectLoadState = () => async (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  let newWalletConnectors = {};
  try {
    if (!isEmpty(walletConnectors)) {
      // Clear the event listeners before reconnecting
      // to prevent having the same callbacks
      Object.keys(walletConnectors).forEach(key => {
        const connector = walletConnectors[key];
        connector._eventManager = null;
      });
    }

    const allSessions = await getAllValidWalletConnectSessions();

    const { clientMeta, push } = await getNativeOptions();

    newWalletConnectors = mapValues(allSessions, session => {
      const walletConnector = new WalletConnect({ clientMeta, session }, push);
      return dispatch(listenOnNewMessages(walletConnector));
    });
  } catch (error) {
    analytics.track('Error on walletConnectLoadState', {
      error,
    });
    logger.log('Error on wc walletConnectLoadState', error);
    captureException(error);
    newWalletConnectors = {};
  }
  if (!isEmpty(newWalletConnectors)) {
    dispatch({
      payload: newWalletConnectors,
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

export const walletConnectUpdateSessions = () => (dispatch, getState) => {
  const { accountAddress, chainId } = getState().settings;
  const { walletConnectors } = getState().walletconnect;

  Object.keys(walletConnectors).forEach(key => {
    const connector = walletConnectors[key];
    const newSessionData = {
      accounts: [accountAddress],
      chainId,
    };
    connector.updateSession(newSessionData);

    saveWalletConnectSession(connector.peerId, connector.session);
  });
};

export const walletConnectUpdateSessionConnectorByDappName = (
  dappName,
  accountAddress,
  chainId
) => (dispatch, getState) => {
  const { walletConnectors } = getState().walletconnect;
  const connectors = pickBy(
    walletConnectors,
    connector => connector.peerMeta.name === dappName
  );
  const newSessionData = {
    accounts: [accountAddress],
    chainId,
  };
  values(connectors).forEach(connector => {
    connector.updateSession(newSessionData);
    saveWalletConnectSession(connector.peerId, connector.session);
  });
  dispatch({
    payload: clone(walletConnectors),
    type: WALLETCONNECT_UPDATE_CONNECTORS,
  });
};

export const walletConnectApproveSession = (
  peerId,
  callback,
  dappScheme,
  chainId,
  accountAddress
) => dispatch => {
  const walletConnector = dispatch(getPendingRequest(peerId));
  walletConnector.approveSession({
    accounts: [accountAddress],
    chainId,
  });

  dispatch(removePendingRequest(peerId));
  saveWalletConnectSession(walletConnector.peerId, walletConnector.session);

  const listeningWalletConnector = dispatch(
    listenOnNewMessages(walletConnector)
  );

  dispatch(setWalletConnector(listeningWalletConnector));
  if (callback) {
    callback('connect', dappScheme);
  }
};

export const walletConnectRejectSession = (
  peerId,
  walletConnector
) => dispatch => {
  walletConnector.rejectSession();
  dispatch(removePendingRequest(peerId));
};

export const walletConnectDisconnectAllByDappName = dappName => async (
  dispatch,
  getState
) => {
  const { walletConnectors } = getState().walletconnect;
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
    await removeWalletConnectSessions(peerIds);
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
  pendingRedirect: false,
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
    case WALLETCONNECT_UPDATE_CONNECTORS:
      return { ...state, walletConnectors: action.payload };
    case WALLETCONNECT_CLEAR_STATE:
      return { ...state, ...INITIAL_STATE };
    case WALLETCONNECT_SET_PENDING_REDIRECT:
      return { ...state, pendingRedirect: true };
    case WALLETCONNECT_REMOVE_PENDING_REDIRECT:
      return { ...state, pendingRedirect: false };
    default:
      return state;
  }
};
