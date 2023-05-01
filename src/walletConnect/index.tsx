import { InteractionManager } from 'react-native';
import { SignClientTypes, SessionTypes } from '@walletconnect/types';
import { getSdkError, parseUri } from '@walletconnect/utils';
import { WC_PROJECT_ID } from 'react-native-dotenv';
import Minimizer from 'react-native-minimizer';
import { isAddress, getAddress } from '@ethersproject/address';
import { formatJsonRpcResult, formatJsonRpcError } from '@json-rpc-tools/utils';
import { gretch } from 'gretchen';
import messaging from '@react-native-firebase/messaging';
import { Core } from '@walletconnect/core';
import { Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet';

import { logger, RainbowError } from '@/logger';
import { WalletconnectApprovalSheetRouteParams } from '@/redux/walletconnect';
import { Navigation } from '@/navigation';
import { getActiveRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import { maybeSignUri } from '@/handlers/imgix';
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
import { isHexString } from '@ethersproject/bytes';
import { toUtf8String } from '@ethersproject/strings';
import { IS_DEV, IS_ANDROID } from '@/env';
import { loadWallet } from '@/model/wallet';
import * as portal from '@/screens/Portal';
import {
  AuthRequestAuthenticateSignature,
  AuthRequestResponseErrorReason,
  AuthRequestAuthenticateResult,
} from '@/walletConnect/types';
import { AuthRequest } from '@/walletConnect/sheets/AuthRequest';
import { getProviderForNetwork } from '@/handlers/web3';

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
let syncWeb3WalletClient:
  | Awaited<ReturnType<typeof Web3Wallet['init']>>
  | undefined;

const walletConnectCore = new Core({ projectId: WC_PROJECT_ID });

export const web3WalletClient = Promise.resolve(
  Web3Wallet.init({
    core: walletConnectCore,
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
      const [address, message] = params.sort(a => (isAddress(a) ? -1 : 1));
      const isHex = isHexString(message);

      const decodedMessage = isHex ? toUtf8String(message) : message;

      return {
        address: getAddress(address),
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
        address: getAddress(address),
        message: JSON.parse(message),
      };
    }
    case 'eth_sendTransaction': {
      const [tx] = params;
      return {
        address: getAddress(tx.from),
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
  proposal: Web3WalletTypes.SessionProposal;
  reason: Parameters<typeof getSdkError>[0];
}) {
  logger.warn(`WC v2: session approval denied`, {
    reason,
    proposal,
  });

  const client = await web3WalletClient;
  const { id, proposer } = proposal.params;

  await client.rejectSession({ id, reason: getSdkError(reason) });

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

  const { topic, ...rest } = parseUri(uri);
  const client = await web3WalletClient;

  logger.debug(`WC v2: pair: parsed uri`, { topic, rest });

  // listen for THIS topic pairing, and clear timeout if received
  function handler(
    proposal: Web3WalletTypes.SessionProposal | Web3WalletTypes.AuthRequest
  ) {
    logger.debug(`WC v2: pair: handler`, { proposal });

    // @ts-expect-error We can't differentiate between these two unless we have separate handlers
    if (proposal.topic === topic || proposal.params.pairingTopic === topic) {
      if (PAIRING_TIMEOUT) clearTimeout(PAIRING_TIMEOUT);
    }
  }

  // set new timeout
  PAIRING_TIMEOUT = setTimeout(() => {
    logger.warn(`WC v2: pairing timeout`, { uri });
    client.off('session_proposal', handler);
    client.off('auth_request', handler);
    showErrorSheet();
    analytics.track('New WalletConnect session time out');
  }, 10_000);

  // CAN get fired on subsequent pairs, so need to make sure we clean up
  client.on('session_proposal', handler);
  client.on('auth_request', handler);

  // init pairing
  await client.core.pairing.pair({ uri });
}

export async function initListeners() {
  const client = await web3WalletClient;

  syncWeb3WalletClient = client;

  logger.debug(
    `WC v2: web3WalletClient initialized, initListeners`,
    {},
    logger.DebugContext.walletconnect
  );

  client.on('session_proposal', onSessionProposal);
  client.on('session_request', onSessionRequest);
  client.on('auth_request', onAuthRequest);
  client.on('session_delete', () => {
    logger.debug(
      `WC v2: session_delete`,
      {},
      logger.DebugContext.walletconnect
    );

    setTimeout(() => {
      events.emit('walletConnectV2SessionDeleted');
    }, 500);
  });

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

  if (res.error) {
    logger.error(new RainbowError(`WC v2: echo server subscription failed`), {
      error: res.error,
    });
  }
}

export async function onSessionProposal(
  proposal: Web3WalletTypes.SessionProposal
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
  const dappName = peerMeta.name || lang.t(lang.l.walletconnect.unknown_dapp);

  /**
   * Log these, but it's OK if they list them now, we'll just ignore requests
   * to use them later.
   */
  const unsupportedMethods = methods.filter(
    method => !isSupportedMethod(method as RPCMethod)
  );

  if (unsupportedMethods.length) {
    logger.info(`WC v2: dapp requested unsupported RPC methods`, {
      methods: unsupportedMethods,
    });
  }

  const routeParams: WalletconnectApprovalSheetRouteParams = {
    receivedTimestamp,
    meta: {
      chainIds: supportedChainIds,
      dappName,
      dappScheme: 'unused in WC v2', // only used for deeplinks from WC v1
      dappUrl: peerMeta.url || lang.t(lang.l.walletconnect.unknown_url),
      imageUrl: maybeSignUri(peerMeta?.icons?.[0], { w: 200 }),
      peerId: proposer.publicKey,
      isWalletConnectV2: true,
    },
    timedOut: false,
    callback: async (approved, approvedChainId, accountAddress) => {
      const client = await web3WalletClient;
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
          typeof client.approveSession
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
          await client.approveSession({
            id,
            namespaces,
          });

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
  const client = await web3WalletClient;

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

    logger.debug(
      `WC v2: session_request method is supported`,
      { method, params, address, message },
      logger.DebugContext.walletconnect
    );

    if (isSigningMethod) {
      logger.debug(`WC v2: validating session_request signing method`);

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

        await client.respondSessionRequest({
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

        await client.respondSessionRequest({
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

    const session = Object.values(client.getActiveSessions() || {}).find(s => {
      return s.topic === topic;
    });

    // mostly a TS guard, pry won't happen
    if (!session) {
      logger.error(
        new RainbowError(`WC v2: session_request topic was not found`)
      );

      await client.respondSessionRequest({
        topic,
        response: formatJsonRpcError(id, `Session not found`),
      });

      return;
    }

    const { nativeCurrency, network } = store.getState().settings;
    const chainId = Number(event.params.chainId.split(':')[1]);
    const isSupportedNetwork = isSupportedChain(chainId);

    logger.debug(`WC v2: getting session for topic`, { session });

    if (!isSupportedNetwork) {
      logger.error(
        new RainbowError(`WC v2: session_request was for unsupported network`),
        {
          chainId,
        }
      );

      try {
        await client.respondSessionRequest({
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

    logger.debug(
      `WC v2: handling request`,
      {},
      logger.DebugContext.walletconnect
    );

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
      dappName: peerMeta.name || 'Unknown Dapp',
      dappScheme: 'unused in WC v2', // only used for deeplinks from WC v1
      dappUrl: peerMeta.url || 'Unknown URL',
      displayDetails,
      imageUrl: maybeSignUri(peerMeta.icons[0], { w: 200 }),
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
      await client.respondSessionRequest({
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

  const client = await web3WalletClient;
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
    await client.respondSessionRequest(payload);
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
    await client.respondSessionRequest(payload);
  }

  store.dispatch(removeRequest(sessionRequestEvent.id));
}

export async function onAuthRequest(event: Web3WalletTypes.AuthRequest) {
  const client = await web3WalletClient;

  logger.debug(
    `WC v2: auth_request`,
    { event },
    logger.DebugContext.walletconnect
  );

  const authenticate: AuthRequestAuthenticateSignature = async ({
    address,
  }) => {
    try {
      const { wallets } = store.getState().wallets;
      const selectedWallet = findWalletWithAccount(wallets!, address);
      const isHardwareWallet = selectedWallet?.type === WalletTypes.bluetooth;
      const iss = `did:pkh:eip155:1:${address}`;

      // exit early if possible
      if (selectedWallet?.type === WalletTypes.readOnly) {
        await client.respondAuthRequest(
          {
            id: event.id,
            error: {
              code: 0,
              message: `Wallet is read-only`,
            },
          },
          iss
        );

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
        const provider = await getProviderForNetwork();
        const wallet = await loadWallet(address, false, provider);

        if (!wallet) {
          logger.error(
            new RainbowError(`WC v2: could not loadWallet to sign auth_request`)
          );

          return undefined;
        }

        const message = client.formatMessage(event.params.cacaoPayload, iss);
        // prompt the user to sign the message
        return wallet.signMessage(message);
      };

      // Get signature either directly, or via hardware wallet flow
      const signature = await (isHardwareWallet
        ? new Promise<Awaited<ReturnType<typeof loadWalletAndSignMessage>>>(
            (y, n) => {
              Navigation.handleAction(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
                async submit() {
                  try {
                    y(loadWalletAndSignMessage());
                  } catch (e) {
                    n(e);
                  }
                },
              });
            }
          )
        : loadWalletAndSignMessage());

      if (!signature) {
        return {
          success: false,
          reason: AuthRequestResponseErrorReason.Unknown,
        };
      }

      // respond to WC
      await client.respondAuthRequest(
        {
          id: event.id,
          signature: {
            s: signature,
            t: 'eip191',
          },
        },
        iss
      );

      // only handled on success
      maybeGoBackAndClearHasPendingRedirect({ delay: 300 });

      return { success: true };
    } catch (e: any) {
      logger.error(
        new RainbowError(
          `WC v2: an unknown error occurred when signing auth_request`
        ),
        {
          message: e.message,
        }
      );
      return { success: false, reason: AuthRequestResponseErrorReason.Unknown };
    }
  };

  portal.open(
    () =>
      AuthRequest({
        authenticate,
        requesterMeta: event.params.requester.metadata,
      }),
    { sheetHeight: IS_ANDROID ? 560 : 520 }
  );
}

/**
 * Returns all active settings in a type-safe manner.
 */
export async function getAllActiveSessions() {
  const client = await web3WalletClient;
  return Object.values(client?.getActiveSessions() || {}) || [];
}

/**
 * Synchronous version of `getAllActiveSessions`. Returns all active settings
 * in a type-safe manner.
 */
export function getAllActiveSessionsSync() {
  return Object.values(syncWeb3WalletClient?.getActiveSessions() || {}) || [];
}

/**
 * Adds an account to an existing session
 */
export async function addAccountToSession(
  session: SessionTypes.Struct,
  { address }: { address?: string }
) {
  try {
    const client = await web3WalletClient;

    const namespaces: Parameters<
      typeof client.updateSession
    >[0]['namespaces'] = {};

    for (const [key, value] of Object.entries(session.requiredNamespaces)) {
      /**
       * The `namespace` that corresponds to the `requiredNamespace` that was
       * requested when connecting the session. The `requiredNamespace` does
       * not have `accounts`, since it merely requests chains and methods, so
       * we need to referernce the connected `namespace` for existing `account`
       * values.
       */
      const ns = session.namespaces[key];

      namespaces[key] = {
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
            namespaces[key].accounts.splice(
              namespaces[key].accounts.indexOf(account),
              1
            );
            namespaces[key].accounts.unshift(account);
          }
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

    logger.debug(`WC v2: updating session`, {
      namespaces,
    });

    await client.updateSession({
      topic: session.topic,
      namespaces,
    });
  } catch (e: any) {
    logger.error(new RainbowError(`WC v2: error adding account to session`), {
      message: e.message,
    });
  }
}

export async function changeAccount(
  session: SessionTypes.Struct,
  { address }: { address?: string }
) {
  try {
    const client = await web3WalletClient;

    /*
     * Before we can effectively switch accounts, we need to add the account to
     * the session. Only then can we tell the dapp to use the new account.
     */
    await addAccountToSession(session, { address });

    for (const value of Object.values(session.requiredNamespaces)) {
      if (!value.chains) {
        logger.debug(`WC v2: changeAccount, no chains found for namespace`);
        continue;
      }

      for (const chainId of value.chains) {
        logger.debug(`WC v2: changeAccount, updating accounts for chainId`, {
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

        logger.debug(`WC v2: changeAccount, updated accounts for chainId`, {
          chainId,
        });
      }
    }

    logger.debug(`WC v2: changeAccount complete`);
  } catch (e: any) {
    logger.error(new RainbowError(`WC v2: error changing account`), {
      message: e.message,
    });
  }
}

/**
 * Initiates a disconnect from the app-end of the connection. Disconnection
 * within a dapp is handled internally by WC v2.
 */
export async function disconnectSession(session: SessionTypes.Struct) {
  const client = await web3WalletClient;

  await client.disconnectSession({
    topic: session.topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });
}
