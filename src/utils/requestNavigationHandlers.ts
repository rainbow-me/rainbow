import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

// we should move these types since import from redux is not kosher
import { RequestData, WalletconnectRequestData, removeRequest } from '@/redux/requests';
import store from '@/redux/store';
import {
  WalletconnectApprovalSheetRouteParams,
  WalletconnectResultType,
  walletConnectRemovePendingRedirect,
  walletConnectSendStatus,
} from '@/redux/walletconnect';
import { InteractionManager } from 'react-native';
import { SEND_TRANSACTION } from './signingMethods';
import { handleSessionRequestResponse } from '@/walletConnect';
import ethereumUtils from './ethereumUtils';
import { getRequestDisplayDetails } from '@/parsers';
import { RainbowNetworks } from '@/networks';
import { maybeSignUri } from '@/handlers/imgix';
import { getActiveRoute } from '@/navigation/Navigation';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { enableActionsOnReadOnlyWallet } from '@/config';
import walletTypes from '@/helpers/walletTypes';
import watchingAlert from './watchingAlert';

export type RequestSource = 'walletconnect' | 'browser';

// Dapp Browser

export interface DappConnectionData {
  dappName?: string;
  dappUrl: string;
  imageUrl?: string;
  chainId?: number;
  address?: string;
}

export const handleDappBrowserConnectionPrompt = (dappData: DappConnectionData): Promise<{ chainId: number; address: string } | Error> => {
  return new Promise((resolve, reject) => {
    const chainIds = RainbowNetworks.filter(network => network.enabled && network.networkType !== 'testnet').map(network => network.id);
    const receivedTimestamp = Date.now();
    const routeParams: WalletconnectApprovalSheetRouteParams = {
      receivedTimestamp,
      meta: {
        chainIds,
        dappName: dappData?.dappName || dappData.dappUrl,
        dappUrl: dappData.dappUrl,
        imageUrl: maybeSignUri(dappData.imageUrl),
        isWalletConnectV2: false,
        peerId: '',
        dappScheme: null,
        proposedChainId: dappData.chainId,
        proposedAddress: dappData.address,
      },
      source: 'browser',
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

export const handleDappBrowserRequest = async (request: Omit<RequestData, 'displayDetails'>): Promise<string | Error> => {
  const { wallets } = store.getState().wallets;
  const selectedWallet = findWalletWithAccount(wallets!, request.address);
  const isReadOnlyWallet = selectedWallet!.type === walletTypes.readOnly;
  if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
    watchingAlert();
    return Promise.reject(new Error('This wallet is read-only.'));
  }
  const nativeCurrency = store.getState().settings.nativeCurrency;
  const displayDetails = getRequestDisplayDetails(request.payload, nativeCurrency, request.network);

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
      network: request.network,
      address: request.address,
      source: 'browser',
    });
  });
};

// Walletconnect
export const handleWalletConnectRequest = async (request: WalletconnectRequestData) => {
  const pendingRedirect = store.getState().walletconnect.pendingRedirect;
  const walletConnector = store.getState().walletconnect.walletConnectors[request.peerId];

  // @ts-expect-error Property '_chainId' is private and only accessible within class 'Connector'.ts(2341)
  const network = ethereumUtils.getNetworkFromChainId(request?.walletConnectV2RequestValues?.chainId || walletConnector?._chainId);
  // @ts-expect-error Property '_accounts' is private and only accessible within class 'Connector'.ts(2341)
  const address = request?.walletConnectV2RequestValues?.address || walletConnector?._accounts?.[0];

  const onSuccess = async (result: string) => {
    if (request?.walletConnectV2RequestValues) {
      await handleSessionRequestResponse(request?.walletConnectV2RequestValues, {
        result: result,
        error: null,
      });
    } else {
      await store.dispatch(walletConnectSendStatus(request?.peerId, request?.requestId, { result }));
    }
    store.dispatch(removeRequest(request?.requestId));
  };

  const onCancel = async (error?: Error) => {
    if (request?.requestId) {
      if (request?.walletConnectV2RequestValues) {
        await handleSessionRequestResponse(request?.walletConnectV2RequestValues, {
          result: null,
          error: error || 'User cancelled the request',
        });
      } else {
        await store.dispatch(
          walletConnectSendStatus(request?.peerId, request?.requestId, {
            error: error || 'User cancelled the request',
          })
        );
      }
      store.dispatch(removeRequest(request?.requestId));
    }
  };

  const onCloseScreen = (canceled: boolean) => {
    let type: WalletconnectResultType = request.payload?.method === SEND_TRANSACTION ? 'transaction' : 'sign';
    if (canceled) {
      type = `${type}-canceled`;
    }

    if (pendingRedirect) {
      InteractionManager.runAfterInteractions(() => {
        store.dispatch(walletConnectRemovePendingRedirect(type, request?.dappScheme));
      });
    }

    if (request?.walletConnectV2RequestValues?.onComplete) {
      InteractionManager.runAfterInteractions(() => {
        request?.walletConnectV2RequestValues?.onComplete?.(type);
      });
    }
  };
  Navigation.handleAction(Routes.CONFIRM_REQUEST, {
    transactionDetails: request,
    onCancel,
    onSuccess,
    onCloseScreen,
    network,
    address,
    source: 'walletconnect',
  });
};
