import { captureException } from '@sentry/react-native';
import WalletConnect from '@walletconnect/client';
import { parseWalletConnectUri } from '@walletconnect/utils';
import lang from 'i18n-js';
import { clone, isEmpty, mapValues, values } from 'lodash';
import { AppState, InteractionManager, Linking } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import Minimizer from 'react-native-minimizer';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import URL, { qs } from 'url-parse';
import {
  getAllValidWalletConnectSessions,
  removeWalletConnectSessions,
  saveWalletConnectSession,
} from '../handlers/localstorage/walletconnectSessions';
import { sendRpcCall } from '../handlers/web3';
import { dappLogoOverride, dappNameOverride } from '../helpers/dappNameHandler';
import WalletTypes from '../helpers/walletTypes';
import { Navigation } from '../navigation';
import { isSigningMethod } from '../utils/signingMethods';
import { addRequestToApprove, RequestData } from './requests';
import { AppGetState, AppState as StoreAppState } from './store';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import { enableActionsOnReadOnlyWallet } from '@/config/debug';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import networkTypes from '@/helpers/networkTypes';
import { convertHexToString, delay, omitBy, pickBy } from '@/helpers/utilities';
import WalletConnectApprovalSheetType from '@/helpers/walletConnectApprovalSheetTypes';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, watchingAlert } from '@/utils';
import logger from '@/utils/logger';
import { getFCMToken } from '@/notifications/tokens';

// -- Variables --------------------------------------- //
let showRedirectSheetThreshold = 300;

// -- Types --------------------------------------- //

/**
 * Represents the state of the `walletconnect` reducer.
 */
interface WalletconnectState {
  /**
   * Whether or not the connector is currently pending redirection.
   */
  pendingRedirect: boolean;

  /**
   * An object mapping peer IDs to `WalletConnect` instances for pending requests.
   */
  pendingRequests: { [key: string]: WalletConnect };

  /**
   * An object mapping peer IDs to `WalletConnect` instances for approves
   * requests. Connectors are moved here after being removed from
   * `pendingRequests`.
   */
  walletConnectors: { [key: string]: WalletConnect };

  /**
   * Currently active WalletConnect URIs.
   */
  walletConnectUris: string[];
}

/**
 * An action for the `walletconnect` reducer.
 */
type WalletconnectAction =
  | WalletconnectUpdateRequestsAction
  | WalletconnectUpdateConnectorsAction
  | WalletconnectClearStateAction
  | WalletconnectSetPendingRedirectAction
  | WalletconnectRemovePendingRedirectAction
  | WalletconnectAddUriAction;

/**
 * An action that updates `pendingRequests` for this reducer.
 */
interface WalletconnectUpdateRequestsAction {
  type: typeof WALLETCONNECT_UPDATE_REQUESTS;
  payload: WalletconnectState['pendingRequests'];
}

/**
 * An action that updates `walletConnectors` for this reducer.
 */
interface WalletconnectUpdateConnectorsAction {
  type: typeof WALLETCONNECT_UPDATE_CONNECTORS;
  payload: WalletconnectState['walletConnectors'];
}

/**
 * An action that clears the `walletconnect` reducer's state.
 */
interface WalletconnectClearStateAction {
  type: typeof WALLETCONNECT_CLEAR_STATE;
}

/**
 * An action that sets `pendingRedirect` to true.
 */
interface WalletconnectSetPendingRedirectAction {
  type: typeof WALLETCONNECT_SET_PENDING_REDIRECT;
}

/**
 * An action that sets `pendingRedirect` to false.
 */
interface WalletconnectRemovePendingRedirectAction {
  type: typeof WALLETCONNECT_REMOVE_PENDING_REDIRECT;
}

/**
 * An action that updates `walletConnectUris` in state.
 */
interface WalletconnectAddUriAction {
  payload: WalletconnectState['walletConnectUris'];
  type: typeof WALLETCONNECT_ADD_URI;
}

/**
 * Represents a WalletConnect result passed to a callback function.
 */
type WalletconnectResultType =
  | 'timedOut'
  | 'sign'
  | 'transaction'
  | 'sign-canceled'
  | 'transaction-canceled'
  | 'connect'
  | 'reject';

/**
 * Route parameters sent to a WalletConnect approval sheet.
 */
interface WalletconnectApprovalSheetRouteParams {
  callback: (
    approved: boolean,
    chainId: number,
    accountAddress: string,
    peerId: RequestData['peerId'],
    dappScheme: RequestData['dappScheme'],
    dappName: RequestData['dappName'],
    dappUrl: RequestData['dappUrl']
  ) => Promise<unknown>;
  receivedTimestamp: number;
  meta?: {
    chainId: number;
  } & Pick<
    RequestData,
    'dappName' | 'dappScheme' | 'dappUrl' | 'imageUrl' | 'peerId'
  >;
  timeout?: ReturnType<typeof setTimeout> | null;
  timedOut?: boolean;
}

/**
 * A callback for a WalletConnect request.
 */
type WalletconnectRequestCallback = (
  type: WalletconnectResultType,
  scheme?: string | null
) => unknown;

// -- Constants --------------------------------------- //
const BIOMETRICS_ANIMATION_DELAY = 569;

const WALLETCONNECT_UPDATE_REQUESTS =
  'walletconnect/WALLETCONNECT_UPDATE_REQUESTS';

const WALLETCONNECT_UPDATE_CONNECTORS =
  'walletconnect/WALLETCONNECT_UPDATE_CONNECTORS';

const WALLETCONNECT_CLEAR_STATE = 'walletconnect/WALLETCONNECT_CLEAR_STATE';

const WALLETCONNECT_SET_PENDING_REDIRECT =
  'walletconnect/WALLETCONNECT_SET_PENDING_REDIRECT';
const WALLETCONNECT_REMOVE_PENDING_REDIRECT =
  'walletconnect/WALLETCONNECT_REMOVE_PENDING_REDIRECT';
const WALLETCONNECT_ADD_URI = 'walletconnect/WALLETCONNECT_ADD_URI';

// -- Actions ---------------------------------------- //

/**
 * Loads options for a new WalletConnect instance.
 *
 * @returns The options.
 */
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

/**
 * Updates the state to mark as pending redirection.
 */
export const walletConnectSetPendingRedirect = () => (
  dispatch: Dispatch<WalletconnectSetPendingRedirectAction>
) => {
  dispatch({
    type: WALLETCONNECT_SET_PENDING_REDIRECT,
  });
};

/**
 * Updaets the state to disable a pending redirect and either redirect or
 * remove the pending connector.
 *
 * @param type The result type to use. This determines the action taken if
 * a scheme is not specified.
 * @param scheme The scheme to open, if specified.
 */
export const walletConnectRemovePendingRedirect = (
  type: WalletconnectResultType,
  scheme?: string | null
) => (dispatch: Dispatch<WalletconnectRemovePendingRedirectAction>) => {
  dispatch({
    type: WALLETCONNECT_REMOVE_PENDING_REDIRECT,
  });
  const lastActiveTime = new Date().getTime();
  if (scheme) {
    Linking.openURL(`${scheme}://`);
  } else if (type !== 'timedOut') {
    if (type === 'sign' || type === 'transaction') {
      showRedirectSheetThreshold += BIOMETRICS_ANIMATION_DELAY;
      setTimeout(() => {
        Minimizer.goBack();
      }, BIOMETRICS_ANIMATION_DELAY);
    } else if (type === 'sign-canceled' || type === 'transaction-canceled') {
      setTimeout(() => {
        Minimizer.goBack();
      }, 300);
    } else {
      IS_TESTING !== 'true' && Minimizer.goBack();
    }
    // If it's still active after showRedirectSheetThreshold
    // We need to show the redirect sheet cause the redirect
    // didn't work
    setTimeout(() => {
      const now = new Date().getTime();
      const delta = now - lastActiveTime;
      if (AppState.currentState === 'active' && delta < 1000) {
        return Navigation.handleAction(Routes.WALLET_CONNECT_REDIRECT_SHEET, {
          type,
        });
      }
      return;
    }, showRedirectSheetThreshold);
  }
};

/**
 * Handles an incoming WalletConnect session request and updates state
 * accordingly.
 *
 * @param uri The WalletConnect URI.
 * @param callback The callback function to use.
 */
export const walletConnectOnSessionRequest = (
  uri: string,
  callback?: WalletconnectRequestCallback
) => async (
  dispatch: ThunkDispatch<StoreAppState, unknown, never>,
  getState: AppGetState
) => {
  // branch and linking are triggering this twice
  // also branch trigger this when the app is coming back from background
  // so this is a way to handle this case without persisting anything
  const { walletConnectUris } = getState().walletconnect;
  if (walletConnectUris.includes(uri)) return;
  dispatch(saveWalletConnectUri(uri));

  let timeout: ReturnType<typeof setTimeout> | null = null;
  let walletConnector: WalletConnect | null = null;
  const receivedTimestamp = Date.now();
  try {
    const { clientMeta, push } = await getNativeOptions();
    try {
      // Don't initiate a new session if we have already established one using this walletconnect URI
      const allSessions = await getAllValidWalletConnectSessions();
      const wcUri = parseWalletConnectUri(uri);

      const alreadyConnected = Object.values(allSessions).some(session => {
        return (
          session.handshakeTopic === wcUri.handshakeTopic &&
          session.key === wcUri.key
        );
      });

      if (alreadyConnected) {
        return;
      }

      walletConnector = new WalletConnect({ clientMeta, uri }, push);
      let meta: WalletconnectApprovalSheetRouteParams['meta'] | false = false;
      let navigated = false;
      let timedOut = false;
      let routeParams: WalletconnectApprovalSheetRouteParams = {
        callback: async (
          approved,
          chainId,
          accountAddress,
          peerId,
          dappScheme,
          dappName,
          dappUrl
        ) => {
          if (approved) {
            dispatch(setPendingRequest(peerId, walletConnector!));
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
            await dispatch(
              walletConnectRejectSession(peerId, walletConnector!)
            );
            callback?.('reject', dappScheme);
            analytics.track('Rejected new WalletConnect session', {
              dappName,
              dappUrl,
            });
          } else {
            callback?.('timedOut', dappScheme);
            const url = new URL(uri);
            // @ts-ignore
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

      walletConnector?.on('session_request', (error, payload) => {
        clearTimeout(timeout!);
        if (error) {
          analytics.track('Error on wc session_request', {
            // @ts-ignore
            error,
            payload,
          });
          logger.log('Error on wc session_request', payload);
          captureException(error);
          throw error;
        }
        const { peerId, peerMeta, chainId } = payload.params[0];

        const imageUrl =
          dappLogoOverride(peerMeta?.url) || peerMeta?.icons?.[0];
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
          routeParams = { ...routeParams, meta, timeout };
          Navigation.handleAction(
            Routes.WALLET_CONNECT_APPROVAL_SHEET,
            routeParams
          );
        }
      });

      let waitingFn: (callback: () => unknown, timeout: number) => unknown =
        InteractionManager.runAfterInteractions;
      if (IS_TESTING === 'true') {
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
          meta = android ? Navigation.getActiveRoute()?.params?.meta : meta;
          if (meta) return;
          timedOut = true;
          routeParams = { ...routeParams, timedOut };
          Navigation.handleAction(
            Routes.WALLET_CONNECT_APPROVAL_SHEET,
            routeParams
          );
        }, 20000);

        // If we have the meta, send it
        meta = android ? Navigation.getActiveRoute()?.params?.meta : meta;
        if (meta) {
          routeParams = { ...routeParams, meta };
        }
        navigated = true;
        Navigation.handleAction(
          Routes.WALLET_CONNECT_APPROVAL_SHEET,
          routeParams
        );
      }, 2000);
    } catch (error: any) {
      clearTimeout(timeout!);
      logger.log('Exception during wc session_request', error);
      analytics.track('Exception on wc session_request', {
        error,
      });
      captureException(error);
      Alert.alert(lang.t('wallet.wallet_connect.error'));
    }
  } catch (error: any) {
    clearTimeout(timeout!);
    logger.log('FCM exception during wc session_request', error);
    analytics.track('FCM exception on wc session_request', {
      error,
    });
    captureException(error);
    Alert.alert(lang.t('wallet.wallet_connect.missing_fcm'));
  }
};

/**
 * Starts listening for requests on a given `WalletConnect` instance.
 *
 * @param walletConnector The `WalletConnect` instance to listen for requests
 * on.
 */
const listenOnNewMessages = (walletConnector: WalletConnect) => (
  dispatch: ThunkDispatch<StoreAppState, unknown, never>,
  getState: AppGetState
) => {
  walletConnector.on('call_request', async (error, payload) => {
    logger.log('WC Request!', error, payload);
    if (error) {
      analytics.track('Error on wc call_request', {
        // @ts-ignore
        error,
        payload,
      });
      logger.log('Error on wc call_request');
      captureException(error);
      throw error;
    }
    const { clientId, peerId, peerMeta } = walletConnector;
    const imageUrl = dappLogoOverride(peerMeta?.url) || peerMeta?.icons?.[0];
    const dappName = dappNameOverride(peerMeta?.url) || peerMeta?.name;
    const dappUrl = peerMeta?.url;
    const requestId = payload.id;
    if (
      payload.method === 'wallet_addEthereumChain' ||
      payload.method === `wallet_switchEthereumChain`
    ) {
      const { chainId } = payload.params[0];
      const currentNetwork = ethereumUtils.getNetworkFromChainId(
        // @ts-expect-error "_chainId" is private.
        Number(walletConnector._chainId)
      );
      const supportedChains = [
        networkTypes.mainnet,
        networkTypes.goerli,
        networkTypes.polygon,
        networkTypes.bsc,
        networkTypes.optimism,
        networkTypes.arbitrum,
      ].map(network => ethereumUtils.getChainIdFromNetwork(network).toString());
      const numericChainId = convertHexToString(chainId);
      if (supportedChains.includes(numericChainId)) {
        dispatch(walletConnectSetPendingRedirect());
        Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {
          callback: async (approved: boolean) => {
            if (approved) {
              walletConnector.approveRequest({
                id: requestId,
                result: null,
              });
              const { accountAddress } = getState().settings;
              logger.log('Updating session for chainID', numericChainId);
              await walletConnector.updateSession({
                accounts: [accountAddress],
                // @ts-expect-error "numericChainId" is a string, not a number.
                chainId: numericChainId,
              });
              dispatch(setWalletConnector(walletConnector));
              saveWalletConnectSession(
                walletConnector.peerId,
                walletConnector.session
              );
              analytics.track('Approved WalletConnect network switch', {
                chainId,
                dappName,
                // @ts-ignore
                dappUrl,
              });
              dispatch(walletConnectRemovePendingRedirect('connect'));
            } else {
              walletConnector.rejectRequest({
                error: { message: 'User rejected request' },
                id: requestId,
              });
              analytics.track('Rejected new WalletConnect chain request', {
                dappName,
                // @ts-ignore
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
      // @ts-expect-error "_accounts" is private.
      const address = walletConnector._accounts?.[0];
      const selectedWallet = findWalletWithAccount(wallets!, address);
      const isReadOnlyWallet = selectedWallet!.type === WalletTypes.readOnly;
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
          analytics.track('Showing Walletconnect signing request', {
            dappName,
            // @ts-ignore
            dappUrl,
          });
        });
      }
    }
  });
  walletConnector.on('disconnect', error => {
    if (error) {
      throw error;
    }
    dispatch(
      walletConnectDisconnectAllByDappUrl(walletConnector.peerMeta!.url, false)
    );
  });
  return walletConnector;
};

/**
 * Begins listening to WalletConnect events on existing connections.
 */
export const walletConnectLoadState = () => async (
  dispatch: ThunkDispatch<
    StoreAppState,
    unknown,
    WalletconnectUpdateConnectorsAction
  >,
  getState: AppGetState
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
      // @ts-expect-error "_transport" is private.
      const connectorConnected = connector?._transport.connected;
      if (!connectorConnected) {
        // @ts-expect-error "_eventManager" is private.
        if (connector?._eventManager) {
          // @ts-expect-error "_eventManager" is private.
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
      // @ts-ignore
      error,
    });
    logger.log('Error on wc walletConnectLoadState', error);
    captureException(error);
    newWalletConnectors = {};
  }
  if (!isEmpty(newWalletConnectors)) {
    dispatch({
      payload: newWalletConnectors,
      type: WALLETCONNECT_UPDATE_CONNECTORS,
    });
  }
};

/**
 * Updates the pending requests to include a new connector.
 *
 * @param peerId The peer ID for the pending request.
 * @param walletConnector The `WalletConnect` instance for the pending request.
 */
export const setPendingRequest = (
  peerId: string,
  walletConnector: WalletConnect
) => (
  dispatch: Dispatch<WalletconnectUpdateRequestsAction>,
  getState: AppGetState
) => {
  const { pendingRequests } = getState().walletconnect;
  const updatedPendingRequests = {
    ...pendingRequests,
    [peerId]: walletConnector,
  };
  dispatch({
    payload: updatedPendingRequests,
    type: WALLETCONNECT_UPDATE_REQUESTS,
  });
};

/**
 * Gets an existing pending request for a given peer ID.
 *
 * @param peerId The peer ID for the pending request.
 * @returns Within a dispatch, returns the pending request's `WalletConnector`,
 * or undefined.
 */
export const getPendingRequest = (peerId: string) => (
  _: Dispatch,
  getState: AppGetState
) => {
  const { pendingRequests } = getState().walletconnect;
  return pendingRequests[peerId];
};

/**
 * Removes a pending request from state given a peer ID.
 * @param peerId The peer ID for the pending request to remove.
 */
export const removePendingRequest = (peerId: string) => (
  dispatch: Dispatch<WalletconnectUpdateRequestsAction>,
  getState: AppGetState
) => {
  const { pendingRequests } = getState().walletconnect;
  const updatedPendingRequests = pendingRequests;
  if (updatedPendingRequests[peerId]) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete updatedPendingRequests[peerId];
  }
  dispatch({
    payload: updatedPendingRequests,
    type: WALLETCONNECT_UPDATE_REQUESTS,
  });
};

/**
 * Updates the state's `walletConnectors` to include a new instance based on
 * its `peerId`.
 *
 * @param walletConnector The new `WalletConnect` instance.
 */
export const setWalletConnector = (walletConnector: WalletConnect) => (
  dispatch: Dispatch<WalletconnectUpdateConnectorsAction>,
  getState: AppGetState
) => {
  const { walletConnectors } = getState().walletconnect;
  const updatedWalletConnectors = {
    ...walletConnectors,
    [walletConnector.peerId]: walletConnector,
  };
  dispatch({
    payload: updatedWalletConnectors,
    type: WALLETCONNECT_UPDATE_CONNECTORS,
  });
};

/**
 * Gets a `WalletConnect` instance from `walletConnectors` in state based on a
 * peer ID.
 *
 * @param peerId The peer ID for the `WalletConnect` instance.
 * @returns Within a dispatch, the `WalletConnect` instance.
 */
export const getWalletConnector = (peerId: string) => (
  _: Dispatch,
  getState: AppGetState
) => {
  const { walletConnectors } = getState().walletconnect;
  const walletConnector = walletConnectors[peerId];
  return walletConnector;
};

/**
 * Removes a `WalletConnect` instance from the state's `walletConnectors` based
 * on its peer ID.
 *
 * @param peerId The peer ID of the `WalletConnect` instance to remove.
 */
export const removeWalletConnector = (peerId: string) => (
  dispatch: Dispatch<WalletconnectUpdateConnectorsAction>,
  getState: AppGetState
) => {
  const { walletConnectors } = getState().walletconnect;
  const updatedWalletConnectors = walletConnectors;
  if (updatedWalletConnectors[peerId]) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete updatedWalletConnectors[peerId];
  }
  dispatch({
    payload: updatedWalletConnectors,
    type: WALLETCONNECT_UPDATE_CONNECTORS,
  });
};

/**
 * Updates the account address and chain ID for all connectors that match
 * a given URL and updates state accordingly.
 *
 * @param dappUrl The URL to filter by.
 * @param accountAddress The account address to use.
 * @param chainId The chain ID to use.
 */
export const walletConnectUpdateSessionConnectorByDappUrl = (
  dappUrl: RequestData['dappUrl'],
  accountAddress: string,
  chainId: number
) => (
  dispatch: Dispatch<WalletconnectUpdateConnectorsAction>,
  getState: AppGetState
) => {
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

/**
 * Approves a WalletConnect session and updates state accordingly.
 *
 * @param peerId The peer ID for the request.
 * @param callback The callback to use upon connection.
 * @param dappScheme The scheme to pass to the callback.
 * @param chainId The chain ID to use in the approval.
 * @param accountAddress The account address to use in the approval.
 */
export const walletConnectApproveSession = (
  peerId: string,
  callback: WalletconnectRequestCallback | undefined,
  dappScheme: RequestData['dappScheme'],
  chainId: number,
  accountAddress: string
) => (dispatch: ThunkDispatch<StoreAppState, unknown, never>) => {
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

/**
 * Rejects a WalletConnect session and updates state accordingly.
 *
 * @param peerId The peer ID for the request to reject.
 * @param walletConnector The `WalletConnect` instance to reject.
 */
export const walletConnectRejectSession = (
  peerId: string,
  walletConnector: WalletConnect
) => (dispatch: ThunkDispatch<StoreAppState, unknown, never>) => {
  walletConnector.rejectSession();
  dispatch(removePendingRequest(peerId));
};

/**
 * Removes all current WalletConnect sessions matching a given URL and
 * updates state to remove instances from `walletConnectors` as necessary.
 *
 * @param dappUrl The URL to filter by.
 * @param killSession Whether or not to kill the corresponding WalletConnect
 * session.
 */
export const walletConnectDisconnectAllByDappUrl = (
  dappUrl: string,
  killSession = true
) => async (
  dispatch: Dispatch<WalletconnectUpdateConnectorsAction>,
  getState: AppGetState
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
        (walletConnector: WalletConnect) => walletConnector.peerId
      )
    );
    await removeWalletConnectSessions(peerIds);

    if (killSession) {
      matchingWalletConnectors.forEach(connector => connector?.killSession());
    }

    dispatch({
      payload: omitBy(
        walletConnectors,
        connector => connector?.peerMeta?.url === dappUrl
      ),
      type: WALLETCONNECT_UPDATE_CONNECTORS,
    });
  } catch (error) {
    Alert.alert(lang.t('wallet.wallet_connect.failed_to_disconnect'));
  }
};

/**
 * Responds to a `WalletConnect` request.
 *
 * @param peerId The peer ID of the session to respond to.
 * @param requestId The request ID to respond to.
 * @param response The response to send.
 */
export const walletConnectSendStatus = (
  peerId: string,
  requestId: number,
  response: { result?: any; error?: any }
) => async (_: Dispatch, getState: AppGetState) => {
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
      Alert.alert(
        lang.t('wallet.wallet_connect.failed_to_send_request_status')
      );
    }
  } else {
    Alert.alert(
      lang.t(
        'wallet.wallet_connect.walletconnect_session_has_expired_while_trying_to_send'
      )
    );
  }
};

/**
 * Adds a new WalletConnect URI to state.
 *
 * @param uri The new URI.
 */
export const saveWalletConnectUri = (uri: string) => async (
  dispatch: Dispatch<WalletconnectAddUriAction>,
  getState: AppGetState
) => {
  const { walletConnectUris } = getState().walletconnect;
  const newWalletConnectUris = [...walletConnectUris, uri];
  dispatch({
    payload: newWalletConnectUris,
    type: WALLETCONNECT_ADD_URI,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: WalletconnectState = {
  pendingRedirect: false,
  pendingRequests: {},
  walletConnectors: {},
  walletConnectUris: [],
};

export default (
  state = INITIAL_STATE,
  action: WalletconnectAction
): WalletconnectState => {
  switch (action.type) {
    case WALLETCONNECT_UPDATE_REQUESTS:
      return { ...state, pendingRequests: action.payload };
    case WALLETCONNECT_UPDATE_CONNECTORS:
      return { ...state, walletConnectors: action.payload };
    case WALLETCONNECT_CLEAR_STATE:
      return { ...state, ...INITIAL_STATE };
    case WALLETCONNECT_SET_PENDING_REDIRECT:
      return { ...state, pendingRedirect: true };
    case WALLETCONNECT_REMOVE_PENDING_REDIRECT:
      return { ...state, pendingRedirect: false };
    case WALLETCONNECT_ADD_URI:
      return { ...state, walletConnectUris: action.payload };
    default:
      return state;
  }
};
