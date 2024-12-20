import { addNewWalletConnectRequest, removeWalletConnectRequest } from '@/state/walletConnectRequests';
import React from 'react';
import { InteractionManager } from 'react-native';
import { SignClientTypes, SessionTypes } from '@walletconnect/types';
import { getSdkError, parseUri, buildApprovedNamespaces } from '@walletconnect/utils';
import { WC_PROJECT_ID } from 'react-native-dotenv';
import Minimizer from 'react-native-minimizer';
import { isAddress, getAddress } from '@ethersproject/address';
import { formatJsonRpcResult, formatJsonRpcError } from '@json-rpc-tools/utils';
import { gretch } from 'gretchen';
import messaging from '@react-native-firebase/messaging';
import WalletConnectCore, { Core } from '@walletconnect/core';
import { WalletKit, WalletKitTypes, IWalletKit } from '@reown/walletkit';
import { isHexString } from '@ethersproject/bytes';
import { toUtf8String } from '@ethersproject/strings';
import { logger, RainbowError } from '@/logger';
import Navigation, { getActiveRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { analyticsV2 as analytics, analyticsV2 } from '@/analytics';
import { maybeSignUri } from '@/handlers/imgix';
import Alert from '@/components/alerts/Alert';
import * as lang from '@/languages';
import store from '@/redux/store';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import WalletTypes from '@/helpers/walletTypes';
import { getRequestDisplayDetails } from '@/parsers/requests';
import { events } from '@/handlers/appEvents';
import { getFCMToken } from '@/notifications/tokens';
import { IS_DEV, IS_ANDROID, IS_IOS } from '@/env';
import { loadWallet } from '@/model/wallet';
import * as portal from '@/screens/Portal';
import * as explain from '@/screens/Explain';
import { Box } from '@/design-system';
import {
  AuthRequestAuthenticateSignature,
  AuthRequestResponseErrorReason,
  RPCMethod,
  RPCPayload,
  WalletconnectApprovalSheetRouteParams,
  WalletconnectRequestData,
} from '@/walletConnect/types';
import { AuthRequest } from '@/walletConnect/sheets/AuthRequest';
import { getProvider } from '@/handlers/web3';
import { uniq } from 'lodash';
import { fetchDappMetadata } from '@/resources/metadata/dapp';
import { DAppStatus } from '@/graphql/__generated__/metadata';
import { handleWalletConnectRequest } from '@/utils/requestNavigationHandlers';
import { PerformanceMetrics } from '@/performance/tracking/types/PerformanceMetrics';
import { PerformanceTracking } from '@/performance/tracking';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { hideWalletConnectToast } from '@/components/toasts/WalletConnectToast';

const SUPPORTED_SESSION_EVENTS = ['chainChanged', 'accountsChanged'];

const T = lang.l.walletconnect;

/**
 * Indicates that the app should redirect or go back after the next action
 * completes
 *
 * This is a hack to get around having to muddy the scopes of our event
 * listeners. BE CAREFUL WITH THIS.
 */
let hasDeeplinkPendingRedirect = false;

/**
 * Set `hasDeeplinkPendingRedirect` to a boolean, indicating that the app
 * should redirect or go back after the next action completes
 *
 * This is a hack to get around having to muddy the scopes of our event
 * listeners. BE CAREFUL WITH THIS.
 */
export function setHasPendingDeeplinkPendingRedirect(value: boolean) {
  logger.debug(`[walletConnect]: setHasPendingDeeplinkPendingRedirect`, { value });
  hasDeeplinkPendingRedirect = value;
}

/**
 * Called in case we're on mobile and have a pending redirect
 */
export function maybeGoBackAndClearHasPendingRedirect({ delay = 0 }: { delay?: number } = {}) {
  if (hasDeeplinkPendingRedirect) {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setHasPendingDeeplinkPendingRedirect(false);

        if (!IS_IOS) {
          Minimizer.goBack();
        }
      }, delay);
    });
  }
}

/**
 * MAY BE UNDEFINED if WC v2 hasn't been instantiated yet
 */

let lastConnector: string | undefined = undefined;

let walletConnectCore: WalletConnectCore | undefined;

let walletKitClient: ReturnType<(typeof WalletKit)['init']> | undefined;

let initPromise: Promise<IWalletKit> | undefined = undefined;

let syncWalletKitClient: IWalletKit | undefined = undefined;

export const initializeWCv2 = async () => {
  if (!walletConnectCore) {
    walletConnectCore = new Core({ projectId: WC_PROJECT_ID });
  }

  if (!walletKitClient) {
    // eslint-disable-next-line require-atomic-updates
    walletKitClient = WalletKit.init({
      core: walletConnectCore,
      metadata: {
        name: '🌈 Rainbow',
        description: 'Rainbow makes exploring Ethereum fun and accessible 🌈',
        url: 'https://rainbow.me',
        icons: ['https://avatars2.githubusercontent.com/u/48327834?s=200&v=4'],
        redirect: {
          native: 'rainbow://wc',
          universal: 'https://rnbwapp.com/wc',
        },
      },
    });
  }

  return walletKitClient;
};

export async function getWalletKitClient() {
  if (!initPromise) {
    initPromise = initializeWCv2();
  }

  return initPromise;
}

/**
 * For RPC requests that have [address, message] tuples (order may change),
 * return { address, message } and JSON.parse the value if it's from a typed
 * data request
 */
export function parseRPCParams({ method, params }: RPCPayload): {
  address?: string;
  message?: string;
} {
  switch (method) {
    case RPCMethod.PersonalSign: {
      const [address, message] = params.sort(a => (isAddress(a) ? -1 : 1));
      const isHex = isHexString(message);

      let decodedMessage = message;
      try {
        if (isHex) {
          decodedMessage = toUtf8String(message);
        }
      } catch (err) {
        logger.debug(
          `[walletConnect]: parsing RPC params unable to decode hex message to UTF8 string`,
          {},
          logger.DebugContext.walletconnect
        );
      }

      return {
        address: getAddress(address),
        message: decodedMessage,
      };
    }
    /**
     * @see https://eips.ethereum.org/EIPS/eip-712#specification-of-the-eth_signtypeddata-json-rpc
     * @see https://docs.metamask.io/guide/signing-data.html#a-brief-history
     */
    case RPCMethod.SignTypedData:
    case RPCMethod.SignTypedDataV1:
    case RPCMethod.SignTypedDataV3:
    case RPCMethod.SignTypedDataV4: {
      const [address, message] = params;

      return {
        address: getAddress(address),
        message: JSON.parse(message),
      };
    }
    case RPCMethod.SendTransaction: {
      const [tx] = params;
      return {
        address: getAddress(tx.from),
      };
    }
    default:
      return {};
  }
}

/**
 * Better signature for this type of function
 *
 * @see https://docs.walletconnect.com/2.0/web/walletKit/wallet-usage#-namespaces-builder-util
 */
export function getApprovedNamespaces(props: Parameters<typeof buildApprovedNamespaces>[0]):
  | {
      success: true;
      result: ReturnType<typeof buildApprovedNamespaces>;
      error: undefined;
    }
  | {
      success: false;
      result: undefined;
      error: Error;
    } {
  try {
    const namespaces = buildApprovedNamespaces(props);

    if (!namespaces.eip155.accounts.length) {
      return {
        success: false,
        result: undefined,
        error: new Error(lang.t(T.errors.no_accounts_found)),
      };
    }

    return {
      success: true,
      result: namespaces,
      error: undefined,
    };
  } catch (e: any) {
    logger.error(new RainbowError(`[walletConnect]: buildApprovedNamespaces threw an error`), {
      message: e.toString(),
    });

    return {
      success: false,
      result: undefined,
      error: e,
    };
  }
}

const SUPPORTED_SIGNING_METHODS = [
  RPCMethod.Sign,
  RPCMethod.PersonalSign,
  RPCMethod.SignTypedData,
  RPCMethod.SignTypedDataV1,
  RPCMethod.SignTypedDataV3,
  RPCMethod.SignTypedDataV4,
];

const SUPPORTED_TRANSACTION_METHODS = [RPCMethod.SendTransaction];

export function isSupportedSigningMethod(method: RPCMethod) {
  return SUPPORTED_SIGNING_METHODS.includes(method);
}

export function isSupportedTransactionMethod(method: RPCMethod) {
  return SUPPORTED_TRANSACTION_METHODS.includes(method);
}

export function isSupportedMethod(method: RPCMethod) {
  return isSupportedSigningMethod(method) || isSupportedTransactionMethod(method);
}

/**
 * Navigates to `ExplainSheet` by way of `WalletConnectApprovalSheet`, and
 * shows the text configured by the `reason` string, which is a key of the
 * `explainers` object in `ExplainSheet`
 */
function showErrorSheet({
  title,
  body,
  cta,
  onClose,
  sheetHeight,
}: {
  title: string;
  body: string;
  cta?: string;
  onClose?: () => void;
  sheetHeight?: number;
}) {
  explain.open(
    () => (
      <>
        <explain.Title>{title}</explain.Title>
        <explain.Body>{body}</explain.Body>
        <Box paddingTop="8px">
          <explain.Button
            label={cta || lang.t(T.errors.go_back)}
            onPress={() => {
              explain.close();
              onClose?.();
            }}
          />
        </Box>
      </>
    ),
    { sheetHeight }
  );
}

async function rejectProposal({
  proposal,
  reason,
}: {
  proposal: WalletKitTypes.SessionProposal;
  reason: Parameters<typeof getSdkError>[0];
}) {
  logger.warn(`[walletConnect]: session approval denied`, {
    reason,
    proposal,
  });

  const client = await getWalletKitClient();
  const { id, proposer } = proposal.params;

  await client.rejectSession({ id, reason: getSdkError(reason) });

  analytics.track(analytics.event.wcNewSessionRejected, {
    dappName: proposer.metadata.name,
    dappUrl: proposer.metadata.url,
  });
}

// listen for THIS topic pairing, and clear timeout if received
function trackTopicHandler(proposal: WalletKitTypes.SessionProposal | WalletKitTypes.SessionAuthenticate) {
  logger.debug(`[walletConnect]: pair: handler`, { proposal });

  const { metadata } = 'proposer' in proposal.params ? proposal.params.proposer : proposal.params.requester;

  analytics.track(analytics.event.wcNewPairing, {
    dappName: metadata.name,
    dappUrl: metadata.url,
    connector: lastConnector || 'unknown',
  });
}

export async function pair({ uri, connector }: { uri: string; connector?: string }) {
  logger.debug(`[walletConnect]: pair`, { uri }, logger.DebugContext.walletconnect);
  lastConnector = connector;
  /**
   * Make sure this is cleared if we get multiple pairings in rapid succession
   */

  const { topic, ...rest } = parseUri(uri);
  const client = await getWalletKitClient();

  logger.debug(`[walletConnect]: pair: parsed uri`, { topic, rest });

  // init pairing
  await client.pair({ uri });
}

export async function initListeners() {
  PerformanceTracking.startMeasuring(PerformanceMetrics.initializeWalletconnect);

  const client = await getWalletKitClient();
  PerformanceTracking.finishMeasuring(PerformanceMetrics.initializeWalletconnect);

  syncWalletKitClient = client;

  logger.debug(`[walletConnect]: walletKitClient initialized, initListeners`, {}, logger.DebugContext.walletconnect);

  client.on('session_proposal', onSessionProposal);
  client.on('session_request', onSessionRequest);
  // Temporarily disabling this since there's a bug on the WC side
  // client.on('session_authenticate', onSessionAuthenticate);
  client.on('session_delete', () => {
    logger.debug(`[walletConnect]: session_delete`, {}, logger.DebugContext.walletconnect);

    setTimeout(() => {
      events.emit('walletConnectV2SessionDeleted');
    }, 500);
  });
}

export async function initWalletConnectPushNotifications() {
  try {
    const token = await getFCMToken();

    if (token) {
      const client = await getWalletKitClient();
      const client_id = await client.core.crypto.getClientId();

      // initial subscription
      await subscribeToEchoServer({ token, client_id });

      /**
       * Ensure that if the FCM token changes we update the echo server
       */
      messaging().onTokenRefresh(async (token: string) => {
        await subscribeToEchoServer({ token, client_id });
      });
    } else {
      if (!IS_DEV) {
        /*
         * If we failed to fetch an FCM token, this will fail too. You should
         * see these errors increase proportionally if something goes wrong,
         * which could be due to network flakiness, SSL server error (has
         * happened), etc. Things out of our control.
         */
        logger.warn(`[walletConnect]: FCM token not found, push notifications will not be received`);
      }
    }
  } catch (e) {
    logger.error(new RainbowError(`[walletConnect]: initListeners failed`), { error: e });
  }
}

async function subscribeToEchoServer({ client_id, token }: { client_id: string; token: string }) {
  const res = await gretch(`https://wcpush.p.rainbow.me/clients`, {
    method: 'POST',
    json: {
      type: 'FCM',
      client_id,
      token,
    },
  }).json();

  if (res.error) {
    /*
     * Most of these appear to be network errors and timeouts. So our backend
     * should report these to Datadog, and we can leave this as a warn to
     * continue to monitor.
     */
    logger.warn(`[walletConnect]: echo server subscription failed`, {
      error: res.error,
    });
  }
}

export async function onSessionProposal(proposal: WalletKitTypes.SessionProposal) {
  try {
    trackTopicHandler(proposal);

    logger.debug(`[walletConnect]: session_proposal`, { proposal }, logger.DebugContext.walletconnect);

    const verifiedData = proposal.verifyContext.verified;
    const receivedTimestamp = Date.now();
    const { proposer, requiredNamespaces, optionalNamespaces } = proposal.params;

    const requiredChains = requiredNamespaces?.eip155?.chains || [];
    const optionalChains = optionalNamespaces?.eip155?.chains || [];

    const chains = uniq([...requiredChains, ...optionalChains]);

    // we already checked for eip155 namespace above
    const chainIds = chains?.map(chain => parseInt(chain.split('eip155:')[1]));
    const supportedChainIds = useBackendNetworksStore.getState().getSupportedChainIds();
    const chainIdsToUse = chainIds.filter(chainId => supportedChainIds.includes(chainId));

    const peerMeta = proposer.metadata;
    const metadata = await fetchDappMetadata({ url: peerMeta.url, status: true });

    const dappName = metadata?.appName || peerMeta.name || lang.t(lang.l.walletconnect.unknown_dapp);
    const dappImage = metadata?.appLogo || peerMeta?.icons?.[0];

    const routeParams: WalletconnectApprovalSheetRouteParams = {
      receivedTimestamp,
      meta: {
        chainIds: chainIdsToUse,
        dappName,
        dappScheme: 'unused in WC v2', // only used for deeplinks from WC v1
        dappUrl: peerMeta.url || lang.t(lang.l.walletconnect.unknown_url),
        imageUrl: maybeSignUri(dappImage, { w: 200 }),
        peerId: proposer.publicKey,
        isWalletConnectV2: true,
      },
      verifiedData,
      timedOut: false,
      callback: async (approved, approvedChainId, accountAddress) => {
        const client = await getWalletKitClient();

        const { id, proposer, requiredNamespaces } = proposal.params;

        if (approved) {
          logger.debug(
            `[walletConnect]: session approved`,
            {
              approved,
              approvedChainId,
              accountAddress,
            },
            logger.DebugContext.walletconnect
          );

          // we only support EVM chains rn
          const supportedEvents = requiredNamespaces?.eip155?.events || SUPPORTED_SESSION_EVENTS;

          /** @see https://chainagnostic.org/CAIPs/caip-2 */
          const caip2ChainIds = supportedChainIds.map(id => `eip155:${id}`);
          const namespaces = getApprovedNamespaces({
            proposal: proposal.params,
            supportedNamespaces: {
              eip155: {
                chains: caip2ChainIds,
                methods: [...SUPPORTED_SIGNING_METHODS, ...SUPPORTED_TRANSACTION_METHODS],
                events: supportedEvents,
                accounts: caip2ChainIds.map(id => `${id}:${accountAddress}`),
              },
            },
          });

          logger.debug(`[walletConnect]: session approved namespaces`, { namespaces }, logger.DebugContext.walletconnect);

          try {
            if (namespaces.success) {
              /**
               * WC v2 stores existing _pairings_ itself, so we don't need to persist
               * ourselves
               */
              await client.approveSession({
                id,
                namespaces: namespaces.result,
              });

              // let the ConnectedDappsSheet know we've got a new one
              events.emit('walletConnectV2SessionCreated');

              logger.debug(`[walletConnect]: session created`, {}, logger.DebugContext.walletconnect);

              analytics.track(analytics.event.wcNewSessionApproved, {
                dappName: proposer.metadata.name,
                dappUrl: proposer.metadata.url,
              });

              maybeGoBackAndClearHasPendingRedirect();
              if (IS_IOS) {
                Navigation.handleAction(Routes.WALLET_CONNECT_REDIRECT_SHEET, {
                  type: 'connect',
                });
              }
            } else {
              await rejectProposal({
                proposal,
                reason: 'INVALID_SESSION_SETTLE_REQUEST',
              });

              analyticsV2.track(analyticsV2.event.wcRequestFailed, { type: `invalid namespaces`, reason: namespaces.error.message });

              showErrorSheet({
                title: lang.t(T.errors.generic_title),
                body: `${lang.t(T.errors.namespaces_invalid)} \n \n ${namespaces.error.message}`,
                sheetHeight: 400,
                onClose: maybeGoBackAndClearHasPendingRedirect,
              });
            }
          } catch (e) {
            setHasPendingDeeplinkPendingRedirect(false);

            Alert({
              buttons: [
                {
                  style: 'cancel',
                  text: lang.t(lang.l.walletconnect.go_back),
                },
              ],
              message: lang.t(lang.l.walletconnect.failed_to_connect_to, {
                appName: dappName,
              }),
              title: lang.t(lang.l.walletconnect.connection_failed),
            });

            logger.error(new RainbowError(`[walletConnect]: session approval failed`), {
              error: (e as Error).message,
            });
          }
        } else if (!approved) {
          await rejectProposal({ proposal, reason: 'USER_REJECTED' });
        }
      },
    };

    hideWalletConnectToast();

    /**
     * We might see this at any point in the app, so only use `replace`
     * sometimes if the user is already looking at the approval sheet.
     */
    Navigation.handleAction(
      Routes.WALLET_CONNECT_APPROVAL_SHEET,
      routeParams,
      getActiveRoute()?.name === Routes.WALLET_CONNECT_APPROVAL_SHEET
    );
  } catch (error) {
    logger.error(
      new RainbowError(`[walletConnect]: session request catch all`, {
        ...(error as Error),
      })
    );
  }
}

// For WC v2
export async function onSessionRequest(event: SignClientTypes.EventArguments['session_request']) {
  setHasPendingDeeplinkPendingRedirect(true);
  const client = await getWalletKitClient();

  logger.debug(`[walletConnect]: session_request`, {}, logger.DebugContext.walletconnect);

  const { id, topic } = event;
  const { method: _method, params } = event.params.request;

  const method = _method as RPCMethod;

  logger.debug(`[walletConnect]: session_request method`, { method, params }, logger.DebugContext.walletconnect);

  // we allow eth sign for connections but we dont want to support actual signing
  if (method === RPCMethod.Sign) {
    await client.respondSessionRequest({
      topic,
      response: formatJsonRpcError(id, `Rainbow does not support legacy eth_sign`),
    });
    showErrorSheet({
      title: lang.t(T.errors.generic_title),
      body: lang.t(T.errors.eth_sign),
      sheetHeight: 270,
      onClose: maybeGoBackAndClearHasPendingRedirect,
    });
    return;
  }
  if (isSupportedMethod(method)) {
    const isSigningMethod = isSupportedSigningMethod(method);
    const { address, message } = parseRPCParams({
      method,
      params,
    });
    if (!address) {
      logger.error(new RainbowError('[walletConnect]: No Address in the RPC Params'));
      return;
    }

    const allWallets = store.getState().wallets.wallets;

    logger.debug(
      `[walletConnect]: session_request method is supported`,
      { method, params, address, message },
      logger.DebugContext.walletconnect
    );

    if (isSigningMethod) {
      logger.debug(`[walletConnect]: validating session_request signing method`);

      if (!address || !message) {
        logger.error(new RainbowError(`[walletConnect]: session_request exited, signing request had no address and/or messsage`), {
          address,
          message,
        });

        analyticsV2.track(analyticsV2.event.wcRequestFailed, {
          type: 'session_request',
          reason: 'session_request exited, signing request had no address and/or messsage',
        });

        await client.respondSessionRequest({
          topic,
          response: formatJsonRpcError(id, `Invalid RPC params`),
        });

        showErrorSheet({
          title: lang.t(T.errors.generic_title),
          body: lang.t(T.errors.request_invalid),
          sheetHeight: 270,
          onClose: maybeGoBackAndClearHasPendingRedirect,
        });
        return;
      }

      // for TS only, should never happen
      if (!allWallets) {
        logger.error(new RainbowError(`[walletConnect]: allWallets is null, this should never happen`));
        return;
      }

      const selectedWallet = findWalletWithAccount(allWallets, address);

      const isReadOnly = selectedWallet?.type === WalletTypes.readOnly;
      if (!selectedWallet || isReadOnly) {
        logger.error(new RainbowError(`[walletConnect]: session_request exited, selectedWallet was falsy or read only`), {
          selectedWalletType: selectedWallet?.type,
        });

        const errorMessageBody = isReadOnly ? lang.t(T.errors.read_only_wallet_on_signing_method) : lang.t(T.errors.generic_error);

        analyticsV2.track(analyticsV2.event.wcRequestFailed, {
          type: 'read only wallet',
          reason: 'session_request exited, selectedWallet was falsy or read only',
        });

        await client.respondSessionRequest({
          topic,
          response: formatJsonRpcError(id, `Wallet is read-only`),
        });

        showErrorSheet({
          title: lang.t(T.errors.generic_title),
          body: errorMessageBody,
          sheetHeight: 270,
          onClose: maybeGoBackAndClearHasPendingRedirect,
        });
        return;
      }
    }

    const session = Object.values(client.getActiveSessions() || {}).find(s => {
      return s.topic === topic;
    });

    // mostly a TS guard, pry won't happen
    if (!session) {
      logger.error(new RainbowError(`[walletConnect]: session_request topic was not found`));

      analyticsV2.track(analyticsV2.event.wcRequestFailed, { type: 'session_request', reason: 'session_request topic was not found' });

      await client.respondSessionRequest({
        topic,
        response: formatJsonRpcError(id, `Session not found`),
      });

      return;
    }

    const { nativeCurrency } = store.getState().settings;
    const chainId = Number(event.params.chainId.split(':')[1]);

    logger.debug(`[walletConnect]: getting session for topic`, { session });

    logger.debug(`[walletConnect]: handling request`, {}, logger.DebugContext.walletconnect);

    const displayDetails = await getRequestDisplayDetails(event.params.request, nativeCurrency, chainId);
    const peerMeta = session.peer.metadata;

    const metadata = await fetchDappMetadata({ url: peerMeta.url, status: true });
    const dappName = metadata?.appName || peerMeta.name || lang.t(lang.l.walletconnect.unknown_url);
    const dappImage = metadata?.appLogo || peerMeta?.icons?.[0];

    const request: WalletconnectRequestData = {
      clientId: session.topic, // I don't think this is used
      peerId: session.topic, // I don't think this is used
      requestId: event.id,
      dappName,
      dappScheme: 'unused in WC v2', // only used for deeplinks from WC v1
      dappUrl: peerMeta.url || 'Unknown URL',
      displayDetails,
      imageUrl: maybeSignUri(dappImage, { w: 200 }),
      address,
      chainId,
      payload: event.params.request,
      walletConnectV2RequestValues: {
        sessionRequestEvent: event,
        address,
        chainId,
        onComplete(type: string) {
          if (IS_IOS) {
            Navigation.handleAction(Routes.WALLET_CONNECT_REDIRECT_SHEET, {
              type,
            });
          }

          maybeGoBackAndClearHasPendingRedirect({ delay: 300 });
        },
      },
    };

    const addedNewRequest = addNewWalletConnectRequest({ walletConnectRequest: request });
    if (addedNewRequest) {
      logger.debug(`[walletConnect]: navigating to CONFIRM_REQUEST sheet`, {}, logger.DebugContext.walletconnect);
      handleWalletConnectRequest(request);

      analytics.track(analytics.event.wcShowingSigningRequest, {
        dappName: request.dappName,
        dappUrl: request.dappUrl,
      });
    }
  } else {
    logger.error(new RainbowError(`[walletConnect]: received unsupported session_request RPC method`), {
      method,
    });

    analyticsV2.track(analyticsV2.event.wcRequestFailed, {
      type: `method not supported`,
      reason: 'received unsupported session_request RPC method',
      method: method,
    });

    try {
      await client.respondSessionRequest({
        topic,
        response: formatJsonRpcError(id, `Method ${method} not supported`),
      });
    } catch (e) {
      logger.error(new RainbowError(`[walletConnect]: error rejecting session_request`), {
        error: (e as Error).message,
      });
    }

    showErrorSheet({
      title: lang.t(T.errors.generic_title),
      body: lang.t(T.errors.request_unsupported_methods),
      sheetHeight: 250,
      onClose: maybeGoBackAndClearHasPendingRedirect,
    });
  }
}

/**
 * Handles the result created on our confirmation screen and sends it along to the dapp via WC
 */
export async function handleSessionRequestResponse(
  {
    sessionRequestEvent,
  }: {
    sessionRequestEvent: SignClientTypes.EventArguments['session_request'];
  },
  { result, error }: { result: string | null; error: any }
) {
  logger.debug(`[walletConnect]: handleSessionRequestResponse`, {
    success: Boolean(result),
  });

  const client = await getWalletKitClient();
  const { topic, id } = sessionRequestEvent;
  if (result) {
    const payload = {
      topic,
      response: formatJsonRpcResult(id, result),
    };
    logger.debug(`[walletConnect]: handleSessionRequestResponse success`, {}, logger.DebugContext.walletconnect);
    await client.respondSessionRequest(payload);
  } else {
    const payload = {
      topic,
      response: formatJsonRpcError(id, error),
    };
    logger.debug(`[walletConnect]: handleSessionRequestResponse reject`, {}, logger.DebugContext.walletconnect);
    await client.respondSessionRequest(payload);
  }
  removeWalletConnectRequest({ walletConnectRequestId: sessionRequestEvent.id });
}

export async function onSessionAuthenticate(event: WalletKitTypes.SessionAuthenticate) {
  trackTopicHandler(event);

  const client = await getWalletKitClient();

  logger.debug(`[walletConnect]: auth_request`, { event }, logger.DebugContext.walletconnect);

  const authenticate: AuthRequestAuthenticateSignature = async ({ address }) => {
    try {
      const { wallets } = store.getState().wallets;
      const selectedWallet = findWalletWithAccount(wallets || {}, address);
      const isHardwareWallet = selectedWallet?.type === WalletTypes.bluetooth;
      const iss = `did:pkh:eip155:1:${address}`;

      // exit early if possible
      if (selectedWallet?.type === WalletTypes.readOnly) {
        await client.respondSessionRequest({
          topic: event.topic,
          response: {
            id: event.id,
            error: {
              code: 0,
              message: `Wallet is read-only`,
            },
            jsonrpc: '2.0',
          },
        });

        return {
          success: false,
          reason: AuthRequestResponseErrorReason.ReadOnly,
        };
      }

      /**
       * Locally scoped to this `authenticate` function. Simply here to
       * encapsulate reused code.
       */
      const loadWalletAndSignMessage = async () => {
        const provider = getProvider({ chainId: ChainId.mainnet });
        const wallet = await loadWallet({ address, showErrorIfNotLoaded: false, provider });

        if (!wallet) {
          logger.error(new RainbowError(`[walletConnect]: could not loadWallet to sign auth_request`));

          return undefined;
        }
        const message = client.formatAuthMessage({
          iss,
          request: event.params.authPayload,
        });
        // prompt the user to sign the message
        return wallet.signMessage(message);
      };

      // Get signature either directly, or via hardware wallet flow
      const signature = await (isHardwareWallet
        ? new Promise<Awaited<ReturnType<typeof loadWalletAndSignMessage>>>((y, n) => {
            Navigation.handleAction(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
              async submit() {
                try {
                  y(loadWalletAndSignMessage());
                } catch (e) {
                  n(e);
                }
              },
            });
          })
        : loadWalletAndSignMessage());

      if (!signature) {
        return {
          success: false,
          reason: AuthRequestResponseErrorReason.Unknown,
        };
      }

      // respond to WC
      await client.respondSessionRequest({
        topic: event.topic,
        response: {
          id: event.id,
          result: JSON.stringify({
            signature: {
              s: signature,
              t: 'eip191',
            },
          }),
          jsonrpc: '2.0',
        },
      });

      // only handled on success
      maybeGoBackAndClearHasPendingRedirect({ delay: 300 });

      return { success: true };
    } catch (e: any) {
      logger.error(new RainbowError(`[walletConnect]: an unknown error occurred when signing auth_request`), {
        message: e.message,
      });
      return { success: false, reason: AuthRequestResponseErrorReason.Unknown };
    }
  };

  // need to prefetch dapp metadata since portal is static
  const url = event?.verifyContext?.verified?.origin || event.params.requester.metadata.url;
  const metadata = await fetchDappMetadata({ url, status: true });

  const isScam = metadata.status === DAppStatus.Scam;
  portal.open(
    () =>
      AuthRequest({
        authenticate,
        requesterMeta: event.params.requester.metadata,
        verifiedData: event?.verifyContext.verified,
      }),
    { sheetHeight: IS_ANDROID ? 560 : 520 + (isScam ? 40 : 0) }
  );
}

/**
 * Returns all active settings in a type-safe manner.
 */
export async function getAllActiveSessions() {
  const client = await getWalletKitClient();
  return Object.values(client?.getActiveSessions() || {}) || [];
}

/**
 * Synchronous version of `getAllActiveSessions`. Returns all active settings
 * in a type-safe manner.
 */
export function getAllActiveSessionsSync() {
  return Object.values(syncWalletKitClient?.getActiveSessions() || {}) || [];
}

/**
 * Adds an account to an existing session
 */
export async function addAccountToSession(session: SessionTypes.Struct, { address }: { address?: string }) {
  try {
    const client = await getWalletKitClient();

    const namespaces: Parameters<typeof client.updateSession>[0]['namespaces'] = {};
    for (const [key, value] of Object.entries(session.namespaces)) {
      /**
       * The `namespace` that corresponds to the `requiredNamespace` that was
       * requested when connecting the session. The `requiredNamespace` does
       * not have `accounts`, since it merely requests chains and methods, so
       * we need to referernce the connected `namespace` for existing `account`
       * values.
       */
      const ns = session.namespaces[key];

      namespaces[key] = {
        ...ns,
        accounts: ns.accounts || [],
        methods: value.methods,
        events: value.events,
      };

      if (value.chains) {
        for (const chain of value.chains) {
          const chainId = parseInt(chain.split(`${key}:`)[1]);
          const account = `${key}:${chainId}:${address}`;

          /*
           * Add latest selected accounts to beginning of array so that our
           * switch wallet sheet shows that one as selected
           */
          if (!namespaces[key].accounts.includes(account)) {
            namespaces[key].accounts.unshift(account);
          } else {
            // remove and re-add to start of array
            namespaces[key].accounts.splice(namespaces[key].accounts.indexOf(account), 1);
            namespaces[key].accounts.unshift(account);
          }
        }
      } else {
        logger.error(new RainbowError(`[walletConnect]: namespace is missing chains prop when updating`), {
          requiredNamespaces: session.requiredNamespaces,
        });
      }
    }

    logger.debug(`[walletConnect]: updating session`, {
      namespaces,
    });

    await client.updateSession({
      topic: session.topic,
      namespaces,
    });
  } catch (e: any) {
    logger.error(new RainbowError(`[walletConnect]: error adding account to session`), {
      message: e.message,
    });
  }
}

export async function changeAccount(session: SessionTypes.Struct, { address }: { address?: string }) {
  try {
    const client = await getWalletKitClient();

    /*
     * Before we can effectively switch accounts, we need to add the account to
     * the session. Only then can we tell the dapp to use the new account.
     */
    await addAccountToSession(session, { address });

    for (const value of Object.values(session.namespaces)) {
      if (!value.chains) {
        logger.debug(`[walletConnect]: changeAccount, no chains found for namespace`);
        continue;
      }

      for (const chainId of value.chains) {
        logger.debug(`[walletConnect]: changeAccount, updating accounts for chainId`, {
          chainId,
        });

        // tell the dapp to use the new account
        await client.emitSessionEvent({
          topic: session.topic,
          event: {
            name: 'accountsChanged',
            data: [address],
          },
          chainId,
        });

        logger.debug(`[walletConnect]: changeAccount, updated accounts for chainId`, {
          chainId,
        });
      }
    }

    logger.debug(`[walletConnect]: changeAccount complete`);
    return true;
  } catch (e: any) {
    logger.error(new RainbowError(`[walletConnect]: error changing account`), {
      message: e.message,
    });
  }
  return false;
}

/**
 * Initiates a disconnect from the app-end of the connection. Disconnection
 * within a dapp is handled internally by WC v2.
 */
export async function disconnectSession(session: SessionTypes.Struct) {
  const client = await getWalletKitClient();

  await client.disconnectSession({
    topic: session.topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });
}
