import { InteractionManager } from 'react-native';
import SignClient from '@walletconnect/sign-client';
import { SignClientTypes, SessionTypes } from '@walletconnect/types';
import { getSdkError, parseUri } from '@walletconnect/utils';
import { WC_PROJECT_ID } from 'react-native-dotenv';
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
import { chains as supportedChainConfigs } from '@/references';
import { IS_DEV } from '@/env';

enum RPCMethod {
  Sign = 'eth_sign',
  PersonalSign = 'personal_sign',
  SignTypedData = 'eth_signTypedData',
  SignTypedDataV1 = 'eth_signTypedData_v1',
  SignTypedDataV3 = 'eth_signTypedData_v3',
  SignTypedDataV4 = 'eth_signTypedData_v4',
  SendTransaction = 'eth_sendTransaction',
  /**
   * @deprecated DO NOT USE, or ask Bruno
   */
  SignTransaction = 'eth_signTransaction',
  /**
   * @deprecated DO NOT USE, or ask Bruno
   */
  SendRawTransaction = 'eth_sendRawTransaction',
}

type RPCPayload =
  | {
      method: RPCMethod.Sign | RPCMethod.PersonalSign;
      params: [string, string];
    }
  | {
      method:
        | RPCMethod.SignTypedData
        | RPCMethod.SignTypedDataV1
        | RPCMethod.SignTypedDataV3
        | RPCMethod.SignTypedDataV4;
      params: [
        string, // address
        string // stringify typed object
      ];
    }
  | {
      method: RPCMethod.SendTransaction;
      params: [
        {
          from: string;
          to: string;
          data: string;
          gasPrice: string;
          gasLimit: string;
          value: string;
        }
      ];
    }
  | {
      method: RPCMethod; // for TS safety, but others are not supported
      params: any[];
    };

let PAIRING_TIMEOUT: NodeJS.Timeout | undefined = undefined;

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
 * Called in case we're on mobile and have a pending redirect
 */
export function maybeGoBackAndClearHasPendingRedirect({
  delay = 0,
}: { delay?: number } = {}) {
  if (hasDeeplinkPendingRedirect) {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setHasPendingDeeplinkPendingRedirect(false);
        Minimizer.goBack();
      }, delay);
    });
  }
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
}: RPCPayload): {
  address?: string;
  message?: string;
} {
  switch (method) {
    case 'eth_sign':
    case 'personal_sign': {
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
    /**
     * @see https://eips.ethereum.org/EIPS/eip-712#specification-of-the-eth_signtypeddata-json-rpc
     * @see https://docs.metamask.io/guide/signing-data.html#a-brief-history
     */
    case 'eth_signTypedData':
    case 'eth_signTypedData_v1':
    case 'eth_signTypedData_v3':
    case 'eth_signTypedData_v4': {
      const [address, message] = params;

      return {
        address,
        message: JSON.parse(message),
      };
    }
    case 'eth_sendTransaction': {
      const [tx] = params;
      return {
        address: tx.from,
      };
    }
    default:
      return {};
  }
}

export function isSupportedSigningMethod(method: RPCMethod) {
  return [
    RPCMethod.Sign,
    RPCMethod.PersonalSign,
    RPCMethod.SignTypedData,
    RPCMethod.SignTypedDataV1,
    RPCMethod.SignTypedDataV3,
    RPCMethod.SignTypedDataV4,
  ].includes(method);
}

export function isSupportedTransactionMethod(method: RPCMethod) {
  return [RPCMethod.SendTransaction].includes(method);
}

export function isSupportedMethod(method: RPCMethod) {
  return (
    isSupportedSigningMethod(method) || isSupportedTransactionMethod(method)
  );
}

export function isSupportedChain(chainId: number) {
  for (const config of supportedChainConfigs) {
    if (config.chain_id === chainId) return true;
  }
}

/**
 * Navigates to `ExplainSheet` by way of `WalletConnectApprovalSheet`, and
 * shows the text configured by the `reason` string, which is a key of the
 * `explainers` object in `ExplainSheet`
 */
function showErrorSheet({
  reason,
  onClose,
}: { reason?: string; onClose?: () => void } = {}) {
  logger.debug(`showErrorSheet`, { reason });
  Navigation.handleAction(Routes.EXPLAIN_SHEET, {
    type: reason || 'failed_wc_connection',
    onClose,
  });
}

async function rejectProposal({
  proposal,
  reason,
}: {
  proposal: SignClientTypes.EventArguments['session_proposal'];
  reason: Parameters<typeof getSdkError>[0];
}) {
  logger.warn(`WC v2: session approval denied`, {
    reason,
    proposal,
  });

  const client = await signClient;
  const { id, proposer } = proposal.params;

  await client.reject({ id, reason: getSdkError(reason) });

  analytics.track('Rejected new WalletConnect session', {
    dappName: proposer.metadata.name,
    dappUrl: proposer.metadata.url,
  });
}

export async function pair({ uri }: { uri: string }) {
  logger.debug(`WC v2: pair`, { uri }, logger.DebugContext.walletconnect);

  /**
   * Make sure this is cleared if we get multiple pairings in rapid succession
   */
  if (PAIRING_TIMEOUT) clearTimeout(PAIRING_TIMEOUT);

  const { topic } = parseUri(uri);
  const client = await signClient;

  // listen for THIS topic pairing, and clear timeout if received
  function handler(
    proposal: SignClientTypes.EventArguments['session_proposal']
  ) {
    if (proposal.params.pairingTopic === topic) {
      if (PAIRING_TIMEOUT) clearTimeout(PAIRING_TIMEOUT);
    }
  }

  // set new timeout
  PAIRING_TIMEOUT = setTimeout(() => {
    client.off('session_proposal', handler);
    showErrorSheet();
    analytics.track('New WalletConnect session time out');
  }, 5_000);

  // CAN get fired on subsequent pairs, so need to make sure we clean up
  client.on('session_proposal', handler);

  // init pairing
  await client.core.pairing.pair({ uri });
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
    const token = await getFCMToken();

    if (token) {
      const client_id = await client.core.crypto.getClientId();

      // initial subscription
      await subscribeToEchoServer({ token, client_id });

      /**
       * Ensure that if the FCM token changes we update the echo server
       */
      messaging().onTokenRefresh(async token => {
        await subscribeToEchoServer({ token, client_id });
      });
    } else {
      if (!IS_DEV) {
        logger.error(
          new RainbowError(
            `WC v2: FCM token not found, push notifications will not be received`
          )
        );
      }
    }
  } catch (e) {
    logger.error(new RainbowError(`WC v2: initListeners failed`), { error: e });
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

  const requiredNamespaceKeys = Object.keys(requiredNamespaces);
  const supportedNamespaces = requiredNamespaceKeys.filter(
    key => key === 'eip155'
  );
  const unsupportedNamespaces = requiredNamespaceKeys.filter(
    key => key !== 'eip155'
  );

  if (unsupportedNamespaces.length || !supportedNamespaces.length) {
    logger.warn(`WC v2: session proposal requested unsupported namespaces`, {
      unsupportedNamespaces,
    });
    await rejectProposal({ proposal, reason: 'UNSUPPORTED_CHAINS' });
    showErrorSheet({
      reason: 'failed_wc_invalid_chains',
      onClose() {
        maybeGoBackAndClearHasPendingRedirect();
      },
    });
    return;
  }

  const { chains, methods } = requiredNamespaces.eip155;
  // we already checked for eip155 namespace above
  const chainIds = chains!.map(chain => parseInt(chain.split('eip155:')[1]));
  const supportedChainIds = chainIds.filter(isSupportedChain);
  const unsupportedChainIds = chainIds.filter(id => !isSupportedChain(id));

  if (
    (unsupportedChainIds.length && !supportedChainIds.length) ||
    unsupportedNamespaces.length
  ) {
    logger.warn(
      `WC v2: session proposal requested unsupported networks or namespaces`,
      {
        unsupportedChainIds,
        unsupportedNamespaces,
      }
    );
    await rejectProposal({ proposal, reason: 'UNSUPPORTED_CHAINS' });
    showErrorSheet({
      reason: 'failed_wc_invalid_chains',
      onClose() {
        maybeGoBackAndClearHasPendingRedirect();
      },
    });
    return;
  } else if (unsupportedChainIds.length) {
    logger.info(`WC v2: session proposal requested unsupported networks`, {
      unsupportedChainIds,
    });
  }

  const peerMeta = proposer.metadata;
  const dappName =
    dappNameOverride(peerMeta.url) ||
    peerMeta.name ||
    lang.t(lang.l.walletconnect.unknown_dapp);

  /**
   * Log these, but it's OK if they list them now, we'll just ignore requests
   * to use them later.
   */
  const unspportedMethods = methods.filter(
    method => !isSupportedMethod(method as RPCMethod)
  );
  logger.info(`WC v2: dapp requested unsupported RPC methods`, {
    methods: unspportedMethods,
  });

  const routeParams: WalletconnectApprovalSheetRouteParams = {
    receivedTimestamp,
    meta: {
      chainIds: supportedChainIds,
      dappName,
      dappScheme: 'unused in WC v2', // only used for deeplinks from WC v1
      dappUrl: peerMeta.url || lang.t(lang.l.walletconnect.unknown_url),
      imageUrl: maybeSignUri(
        dappLogoOverride(peerMeta?.url) || peerMeta?.icons?.[0],
        { w: 200 }
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

          // @ts-expect-error We checked the namespace for chains prop above
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

          maybeGoBackAndClearHasPendingRedirect();

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

  logger.debug(
    `WC v2: session_request method`,
    { method, params },
    logger.DebugContext.walletconnect
  );

  if (isSupportedMethod(method as RPCMethod)) {
    const isSigningMethod = isSupportedSigningMethod(method as RPCMethod);
    const { address, message } = parseRPCParams({
      method: method as RPCMethod,
      params,
    });
    const allWallets = store.getState().wallets.wallets;

    if (isSigningMethod) {
      if (!address || !message) {
        logger.error(
          new RainbowError(
            `WC v2: session_request exited, signing request had no address and/or messsage`
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

        showErrorSheet({
          onClose() {
            maybeGoBackAndClearHasPendingRedirect();
          },
        });
        return;
      }

      // for TS only, should never happen
      if (!allWallets) {
        logger.error(
          new RainbowError(
            `WC v2: allWallets is null, this should never happen`
          )
        );
        return;
      }

      const selectedWallet = findWalletWithAccount(allWallets, address);

      if (!selectedWallet || selectedWallet?.type === WalletTypes.readOnly) {
        logger.error(
          new RainbowError(
            `WC v2: session_request exited, selectedWallet was falsy or read only`
          ),
          {
            selectedWalletType: selectedWallet?.type,
          }
        );

        await client.respond({
          topic,
          response: formatJsonRpcError(id, `Wallet is read-only`),
        });

        showErrorSheet({
          onClose() {
            maybeGoBackAndClearHasPendingRedirect();
          },
        });
        return;
      }
    }

    const session = client.session.get(topic);
    const { nativeCurrency, network } = store.getState().settings;
    const chainId = Number(event.params.chainId.split(':')[1]);
    const isSupportedNetwork = isSupportedChain(chainId);

    if (!isSupportedNetwork) {
      logger.error(
        new RainbowError(`WC v2: session_request was for unsupported network`),
        {
          chainId,
        }
      );

      try {
        await client.respond({
          topic,
          response: formatJsonRpcError(id, `Network not supported`),
        });
      } catch (e) {
        logger.error(
          new RainbowError(`WC v2: error rejecting session_request`),
          {
            error: (e as Error).message,
          }
        );
      }

      showErrorSheet({
        reason: 'failed_wc_invalid_chain',
        onClose() {
          maybeGoBackAndClearHasPendingRedirect();
        },
      });

      return;
    }

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
        dappLogoOverride(peerMeta.url) || peerMeta.icons[0],
        { w: 200 }
      ),
      payload: event.params.request,
      walletConnectV2RequestValues: {
        sessionRequestEvent: event,
        // @ts-ignore we assign address above
        address, // required by screen
        chainId, // required by screen
        onComplete() {
          maybeGoBackAndClearHasPendingRedirect({ delay: 300 });
        },
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

    try {
      await client.respond({
        topic,
        response: formatJsonRpcError(id, `Method ${method} not supported`),
      });
    } catch (e) {
      logger.error(new RainbowError(`WC v2: error rejecting session_request`), {
        error: (e as Error).message,
      });
    }

    showErrorSheet({
      reason: 'failed_wc_invalid_methods',
      onClose() {
        maybeGoBackAndClearHasPendingRedirect();
      },
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

    if (value.chains) {
      for (const chain of value.chains) {
        const chainId = parseInt(chain.split(`${key}:`)[1]);
        namespaces[key].accounts.push(`${key}:${chainId}:${address}`);
      }
    } else {
      logger.error(
        new RainbowError(
          `WC v2: namespace is missing chains prop when updating`
        ),
        { requiredNamespaces: session.requiredNamespaces }
      );
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
