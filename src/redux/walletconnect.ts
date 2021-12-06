// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/config/debug' or i... Remove this comment to see the full error message
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
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
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import URL, { qs } from 'url-parse';
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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/findWallet... Remove this comment to see the full error message
import { findWalletWithAccount } from '@rainbow-me/helpers/findWalletWithAccount';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { convertHexToString, delay } from '@rainbow-me/helpers/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletConn... Remove this comment to see the full error message
import WalletConnectApprovalSheetType from '@rainbow-me/helpers/walletConnectApprovalSheetTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils, watchingAlert } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
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

export const walletConnectSetPendingRedirect = () => (dispatch: any) => {
  dispatch({
    type: WALLETCONNECT_SET_PENDING_REDIRECT,
  });
};
export const walletConnectRemovePendingRedirect = (type: any, scheme: any) => (
  dispatch: any
) => {
  dispatch({
    type: WALLETCONNECT_REMOVE_PENDING_REDIRECT,
  });
  if (scheme) {
    Linking.openURL(`${scheme}://`);
  } else if (type !== 'timedOut') {
    return Navigation.handleAction(Routes.WALLET_CONNECT_REDIRECT_SHEET, {
      type,
    });
  }
};

export const walletConnectOnSessionRequest = (
  uri: any,
  callback: any
) => async (dispatch: any, getState: any) => {
  let timeout: any = null;
  getState().appState;
  let walletConnector: any = null;
  const receivedTimestamp = Date.now();
  try {
    const { clientMeta, push } = await getNativeOptions();
    try {
      walletConnector = new WalletConnect({ clientMeta, uri }, push);
      let meta: any = null;
      let navigated = false;
      let timedOut = false;
      let routeParams = {
        callback: async (
          approved: any,
          chainId: any,
          accountAddress: any,
          peerId: any,
          dappScheme: any,
          dappName: any,
          dappUrl: any
        ) => {
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
          } else if (!timedOut) {
            await dispatch(walletConnectRejectSession(peerId, walletConnector));
            callback?.('reject', dappScheme);
            analytics.track('Rejected new WalletConnect session', {
              dappName,
              dappUrl,
            });
          } else {
            callback?.('timedOut', dappScheme);
            const url = new URL(uri);
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ [key: string]: string | undefi... Remove this comment to see the full error message
            const bridge = qs.parse(url?.query)?.bridge;
            analytics.track('New WalletConnect session time out', {
              bridge,
              dappName,
              dappUrl,
            });
          }
        },
        receivedTimestamp,
      };

      // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'error' implicitly has an 'any' type.
      walletConnector?.on('session_request', (error, payload) => {
        clearTimeout(timeout);
        if (error) {
          analytics.track('Error on wc session_request', {
            error,
            payload,
          });
          logger.log('Error on wc session_request', payload);
          captureException(error);
          throw error;
        }
        const { peerId, peerMeta, chainId } = payload.params[0];

        const imageUrl =
          dappLogoOverride(peerMeta?.url) || get(peerMeta, 'icons[0]');
        const dappName = dappNameOverride(peerMeta?.url) || peerMeta?.name;
        const dappUrl = peerMeta?.url;
        const dappScheme = peerMeta?.scheme;

        analytics.track('Showing Walletconnect session request', {
          dappName,
          dappUrl,
        });

        meta = {
          chainId,
          dappName,
          dappScheme,
          dappUrl,
          imageUrl,
          peerId,
        };

        // If we already showed the sheet
        // We need navigate to the same route with the updated params
        // which now includes the meta
        if (navigated && !timedOut) {
          // @ts-expect-error ts-migrate(2322) FIXME: Type '{ meta: any; timeout: any; callback: (approv... Remove this comment to see the full error message
          routeParams = { ...routeParams, meta, timeout };
          Navigation.handleAction(
            Routes.WALLET_CONNECT_APPROVAL_SHEET,
            routeParams
          );
        }
      });

      let waitingFn = InteractionManager.runAfterInteractions;
      if (IS_TESTING === 'true') {
        // @ts-expect-error ts-migrate(2322) FIXME: Type 'typeof setTimeout' is not assignable to type... Remove this comment to see the full error message
        waitingFn = setTimeout;
      }

      waitingFn(async () => {
        if (IS_TESTING !== 'true') {
          // Wait until the app is idle so we can navigate
          // This usually happens only when coming from a cold start
          while (!getState().appState.walletReady) {
            await delay(300);
          }
        }

        // We need to add a timeout in case the bridge is down
        // to explain the user what's happening
        timeout = setTimeout(() => {
          if (meta) return;
          timedOut = true;
          // @ts-expect-error ts-migrate(2322) FIXME: Type '{ timedOut: boolean; callback: (approved: an... Remove this comment to see the full error message
          routeParams = { ...routeParams, timedOut };
          Navigation.handleAction(
            Routes.WALLET_CONNECT_APPROVAL_SHEET,
            routeParams
          );
        }, 20000);

        // If we have the meta, send it
        if (meta) {
          // @ts-expect-error ts-migrate(2322) FIXME: Type '{ meta: any; callback: (approved: any, chain... Remove this comment to see the full error message
          routeParams = { ...routeParams, meta };
        }
        navigated = true;
        Navigation.handleAction(
          Routes.WALLET_CONNECT_APPROVAL_SHEET,
          routeParams
        );
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 0-1 arguments, but got 2.
      }, 2000);
    } catch (error) {
      clearTimeout(timeout);
      logger.log('Exception during wc session_request', error);
      analytics.track('Exception on wc session_request', {
        error,
      });
      captureException(error);
      Alert.alert(lang.t('wallet.wallet_connect.error'));
    }
  } catch (error) {
    clearTimeout(timeout);
    logger.log('FCM exception during wc session_request', error);
    analytics.track('FCM exception on wc session_request', {
      error,
    });
    captureException(error);
    Alert.alert(lang.t('wallet.wallet_connect.missing_fcm'));
  }
};

const listenOnNewMessages = (walletConnector: any) => (
  dispatch: any,
  getState: any
) => {
  walletConnector.on('call_request', async (error: any, payload: any) => {
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
      dappLogoOverride(peerMeta?.url) || get(peerMeta, 'icons[0]');
    const dappName = dappNameOverride(peerMeta?.url) || peerMeta?.name;
    const dappUrl = peerMeta?.url;
    const requestId = payload.id;
    if (
      payload.method === 'wallet_addEthereumChain' ||
      payload.method === `wallet_switchEthereumChain`
    ) {
      const { chainId } = payload.params[0];
      const currentNetwork = ethereumUtils.getNetworkFromChainId(
        Number(walletConnector._chainId)
      );
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
          callback: async (approved: any) => {
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
              // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
              dispatch(walletConnectRemovePendingRedirect('connect'));
            } else {
              walletConnector.rejectRequest({
                error: { message: 'User rejected request' },
                id: requestId,
              });
              analytics.track('Rejected new WalletConnect chain request', {
                dappName,
                dappUrl,
              });
            }
          },
          chainId: Number(numericChainId),
          currentNetwork,
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
        .catch(error => {
          walletConnector.rejectRequest({
            error,
            id: payload.id,
          });
        });
      return;
    } else {
      const { wallets } = getState().wallets;
      const address = walletConnector._accounts?.[0];
      const selectedWallet = findWalletWithAccount(wallets, address);
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
        ? dispatch(
            addRequestToApprove(clientId, peerId, requestId, payload, peerMeta)
          )
        : null;
      if (request) {
        Navigation.handleAction(Routes.CONFIRM_REQUEST, {
          openAutomatically: true,
          transactionDetails: request,
        });
        InteractionManager.runAfterInteractions(() => {
          analytics.track('Showing Walletconnect signing request');
        });
      }
    }
  });
  walletConnector.on('disconnect', (error: any) => {
    if (error) {
      throw error;
    }
    dispatch(walletConnectDisconnectAllByDappUrl(walletConnector.peerMeta.url));
  });
  return walletConnector;
};

export const walletConnectLoadState = () => async (
  dispatch: any,
  getState: any
) => {
  while (!getState().walletconnect.walletConnectors) {
    await delay(300);
  }
  const { walletConnectors } = getState().walletconnect;
  let newWalletConnectors = {};
  try {
    const allSessions = await getAllValidWalletConnectSessions();
    const { clientMeta, push } = await getNativeOptions();

    newWalletConnectors = mapValues(allSessions, session => {
      const connector = walletConnectors[session.peerId];
      const connectorConnected = connector?._transport.connected;
      if (!connectorConnected) {
        if (connector?._eventManager) {
          connector._eventManager = null;
        }
        const walletConnector = new WalletConnect(
          { clientMeta, session },
          push
        );
        return dispatch(listenOnNewMessages(walletConnector));
      }
      return connector;
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

export const setPendingRequest = (peerId: any, walletConnector: any) => (
  dispatch: any,
  getState: any
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

export const getPendingRequest = (peerId: any) => (
  dispatch: any,
  getState: any
) => {
  const { pendingRequests } = getState().walletconnect;
  return pendingRequests[peerId];
};

export const removePendingRequest = (peerId: any) => (
  dispatch: any,
  getState: any
) => {
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

export const setWalletConnector = (walletConnector: any) => (
  dispatch: any,
  getState: any
) => {
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

export const getWalletConnector = (peerId: any) => (
  dispatch: any,
  getState: any
) => {
  const { walletConnectors } = getState().walletconnect;
  const walletConnector = walletConnectors[peerId];
  return walletConnector;
};

export const removeWalletConnector = (peerId: any) => (
  dispatch: any,
  getState: any
) => {
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

export const walletConnectUpdateSessions = () => (
  dispatch: any,
  getState: any
) => {
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

export const walletConnectUpdateSessionConnectorByDappUrl = (
  dappUrl: any,
  accountAddress: any,
  chainId: any
) => (dispatch: any, getState: any) => {
  const { walletConnectors } = getState().walletconnect;
  const connectors = pickBy(walletConnectors, connector => {
    return connector?.peerMeta?.url === dappUrl;
  });
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
  peerId: any,
  callback: any,
  dappScheme: any,
  chainId: any,
  accountAddress: any
) => (dispatch: any) => {
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
  peerId: any,
  walletConnector: any
) => (dispatch: any) => {
  walletConnector.rejectSession();
  dispatch(removePendingRequest(peerId));
};

export const walletConnectDisconnectAllByDappUrl = (dappUrl: any) => async (
  dispatch: any,
  getState: any
) => {
  const { walletConnectors } = getState().walletconnect;
  const matchingWalletConnectors = values(
    pickBy(
      walletConnectors,
      connector => connector?.peerMeta?.url === dappUrl || !connector?.peerMeta
    )
  );
  try {
    const peerIds = values(
      mapValues(
        matchingWalletConnectors,
        walletConnector => walletConnector.peerId
      )
    );
    await removeWalletConnectSessions(peerIds);
    forEach(matchingWalletConnectors, connector => connector?.killSession());
    dispatch({
      payload: omitBy(
        walletConnectors,
        connector => connector?.peerMeta?.url === dappUrl
      ),
      type: WALLETCONNECT_REMOVE_SESSION,
    });
  } catch (error) {
    Alert.alert('Failed to disconnect all WalletConnect sessions');
  }
};

export const walletConnectSendStatus = (
  peerId: any,
  requestId: any,
  response: any
) => async (dispatch: any, getState: any) => {
  const walletConnector = getState().walletconnect.walletConnectors[peerId];
  if (walletConnector) {
    const { result, error } = response;
    try {
      if (result) {
        await walletConnector.approveRequest({ id: requestId, result });
      } else {
        await walletConnector.rejectRequest({
          error,
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

export default (state = INITIAL_STATE, action: any) => {
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
