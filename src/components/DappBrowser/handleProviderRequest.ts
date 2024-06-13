import { Messenger } from '@/browserMessaging/AppMessenger';
import { AddEthereumChainProposedChain, RequestArguments, RequestResponse, handleProviderRequest } from '@rainbow-me/provider';
import * as lang from '@/languages';

import { Provider } from '@ethersproject/providers';

import { RainbowNetworks, getNetworkObj } from '@/networks';
import { getProviderForNetwork } from '@/handlers/web3';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { UserRejectedRequestError } from 'viem';
import { convertHexToString } from '@/helpers/utilities';
import { logger } from '@/logger';
import { ActiveSession } from '@rainbow-me/provider/dist/references/appSession';
import { Network } from '@/helpers';
import { handleDappBrowserConnectionPrompt, handleDappBrowserRequest } from '@/utils/requestNavigationHandlers';
import { Tab } from '@rainbow-me/provider/dist/references/messengers';
import { getDappMetadata } from '@/resources/metadata/dapp';
import { useAppSessionsStore } from '@/state/appSessions';
import { BigNumber } from '@ethersproject/bignumber';

export type ProviderRequestPayload = RequestArguments & {
  id: number;
  meta?: CallbackOptions;
};
export type ProviderResponse = RequestResponse;

export type ProviderRequestTransport = {
  send(payload: ProviderRequestPayload, { id }: { id: number }): Promise<RequestResponse>;
  reply(callback: (payload: ProviderRequestPayload, callbackOptions: CallbackOptions) => Promise<RequestResponse>): Promise<void>;
};

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

export const getDappHost = (url?: string) => {
  try {
    if (url) {
      const host = new URL(url).host;
      if (host.indexOf('www.') === 0) {
        return host.replace('www.', '');
      }
      return host;
    }
    return '';
  } catch (e) {
    return '';
  }
};

const skipRateLimitCheck = (method: string) =>
  [
    'eth_chainId',
    'eth_accounts',
    'eth_sendTransaction',
    'eth_signTransaction',
    'personal_sign',
    'eth_signTypedData',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
    'wallet_watchAsset',
    'wallet_addEthereumChain',
    'wallet_switchEthereumChain',
    'eth_requestAccounts',
    'personal_ecRecover',
  ].includes(method) || method.startsWith('wallet_');

export interface IMessageSender {
  /**
   * The URL of the page or frame that opened the connection. If the sender is in an iframe, it will be iframe's URL not the URL of the page which hosts it.
   * @since Chrome 28.
   */
  url?: string | undefined;
  /** The tabs.Tab which opened the connection, if any. This property will only be present when the connection was opened from a tab (including content scripts), and only if the receiver is an extension, not an app. */
  tab?: Tab | undefined;
  /** The tabs.Tab which opened the connection, if any. This property will only be present when the connection was opened from a tab (including content scripts), and only if the receiver is an extension, not an app. */
  title?: string;
}

export type CallbackOptions = {
  /** The sender of the message. */
  sender: IMessageSender;
  /** The topic provided. */
  topic: string;
  /** An optional scoped identifier. */
  id?: number | string;
};

/**
 * Creates a generic transport that can be used to send and receive messages between extension scripts
 * under a given topic & set of types.
 *
 * @see https://www.notion.so/rainbowdotme/Cross-script-Messaging-141de5115294435f95e31b87abcf4314#3b63e155df6a4b71b0e6e74f7a2c416b
 */
export function createTransport<TPayload, TResponse>({ messenger, topic }: { messenger: Messenger; topic: string }) {
  if (!messenger.available) {
    console.error(`Messenger "${messenger.name}" is not available in this context.`);
  }
  return {
    async send(payload: TPayload, { id }: { id: number }) {
      return messenger.send<TPayload, TResponse>(topic, payload, { id });
    },
    async reply(callback: (payload: TPayload, callbackOptions: CallbackOptions) => Promise<TResponse>) {
      messenger.reply(topic, callback);
    },
  };
}

/**
 * Uses extensionMessenger to send messages to popup for the user to approve or reject
 * @param {PendingRequest} request
 * @returns {boolean}
 */
const messengerProviderRequestFn = async (messenger: Messenger, request: ProviderRequestPayload) => {
  const hostSessions = useAppSessionsStore.getState().getActiveSession({ host: getDappHost(request.meta?.sender.url) || '' });
  const appSession =
    hostSessions && hostSessions.sessions?.[hostSessions.activeSessionAddress]
      ? {
          address: hostSessions.activeSessionAddress,
          network: hostSessions.sessions[hostSessions.activeSessionAddress],
        }
      : null;

  // Wait for response from the popup.
  let response: unknown | null;

  if (request.method === 'eth_requestAccounts') {
    const dappData = await getDappMetadata({ url: getDappHost(request.meta?.sender.url) });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - chainId is not defined in the type
    const chainId = request.params?.[0]?.chainId ? BigNumber.from(request.params?.[0]?.chainId).toNumber() : undefined;
    response = await handleDappBrowserConnectionPrompt({
      dappName: dappData?.appName || request.meta?.sender.title || '',
      dappUrl: request.meta?.sender.url || '',
      chainId,
      address: hostSessions?.activeSessionAddress || undefined,
    });

    useAppSessionsStore.getState().addSession({
      host: getDappHost(request.meta?.sender.url) || '',
      // @ts-ignore
      address: response.address,
      // @ts-ignore
      network: getNetworkFromChainId(response.chainId),
      // @ts-ignore
      url: request.meta?.sender.url || '',
    });
  } else {
    const dappData = await getDappMetadata({ url: getDappHost(request.meta?.sender.url) });

    response = await handleDappBrowserRequest({
      dappName: dappData?.appName || request.meta?.sender.title || request.meta?.sender.url || '',
      imageUrl: dappData?.appLogo || '',
      address: appSession?.address || '',
      network: appSession?.network || Network.mainnet,
      dappUrl: request.meta?.sender.url || '',
      payload: request,
    });
  }

  if (!response) {
    throw new UserRejectedRequestError(Error('User rejected the request.'));
  }
  return response;
};

const isSupportedChainId = (chainId: number | string) => {
  const numericChainId = BigNumber.from(chainId).toNumber();
  return !!RainbowNetworks.find(network => Number(network.id) === numericChainId);
};
const getActiveSession = ({ host }: { host: string }): ActiveSession => {
  const hostSessions = useAppSessionsStore.getState().getActiveSession({ host });
  const appSession =
    hostSessions && hostSessions.sessions?.[hostSessions.activeSessionAddress]
      ? {
          address: hostSessions.activeSessionAddress,
          network: hostSessions.sessions[hostSessions.activeSessionAddress],
        }
      : null;

  if (!appSession) return null;
  return {
    address: appSession?.address || '',
    chainId: getChainIdByNetwork(appSession.network),
  };
  // return null;
};

const getChainIdByNetwork = (network: Network) => getNetworkObj(network).id;

const getChain = (chainId: number) => RainbowNetworks.find(network => Number(network.id) === chainId);

const getProvider = ({ chainId }: { chainId?: number | undefined }) => {
  const network = getNetworkFromChainId(chainId || 1);
  return getProviderForNetwork(network) as unknown as Provider;
};

const checkRateLimitFn = async (host: string) => {
  // try {
  //   // Read from session
  //   let rateLimits = await SessionStorage.get('rateLimits');

  //   // Initialize if needed
  //   if (rateLimits === undefined) {
  //     rateLimits = {
  //       [host]: {
  //         perSecond: 0,
  //         perMinute: 0,
  //       },
  //     };
  //   }

  //   if (rateLimits[host] === undefined) {
  //     rateLimits[host] = {
  //       perSecond: 1,
  //       perMinute: 1,
  //     };
  //   } else {
  //     rateLimits[host] = {
  //       perSecond: rateLimits[host].perSecond + 1,
  //       perMinute: rateLimits[host].perMinute + 1,
  //     };
  //   }

  //   // Clear after 1 sec
  //   if (!secondTimer) {
  //     secondTimer = setTimeout(async () => {
  //       resetRateLimit(host, true);
  //     }, 1000);
  //   }

  //   if (!minuteTimer) {
  //     minuteTimer = // Clear after 1 min
  //       setTimeout(async () => {
  //         resetRateLimit(host, false);
  //       }, 60000);
  //   }

  //   // Write to session
  //   SessionStorage.set('rateLimits', rateLimits);

  //   // Check rate limits
  //   if (rateLimits[host].perSecond > MAX_REQUEST_PER_SECOND) {
  //     queueEventTracking(event.dappProviderRateLimit, {
  //       dappURL: host,
  //       typeOfLimitHit: 'perSecond',
  //       requests: rateLimits[host].perSecond,
  //     });
  //     return true;
  //   }

  //   if (rateLimits[host].perMinute > MAX_REQUEST_PER_MINUTE) {
  //     queueEventTracking(event.dappProviderRateLimit, {
  //       dappURL: host,
  //       typeOfLimitHit: 'perMinute',
  //       requests: rateLimits[host].perMinute,
  //     });
  //     return true;
  //   }
  //   return false;
  // } catch (error) {
  //   return false;
  // }

  return false;
};

export const handleProviderRequestApp = ({ messenger, data, meta }: { messenger: Messenger; data: any; meta: any }) => {
  const providerRequestTransport = createTransport<ProviderRequestPayload, ProviderResponse>({ messenger, topic: 'providerRequest' });
  const isSupportedChain = (chainId: number) => isSupportedChainId(chainId);
  const getFeatureFlags = () => ({ custom_rpc: false });
  const messengerProviderRequest = (request: ProviderRequestPayload) => messengerProviderRequestFn(messenger, request);
  const onAddEthereumChain = ({
    proposedChain,
    callbackOptions,
  }: {
    proposedChain: AddEthereumChainProposedChain;
    callbackOptions?: CallbackOptions;
  }): { chainAlreadyAdded: boolean } => {
    const { chainId } = proposedChain;
    const supportedChains = RainbowNetworks.filter(network => network.features.walletconnect).map(network => network.id.toString());
    const numericChainId = convertHexToString(chainId);
    if (supportedChains.includes(numericChainId)) {
      // TODO - Open add / switch ethereum chain
      return { chainAlreadyAdded: true };
    } else {
      logger.info('[DAPPBROWSER]: NOT SUPPORTED CHAIN');
      return { chainAlreadyAdded: false };
    }
  };

  const checkRateLimit = async ({ id, meta, method }: { id: number; meta: CallbackOptions; method: string }) => {
    const url = meta?.sender.url || '';
    const host = (isValidUrl(url) && getDappHost(url)) || '';
    if (!skipRateLimitCheck(method)) {
      const rateLimited = await checkRateLimitFn(host);
      if (rateLimited) {
        return { id, error: <Error>new Error('Rate Limit Exceeded') };
      }
    }
  };

  const onSwitchEthereumChainNotSupported = ({
    proposedChain,
    callbackOptions,
  }: {
    proposedChain: AddEthereumChainProposedChain;
    callbackOptions?: CallbackOptions;
  }) => {
    const { chainId } = proposedChain;
    const supportedChain = isSupportedChainId(chainId);
    if (!supportedChain) {
      alert(lang.t(lang.l.dapp_browser.provider_error.unsupported_chain));
    } else {
      alert(lang.t(lang.l.dapp_browser.provider_error.no_active_session));
    }
    // console.warn('PROVIDER TODO: TODO SEND NOTIFICATION');
    // TODO SEND NOTIFICATION
    // inpageMessenger?.send('rainbow_ethereumChainEvent', {
    //     chainId: proposedChainId,
    //     chainName: chain?.name || 'NO NAME',
    //     status: !supportedChainId
    //       ? IN_DAPP_NOTIFICATION_STATUS.unsupported_network
    //       : IN_DAPP_NOTIFICATION_STATUS.no_active_session,
    //     extensionUrl,
    //     host,
    //   });
  };

  const onSwitchEthereumChainSupported = ({
    proposedChain,
    callbackOptions,
  }: {
    proposedChain: AddEthereumChainProposedChain;
    callbackOptions?: CallbackOptions;
  }) => {
    const { chainId } = proposedChain;
    const supportedChains = RainbowNetworks.filter(network => network.features.walletconnect).map(network => network.id.toString());
    const numericChainId = convertHexToString(chainId);
    const supportedChainId = supportedChains.includes(numericChainId);
    if (supportedChainId) {
      const host = getDappHost(callbackOptions?.sender.url) || '';
      const activeSession = getActiveSession({ host });
      if (activeSession) {
        useAppSessionsStore.getState().updateActiveSessionNetwork({ host: host, network: getNetworkFromChainId(Number(numericChainId)) });
        messenger.send(`chainChanged:${host}`, Number(numericChainId));
      }
      console.warn('PROVIDER TODO: TODO SEND NOTIFICATION');
    }
  };

  handleProviderRequest({
    providerRequestTransport,
    isSupportedChain,
    getFeatureFlags,
    messengerProviderRequest,
    onAddEthereumChain,
    checkRateLimit,
    onSwitchEthereumChainNotSupported,
    onSwitchEthereumChainSupported,
    getProvider,
    getActiveSession,
    getChain,
  });

  // @ts-ignore
  messenger.listeners['providerRequest']?.({ data, meta });
};
