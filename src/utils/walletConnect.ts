import SignClient from '@walletconnect/sign-client';
import { SignClientTypes, SessionTypes } from '@walletconnect/types';
import { getSdkError, parseUri } from '@walletconnect/utils';
import { WC_PROJECT_ID } from 'react-native-dotenv';
import { NavigationContainerRef } from '@react-navigation/native';
import Minimizer from 'react-native-minimizer';
import { utils as ethersUtils } from 'ethers';
import { formatJsonRpcResult, formatJsonRpcError } from '@json-rpc-tools/utils';
import { gretch } from 'gretchen';
import messaging from '@react-native-firebase/messaging';

import { logger, RainbowError } from '@/logger';
import { WalletconnectApprovalSheetRouteParams } from '@/redux/walletconnect';
import { Navigation } from '@/navigation';
import { getActiveRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import { maybeSignUri } from '@/handlers/imgix';
import { dappLogoOverride, dappNameOverride } from '@/helpers/dappNameHandler';
import { Alert } from '@/components/alerts';
import * as lang from '@/languages';
import {
  isSigningMethod,
  isTransactionDisplayType,
} from '@/utils/signingMethods';
import store from '@/redux/store';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import WalletTypes from '@/helpers/walletTypes';
import { ethereumUtils } from '@/utils';
import { getRequestDisplayDetails } from '@/parsers';
import {
  RequestData,
  REQUESTS_UPDATE_REQUESTS_TO_APPROVE,
  removeRequest,
} from '@/redux/requests';
import { saveLocalRequests } from '@/handlers/localstorage/walletconnectRequests';
import { events } from '@/handlers/appEvents';
import { getFCMToken } from '@/notifications/tokens';

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
  logger.info(`setHasPendingDeeplinkPendingRedirect`, { value });
  hasDeeplinkPendingRedirect = value;
}

/**
 * MAY BE UNDEFINED if WC v2 hasn't been instantiated yet
 */
export let syncSignClient: SignClient | undefined;

export const signClient = Promise.resolve(
  SignClient.init({
    projectId: WC_PROJECT_ID,
    // relayUrl: "<YOUR RELAY URL>",
    metadata: {
      name: '🌈 Rainbow',
      description: 'Rainbow makes exploring Ethereum fun and accessible 🌈',
      url: 'https://rainbow.me',
      icons: ['https://avatars2.githubusercontent.com/u/48327834?s=200&v=4'],
    },
  })
);

/**
 * For RPC requests that have [address, message] tuples (order may change),
 * return { address, message } and JSON.parse the value if it's from a typed
 * data request
 */
function parseRPCParams({
  method,
  params,
}: {
  method: string;
  params: string[];
}) {
  if (method === 'eth_sign' || method === 'personal_sign') {
    const [address, message] = params.sort(a =>
      ethersUtils.isAddress(a) ? -1 : 1
    );
    const isHexString = ethersUtils.isHexString(message);

    const decodedMessage = isHexString
      ? ethersUtils.toUtf8String(message)
      : message;

    return {
      address,
      message: decodedMessage,
    };
  }

  if (method === 'eth_signTypedData' || method === 'eth_signTypedData_v4') {
    const [address, message] = params.sort(a =>
      ethersUtils.isAddress(a) ? -1 : 1
    );

    return {
      address,
      message: JSON.parse(message),
    };
  }

  return {};
}

/**
 * Navigates to `ExplainSheet` by way of `WalletConnectApprovalSheet`, and
 * shows the text configured by the `reason` string, which is a key of the
 * `explainers` object in `ExplainSheet`
 */
function showErrorSheet({ reason }: { reason?: string } = {}) {
  const route: ReturnType<
    NavigationContainerRef['getCurrentRoute']
  > = getActiveRoute();

  const routeParams: WalletconnectApprovalSheetRouteParams = {
    receivedTimestamp: Date.now(),
    timedOut: true,
    failureExplainSheetVariant: reason || 'failed_wc_connection',
    // empty, the sheet will show the error state
    async callback() {},
  };

  // end load state with `timedOut` and provide failure callback
  Navigation.handleAction(
    Routes.WALLET_CONNECT_APPROVAL_SHEET,
    routeParams,
    route?.name === Routes.WALLET_CONNECT_APPROVAL_SHEET
  );
}

async function rejectProposal({
  proposal,
  reason,
}: {
  proposal: SignClientTypes.EventArguments['session_proposal'];
  reason: Parameters<typeof getSdkError>[0];
}) {
  logger.error(new RainbowError(`WC v2: session approval denied`), {
    reason,
    proposal,
  });

  const client = await signClient;
  const { id, proposer } = proposal.params;

  await client.reject({ id, reason: getSdkError(reason) });

  setHasPendingDeeplinkPendingRedirect(false);

  analytics.track('Rejected new WalletConnect session', {
    dappName: proposer.metadata.name,
    dappUrl: proposer.metadata.url,
  });
}

export async function pair({ uri }: { uri: string }) {
  logger.debug(`WC v2: pair`, { uri }, logger.DebugContext.walletconnect);

  try {
    // show loading state as feedback for user
    Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {});

    const { topic } = parseUri(uri);
    const client = await signClient;

    await client.core.pairing.pair({ uri });

    const timeout = setTimeout(() => {
      showErrorSheet();
      analytics.track('New WalletConnect session time out');
    }, 10_000);

    const handler = (
      proposal: SignClientTypes.EventArguments['session_proposal']
    ) => {
      // listen for THIS topic pairing, and clear timeout if received
      if (proposal.params.pairingTopic === topic) {
        client.off('session_proposal', handler);
        clearTimeout(timeout);
      }
    };

    client.on('session_proposal', handler);
  } catch (e) {
    logger.error(new RainbowError(`WC v2: pairing failed`), { error: e });
    showErrorSheet();
  }
}

export async function initListeners() {
  const client = await signClient;

  syncSignClient = client;

  logger.debug(
    `WC v2: signClient initialized, initListeners`,
    {},
    logger.DebugContext.walletconnect
  );

  client.on('session_proposal', onSessionProposal);
  client.on('session_request', onSessionRequest);

  try {
    const token = await getFCMToken(); // will throw
    const client_id = await client.core.crypto.getClientId();

    // initial subscription
    await subscribeToEchoServer({ token, client_id });

    /**
     * Ensure that if the FCM token changes we update the echo server
     */
    messaging().onTokenRefresh(async token => {
      await subscribeToEchoServer({ token, client_id });
    });
  } catch (e) {
    logger.error(
      new RainbowError(`WC v2: echo server FCM token retrieval failed`),
      { error: e }
    );
  }
}

async function subscribeToEchoServer({
  client_id,
  token,
}: {
  client_id: string;
  token: string;
}) {
  const res = await gretch(`https://wcpush.p.rainbow.me/clients`, {
    method: 'POST',
    json: {
      type: 'FCM',
      client_id,
      token,
    },
  }).json();

  // https://github.com/WalletConnect/echo-server/blob/a0afc940e1fc3ea8efb765fff5f4daeedec46d2a/spec/spec.md?plain=1#L14
  if (res.error || res.data?.status !== 'OK') {
    logger.error(new RainbowError(`WC v2: echo server subscription failed`), {
      error: res.error,
    });
  }
}

export async function onSessionProposal(
  proposal: SignClientTypes.EventArguments['session_proposal']
) {
  logger.debug(
    `WC v2: session_proposal`,
    {},
    logger.DebugContext.walletconnect
  );

  const receivedTimestamp = Date.now();
  const { proposer, requiredNamespaces } = proposal.params;

  /**
   * Trying to be defensive here, but I'm not sure we support this anyway so
   * probably not a big deal right now.
   */
  if (!requiredNamespaces.eip155) {
    logger.error(new RainbowError(`WC v2: missing required namespace eip155`));
    return;
  }

  const { chains, methods } = requiredNamespaces.eip155;
  const chainIds = chains.map(chain => parseInt(chain.split('eip155:')[1]));
  const peerMeta = proposer.metadata;
  const dappName =
    dappNameOverride(peerMeta.url) ||
    peerMeta.name ||
    lang.t(lang.l.walletconnect.unknown_dapp);

  for (const method of methods) {
    if (!isSigningMethod(method)) {
      await rejectProposal({ proposal, reason: 'UNSUPPORTED_METHODS' });
      showErrorSheet({ reason: 'failed_wc_invalid_methods' });
      return;
    }
  }

  const routeParams: WalletconnectApprovalSheetRouteParams = {
    receivedTimestamp,
    meta: {
      chainIds,
      dappName,
      dappScheme: 'unused in WC v2', // only used for deeplinks from WC v1
      dappUrl: peerMeta.url || lang.t(lang.l.walletconnect.unknown_url),
      imageUrl: maybeSignUri(
        dappLogoOverride(peerMeta?.url) || peerMeta?.icons?.[0]
      ),
      peerId: proposer.publicKey,
      isWalletConnectV2: true,
    },
    timedOut: false,
    callback: async (approved, approvedChainId, accountAddress) => {
      const client = await signClient;
      const { id, proposer, requiredNamespaces } = proposal.params;

      if (approved) {
        logger.debug(
          `WC v2: session approved`,
          {
            approved,
            approvedChainId,
            accountAddress,
          },
          logger.DebugContext.walletconnect
        );

        const namespaces: Parameters<
          typeof client.approve
        >[0]['namespaces'] = {};

        for (const [key, value] of Object.entries(requiredNamespaces)) {
          namespaces[key] = {
            accounts: [],
            methods: value.methods,
            events: value.events,
          };

          for (const chain of value.chains) {
            const chainId = parseInt(chain.split(`${key}:`)[1]);
            namespaces[key].accounts.push(
              `${key}:${chainId}:${accountAddress}`
            );
          }
        }

        logger.debug(
          `WC v2: session approved namespaces`,
          {},
          logger.DebugContext.walletconnect
        );

        try {
          /**
           * This is equivalent handling of setPendingRequest and
           * walletConnectApproveSession, since setPendingRequest is only used
           * within the /redux/walletconnect handlers
           *
           * WC v2 stores existing _pairings_ itself, so we don't need to persist
           * ourselves
           */
          const { acknowledged } = await client.approve({
            id,
            namespaces,
          });

          await acknowledged();

          // let the ConnectedDappsSheet know we've got a new one
          events.emit('walletConnectV2SessionCreated');

          if (hasDeeplinkPendingRedirect) {
            setHasPendingDeeplinkPendingRedirect(false);
            Minimizer.goBack();
          }

          logger.debug(
            `WC v2: session created`,
            {},
            logger.DebugContext.walletconnect
          );

          analytics.track('Approved new WalletConnect session', {
            dappName: proposer.metadata.name,
            dappUrl: proposer.metadata.url,
          });
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

          logger.error(new RainbowError(`WC v2: session approval failed`), {
            error: (e as Error).message,
          });
        }
      } else if (!approved) {
        await rejectProposal({ proposal, reason: 'USER_REJECTED' });
      }
    },
  };

  /**
   * We might see this at any point in the app, so only use `replace`
   * sometimes if the user is already looking at the approval sheet.
   */
  Navigation.handleAction(
    Routes.WALLET_CONNECT_APPROVAL_SHEET,
    routeParams,
    getActiveRoute()?.name === Routes.WALLET_CONNECT_APPROVAL_SHEET
  );
}

export async function onSessionRequest(
  event: SignClientTypes.EventArguments['session_request']
) {
  const client = await signClient;

  logger.debug(`WC v2: session_request`, {}, logger.DebugContext.walletconnect);

  const { id, topic } = event;
  const { method, params } = event.params.request;

  if (isSigningMethod(method)) {
    // transactions aren't a `[address, message]` tuple
    const isTransactionMethod = isTransactionDisplayType(method);
    let { address, message } = parseRPCParams({ method, params });
    const allWallets = store.getState().wallets.wallets;

    if (!isTransactionMethod) {
      if (!address || !message) {
        logger.error(
          new RainbowError(
            `WC v2: session_request exited, no address or messsage`
          ),
          {
            address,
            message,
          }
        );

        await client.respond({
          topic,
          response: formatJsonRpcError(id, `Invalid RPC params`),
        });

        return;
      }

      // for TS only, should never happen
      if (!allWallets) {
        logger.error(new RainbowError(`WC v2: allWallets is null`));
        return;
      }

      const selectedWallet = findWalletWithAccount(allWallets, address);

      if (!selectedWallet || selectedWallet?.type === WalletTypes.readOnly) {
        logger.debug(
          `WC v2: session_request exited, selectedWallet was falsy or read only`,
          {},
          logger.DebugContext.walletconnect
        );

        await client.respond({
          topic,
          response: formatJsonRpcError(id, `Wallet is read-only`),
        });

        return;
      }
    } else {
      address = params[0].from;
    }

    const session = client.session.get(topic);
    const { nativeCurrency, network } = store.getState().settings;
    const chainId = Number(event.params.chainId.split(':')[1]);
    const dappNetwork = ethereumUtils.getNetworkFromChainId(chainId);
    const displayDetails = getRequestDisplayDetails(
      event.params.request,
      nativeCurrency,
      dappNetwork
    );
    const peerMeta = session.peer.metadata;
    const request: RequestData = {
      clientId: session.topic, // I don't think this is used
      peerId: session.topic, // I don't think this is used
      requestId: event.id,
      dappName:
        dappNameOverride(peerMeta.name) || peerMeta.name || 'Unknown Dapp',
      dappScheme: 'unused in WC v2', // only used for deeplinks from WC v1
      dappUrl: peerMeta.url || 'Unknown URL',
      displayDetails,
      imageUrl: maybeSignUri(
        dappLogoOverride(peerMeta.url) || peerMeta.icons[0]
      ),
      payload: event.params.request,
      walletConnectV2RequestValues: {
        sessionRequestEvent: event,
        // @ts-ignore we assign address above
        address, // required by screen
        chainId, // required by screen
      },
    };

    logger.debug(
      `WC v2: handling request`,
      {},
      logger.DebugContext.walletconnect
    );

    const { requests: pendingRequests } = store.getState().requests;

    if (!pendingRequests[request.requestId]) {
      const updatedRequests = {
        ...pendingRequests,
        [request.requestId]: request,
      };
      store.dispatch({
        payload: updatedRequests,
        type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE,
      });
      saveLocalRequests(updatedRequests, address, network);

      logger.debug(
        `WC v2: navigating to CONFIRM_REQUEST sheet`,
        {},
        logger.DebugContext.walletconnect
      );

      Navigation.handleAction(Routes.CONFIRM_REQUEST, {
        openAutomatically: true,
        transactionDetails: request,
      });

      analytics.track('Showing Walletconnect signing request', {
        dappName: request.dappName,
        dappUrl: request.dappUrl,
      });
    }
  } else {
    logger.error(
      new RainbowError(
        `WC v2: received unsupported session_request RPC method`
      ),
      {
        method,
      }
    );

    await client.respond({
      topic,
      response: formatJsonRpcError(id, getSdkError('UNSUPPORTED_METHODS')),
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
  { result, error }: { result: string; error: any }
) {
  logger.info(`WC v2: handleSessionRequestResponse`, {
    success: Boolean(result),
  });

  const client = await signClient;
  const { topic, id } = sessionRequestEvent;

  if (result) {
    const payload = {
      topic,
      response: formatJsonRpcResult(id, result),
    };
    logger.debug(
      `WC v2: handleSessionRequestResponse success`,
      {},
      logger.DebugContext.walletconnect
    );
    await client.respond(payload);
  } else {
    const payload = {
      topic,
      response: formatJsonRpcError(id, error),
    };
    logger.debug(
      `WC v2: handleSessionRequestResponse reject`,
      {},
      logger.DebugContext.walletconnect
    );
    await client.respond(payload);
  }

  store.dispatch(removeRequest(sessionRequestEvent.id));
}

/**
 * Returns all active settings in a type-safe manner.
 */
export async function getAllActiveSessions() {
  const client = await signClient;
  return client?.session?.values || [];
}

/**
 * Synchronous version of `getAllActiveSessions`. Returns all active settings
 * in a type-safe manner.
 */
export function getAllActiveSessionsSync() {
  return syncSignClient?.session?.values || [];
}

/**
 * Updates an existing session with new values
 */
export async function updateSession(
  session: SessionTypes.Struct,
  { address }: { address?: string }
) {
  const client = await signClient;

  const namespaces: Parameters<typeof client.update>[0]['namespaces'] = {};

  for (const [key, value] of Object.entries(session.requiredNamespaces)) {
    namespaces[key] = {
      accounts: [],
      methods: value.methods,
      events: value.events,
    };

    for (const chain of value.chains) {
      const chainId = parseInt(chain.split(`${key}:`)[1]);
      namespaces[key].accounts.push(`${key}:${chainId}:${address}`);
    }
  }

  await client.update({
    topic: session.topic,
    namespaces,
  });
}

/**
 * Initiates a disconnect from the app-end of the connection. Disconnection
 * within a dapp is handled internally by WC v2.
 */
export async function disconnectSession(session: SessionTypes.Struct) {
  const client = await signClient;

  await client.disconnect({
    topic: session.topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });
}
