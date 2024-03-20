import { Messenger } from '@/browserMessaging/AppMessenger';
import {
  AddEthereumChainProposedChain,
  handleProviderRequest as rnbwHandleProviderRequest,
  IMessageSender,
  RequestArguments,
  RequestResponse,
} from '@rainbow-me/provider';

import { RainbowNetworks } from '@/networks';
import { getProviderForNetwork } from '@/handlers/web3';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { Provider } from '@ethersproject/providers';
import { UserRejectedRequestError } from 'viem';
import { convertHexToString } from '@/helpers/utilities';
import { logger } from '@/logger';
export type ProviderRequestPayload = RequestArguments & {
  id: number;
  meta?: CallbackOptions;
};
type ProviderResponse = RequestResponse;

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
const messengerProviderRequest = async (messenger: Messenger, request: ProviderRequestPayload) => {
  // const { addPendingRequest } = pendingRequestStore.getState();
  // Add pending request to global background state.
  // addPendingRequest(request);

  // TODO OPEN UI POPUP WITH REQUEST

  //     openWindowForTabId(Number(request.meta?.sender.tab?.id).toString());
  // Wait for response from the popup.
  const payload: unknown | null = await new Promise(resolve =>
    // eslint-disable-next-line no-promise-executor-return
    messenger.reply(`message:${request.id}`, async payload => resolve(payload))
  );
  if (!payload) {
    throw new UserRejectedRequestError(Error('User rejected the request.'));
  }
  return payload;
};

const isSupportedChainId = (chainId: number) => RainbowNetworks.filter(network => Number(network.id) === chainId).length > 0;
const getActiveSession = ({ host }: { host: string }) =>
  // appSessionsStore.getState().getActiveSession({ host });
  null;

const getChain = (chainId: number) => RainbowNetworks.find(network => Number(network.id) === chainId);

const getProvider = ({ chainId }: { chainId?: number | undefined }) => {
  const network = getNetworkFromChainId(chainId || 1);
  return getProviderForNetwork(network) as unknown as Provider;
};

const checkRateLimit = async (host: string) => {
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

export const handleProviderRequest = (messenger: Messenger) => {
  const providerRequestTransport = createTransport<ProviderRequestPayload, ProviderResponse>({
    messenger,
    topic: 'providerRequest',
  });

  rnbwHandleProviderRequest({
    providerRequestTransport,
    isSupportedChain: isSupportedChainId,
    getActiveSession,
    getChain,
    getFeatureFlags: () => ({ custom_rpc: false }),
    getProvider,
    messengerProviderRequest: (request: ProviderRequestPayload) => messengerProviderRequest(messenger, request),
    onAddEthereumChain: ({
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
    },
    checkRateLimit: async ({ id, meta, method }: { id: number; meta: CallbackOptions; method: string }) => {
      const url = meta?.sender.url || '';
      const host = (isValidUrl(url) && getDappHost(url)) || '';
      if (!skipRateLimitCheck(method)) {
        const rateLimited = await checkRateLimit(host);
        if (rateLimited) {
          return { id, error: <Error>new Error('Rate Limit Exceeded') };
        }
      }
    },
    onSwitchEthereumChainNotSupported: ({
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
    },
    onSwitchEthereumChainSupported: ({
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
        // 1 - update session
        // TODO
        // 2 - Send noifification
        /*
            inpageMessenger?.send('rainbow_ethereumChainEvent', {
                chainId: proposedChainId,
                chainName: chain?.name,
                status: IN_DAPP_NOTIFICATION_STATUS.success,
                extensionUrl,
                host,
                });
            */
        // 3 - send event
        // inpageMessenger.send(`chainChanged:${host}`, proposedChainId);
      }
    },
  });
};
