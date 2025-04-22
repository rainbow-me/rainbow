import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

import store from '@/redux/store';
import { InteractionManager } from 'react-native';
import { SEND_TRANSACTION } from './signingMethods';
import { handleSessionRequestResponse } from '@/walletConnect';
import {
  RequestData,
  WalletconnectRequestData,
  WalletconnectApprovalSheetRouteParams,
  WalletconnectResultType,
} from '@/walletConnect/types';
import { getRequestDisplayDetails } from '@/parsers';
import { maybeSignUri } from '@/handlers/imgix';
import { getActiveRoute } from '@/navigation/Navigation';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { enableActionsOnReadOnlyWallet } from '@/config';
import walletTypes from '@/helpers/walletTypes';
import watchingAlert from './watchingAlert';
import {
  AppMetadata,
  EthereumAction,
  isEthereumAction,
  isHandshakeAction,
  PersonalSignAction,
  RequestMessage,
  useMobileWalletProtocolHost,
} from '@coinbase/mobile-wallet-protocol-host';
import { logger, RainbowError } from '@/logger';
import { noop } from 'lodash';
import { toUtf8String } from '@ethersproject/strings';
import { BigNumber } from '@ethersproject/bignumber';
import { Address } from 'viem';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { MobileWalletProtocolUserErrors } from '@/components/MobileWalletProtocolListener';
import { hideWalletConnectToast } from '@/components/toasts/WalletConnectToast';
import { removeWalletConnectRequest } from '@/state/walletConnectRequests';

export enum RequestSource {
  WALLETCONNECT = 'walletconnect',
  BROWSER = 'browser',
  MOBILE_WALLET_PROTOCOL = 'mobile-wallet-protocol',
}

// Mobile Wallet Protocol

interface HandleMobileWalletProtocolRequestProps
  extends Omit<ReturnType<typeof useMobileWalletProtocolHost>, 'message' | 'handleRequestUrl' | 'sendFailureToClient'> {
  request: RequestMessage;
}

const constructEthereumActionPayload = (action: EthereumAction) => {
  if (action.method === 'eth_sendTransaction') {
    const { weiValue, fromAddress, toAddress, actionSource, gasPriceInWei, ...rest } = action.params;
    return [
      {
        ...rest,
        from: fromAddress,
        to: toAddress,
        value: weiValue,
      },
    ];
  }

  return Object.values(action.params);
};

const supportedMobileWalletProtocolActions: string[] = [
  'eth_requestAccounts',
  'eth_sendTransaction',
  'eth_signTypedData_v4',
  'personal_sign',
  'wallet_switchEthereumChain',
];

export const handleMobileWalletProtocolRequest = async ({
  request,
  fetchClientAppMetadata,
  approveHandshake,
  rejectHandshake,
  approveAction,
  rejectAction,
  session,
}: HandleMobileWalletProtocolRequestProps): Promise<boolean> => {
  logger.debug(`Handling Mobile Wallet Protocol request: ${request.uuid}`);

  const { selected } = store.getState().wallets;
  const { accountAddress } = store.getState().settings;

  let addressToUse = accountAddress;
  let chainIdToUse = ChainId.mainnet;

  const isReadOnlyWallet = selected?.type === walletTypes.readOnly;
  if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
    logger.debug('Rejecting request due to read-only wallet');
    watchingAlert();
    return Promise.reject(new Error(MobileWalletProtocolUserErrors.READ_ONLY_WALLET));
  }

  const handleAction = async (currentIndex: number): Promise<boolean> => {
    const action = request.actions[currentIndex];
    logger.debug(`Handling action: ${action.kind}`);

    if (isHandshakeAction(action)) {
      logger.debug(`Processing handshake action for ${action.appId}`);

      const receivedTimestamp = Date.now();

      let dappMetadata: AppMetadata | null = null;
      try {
        dappMetadata = await fetchClientAppMetadata();
      } catch (error) {
        logger.error(new RainbowError(`[handleMobileWalletProtocolRequest]: Failed to fetch client app metadata`), {
          error,
          action,
        });
      }

      return new Promise((resolve, reject) => {
        const routeParams: WalletconnectApprovalSheetRouteParams = {
          receivedTimestamp,
          meta: {
            chainIds: useBackendNetworksStore.getState().getSupportedMainnetChainIds(),
            dappName: dappMetadata?.appName || dappMetadata?.appUrl || action.appName || action.appIconUrl || action.appId || '',
            dappUrl: dappMetadata?.appUrl || action.appId || '',
            imageUrl: maybeSignUri(dappMetadata?.iconUrl || action.appIconUrl),
            isWalletConnectV2: false,
            peerId: '',
            dappScheme: action.callback,
            proposedChainId: request.account?.networkId || chainIdToUse,
            proposedAddress: request.account?.address || addressToUse,
          },
          source: RequestSource.MOBILE_WALLET_PROTOCOL,
          timedOut: false,
          callback: async (approved, chainId, address) => {
            addressToUse = address;
            chainIdToUse = chainId;

            if (approved) {
              logger.debug(`Handshake approved for ${action.appId}`);
              const success = await approveHandshake(dappMetadata);
              resolve(success);
            } else {
              logger.debug(`Handshake rejected for ${action.appId}`);
              await rejectHandshake(MobileWalletProtocolUserErrors.USER_REJECTED_HANDSHAKE);
              reject(MobileWalletProtocolUserErrors.USER_REJECTED_HANDSHAKE);
            }
          },
        };

        Navigation.handleAction(
          Routes.WALLET_CONNECT_APPROVAL_SHEET,
          routeParams,
          getActiveRoute()?.name === Routes.WALLET_CONNECT_APPROVAL_SHEET
        );
      });
    } else if (isEthereumAction(action)) {
      logger.debug(`Processing ethereum action: ${action.method}`);
      if (!supportedMobileWalletProtocolActions.includes(action.method)) {
        logger.error(new RainbowError(`[handleMobileWalletProtocolRequest]: Unsupported action type ${action.method}`));
        await rejectAction(action, {
          message: 'Unsupported action type',
          code: 4001,
        });
        return false;
      }

      if (action.method === 'wallet_switchEthereumChain') {
        const isSupportedChain = useBackendNetworksStore
          .getState()
          .getSupportedMainnetChainIds()
          .includes(BigNumber.from(action.params.chainId).toNumber());
        if (!isSupportedChain) {
          await rejectAction(action, {
            message: 'Unsupported chain',
            code: 4001,
          });
          return false;
        }

        await approveAction(action, { value: 'null' });
        return true;
      }

      // NOTE: This is a workaround to approve the eth_requestAccounts action if the previous action was a handshake action.
      const previousAction = request.actions[currentIndex - 1];
      if (previousAction && isHandshakeAction(previousAction)) {
        logger.debug('Approving eth_requestAccounts');
        await approveAction(action, {
          value: JSON.stringify({
            chain: request.account?.chain ?? 'eth',
            networkId: chainIdToUse,
            address: addressToUse,
          }),
        });
        return true;
      }

      const nativeCurrency = store.getState().settings.nativeCurrency;

      // @ts-expect-error - coinbase host protocol types are NOT correct e.g. {"data": [72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100], "type": "Buffer"}
      if ((action as PersonalSignAction).params.message && (action as PersonalSignAction).params.message.type === 'Buffer') {
        // @ts-expect-error - coinbase host protocol types are NOT correct e.g. {"data": [72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100], "type": "Buffer"}
        const messageFromBuffer = toUtf8String(Buffer.from((action as PersonalSignAction).params.message.data, 'hex'));
        (action as PersonalSignAction).params.message = messageFromBuffer;
      }

      const payload = {
        method: action.method,
        params: constructEthereumActionPayload(action),
      };

      const displayDetails = await getRequestDisplayDetails(payload, nativeCurrency, request.account?.networkId ?? ChainId.mainnet);
      const address = (action as PersonalSignAction).params.address || request.account?.address || accountAddress;
      const requestWithDetails: RequestData = {
        dappName: session?.dappName ?? session?.dappId ?? '',
        dappUrl: session?.dappURL ?? '',
        imageUrl: session?.dappImageURL ?? '',
        address,
        chainId: request.account?.networkId ?? ChainId.mainnet,
        payload,
        displayDetails,
      };

      return new Promise((resolve, reject) => {
        const onSuccess = async (result: string) => {
          logger.debug(`Ethereum action approved: [${action.method}]: ${result}`);
          const success = await approveAction(action, { value: JSON.stringify(result) });
          resolve(success);
        };

        const onCancel = async (error?: Error) => {
          if (error) {
            logger.debug(`Ethereum action rejected: [${action.method}]: ${error.message}`);
            await rejectAction(action, {
              message: error.message,
              code: 4001,
            });
            reject(error.message);
          } else {
            logger.debug(`Ethereum action rejected: [${action.method}]: User rejected request`);
            await rejectAction(action, {
              message: MobileWalletProtocolUserErrors.USER_REJECTED_REQUEST,
              code: 4001,
            });
            reject(MobileWalletProtocolUserErrors.USER_REJECTED_REQUEST);
          }
        };

        Navigation.handleAction(Routes.CONFIRM_REQUEST, {
          transactionDetails: requestWithDetails,
          onSuccess,
          onCancel,
          onCloseScreen: noop,
          chainId: request.account?.networkId ?? ChainId.mainnet,
          address,
          source: RequestSource.MOBILE_WALLET_PROTOCOL,
        });
      });
    } else {
      logger.error(new RainbowError(`[handleMobileWalletProtocolRequest]: Unsupported action type, ${action}`));
      return false;
    }
  };

  const handleActions = async (actions: typeof request.actions, currentIndex = 0): Promise<boolean> => {
    if (currentIndex >= actions.length) {
      logger.debug(`All actions completed successfully: ${actions.length}`);
      return true;
    }

    logger.debug(`Processing action ${currentIndex + 1} of ${actions.length}`);
    const success = await handleAction(currentIndex);
    if (success) {
      return handleActions(actions, currentIndex + 1);
    } else {
      // stop processing if an action fails
      return false;
    }
  };

  // start processing actions starting at index 0
  return handleActions(request.actions);
};

// Dapp Browser

export interface DappConnectionData {
  dappName?: string;
  dappUrl: string;
  imageUrl?: string;
  chainId?: number;
  address?: string;
}

export const handleDappBrowserConnectionPrompt = (
  dappData: DappConnectionData
): Promise<{ chainId: ChainId; address: Address } | Error> => {
  return new Promise((resolve, reject) => {
    const receivedTimestamp = Date.now();
    const routeParams: WalletconnectApprovalSheetRouteParams = {
      receivedTimestamp,
      meta: {
        chainIds: useBackendNetworksStore.getState().getSupportedMainnetChainIds(),
        dappName: dappData?.dappName || dappData.dappUrl,
        dappUrl: dappData.dappUrl,
        imageUrl: maybeSignUri(dappData.imageUrl),
        isWalletConnectV2: false,
        peerId: '',
        dappScheme: null,
        proposedChainId: dappData.chainId,
        proposedAddress: dappData.address,
      },
      source: RequestSource.BROWSER,
      timedOut: false,
      callback: async (approved, approvedChainId, accountAddress) => {
        if (approved) {
          // if approved resolve with (chainId, address)
          resolve({ chainId: approvedChainId, address: accountAddress });
        } else {
          // else reject
          reject(new Error('Connection not approved'));
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
  });
};

const findWalletForAddress = async (address: string) => {
  if (!address.trim()) {
    return Promise.reject(new Error('Invalid address'));
  }

  const { wallets } = store.getState().wallets;
  const selectedWallet = findWalletWithAccount(wallets!, address);
  if (!selectedWallet) {
    return Promise.reject(new Error('Wallet not found'));
  }

  const isReadOnlyWallet = selectedWallet.type === walletTypes.readOnly;
  if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
    watchingAlert();
    return Promise.reject(new Error('This wallet is read-only.'));
  }

  return selectedWallet;
};

export const handleDappBrowserRequest = async (request: Omit<RequestData, 'displayDetails'>): Promise<string | Error> => {
  await findWalletForAddress(request.address);

  const nativeCurrency = store.getState().settings.nativeCurrency;
  const displayDetails = await getRequestDisplayDetails(request.payload, nativeCurrency, request.chainId);

  const requestWithDetails: RequestData = {
    ...request,
    displayDetails,
  };

  return new Promise((resolve, reject) => {
    const onSuccess = (result: string) => {
      resolve(result); // Resolve the promise with the result string
    };

    const onCancel = (error?: Error) => {
      if (error) {
        reject(error); // Reject the promise with the provided error
      } else {
        reject(new Error('Operation cancelled by the user.')); // Reject with a default error if none provided
      }
    };

    const onCloseScreen = (canceled: boolean) => {
      // This function might not be necessary for the promise logic,
      // but you can still use it for cleanup or logging if needed.
    };

    Navigation.handleAction(Routes.CONFIRM_REQUEST, {
      transactionDetails: requestWithDetails,
      onSuccess,
      onCancel,
      onCloseScreen,
      chainId: request.chainId,
      address: request.address,
      source: RequestSource.BROWSER,
    });
  });
};

// Walletconnect
export const handleWalletConnectRequest = async (request: WalletconnectRequestData) => {
  const chainId = request?.walletConnectV2RequestValues?.chainId;
  if (!chainId) return;
  const network = useBackendNetworksStore.getState().getChainsName()[chainId];
  const address = request?.walletConnectV2RequestValues?.address;

  const onSuccess = async (result: string) => {
    if (request?.walletConnectV2RequestValues) {
      await handleSessionRequestResponse(request?.walletConnectV2RequestValues, {
        result: result,
        error: null,
      });
    }
    removeWalletConnectRequest({
      walletConnectRequestId: request.requestId,
    });
  };

  const onCancel = async (error?: Error) => {
    if (request?.requestId) {
      if (request?.walletConnectV2RequestValues) {
        await handleSessionRequestResponse(request?.walletConnectV2RequestValues, {
          result: null,
          error: error || 'User cancelled the request',
        });
      }
    }
    removeWalletConnectRequest({
      walletConnectRequestId: request.requestId,
    });
  };

  const onCloseScreen = (canceled: boolean) => {
    let type: WalletconnectResultType = request.payload?.method === SEND_TRANSACTION ? 'transaction' : 'sign';
    if (canceled) {
      type = `${type}-canceled`;
    }

    if (request?.walletConnectV2RequestValues?.onComplete) {
      InteractionManager.runAfterInteractions(() => {
        request?.walletConnectV2RequestValues?.onComplete?.(type);
      });
    }
  };

  hideWalletConnectToast();

  Navigation.handleAction(Routes.CONFIRM_REQUEST, {
    transactionDetails: request,
    onCancel,
    onSuccess,
    onCloseScreen,
    network,
    address,
    chainId,
    source: RequestSource.WALLETCONNECT,
  });
};
