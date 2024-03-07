import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

// we should move these types since import from redux is not kosher
import { RequestData, removeRequest } from '@/redux/requests';
import store from '@/redux/store';
import { WalletconnectResultType, walletConnectRemovePendingRedirect, walletConnectSendStatus } from '@/redux/walletconnect';
import { InteractionManager } from 'react-native';
import { SEND_TRANSACTION } from './signingMethods';
import { handleSessionRequestResponse } from '@/walletConnect';
import ethereumUtils from './ethereumUtils';

export const handleWalletConnectRequest = async (request: RequestData) => {
  const pendingRedirect = store.getState().walletconnect.pendingRedirect;
  const walletConnector = store.getState().walletconnect.walletConnectors[request.peerId];

  // @ts-expect-error Property '_chainId' is private and only accessible within class 'Connector'.ts(2341)
  const network = ethereumUtils.getNetworkFromChainId(request?.walletConnectV2RequestValues?.chainId || walletConnector?._chainId);
  // @ts-expect-error Property '_accounts' is private and only accessible within class 'Connector'.ts(2341)
  const address = request?.walletConnectV2RequestValues?.address || walletConnector?._accounts?.[0];

  console.log('type: ', request.payload?.method);
  const onSuccess = async (result: string) => {
    if (request?.walletConnectV2RequestValues) {
      console.log('handleSessionRequestResponse: ', request?.walletConnectV2RequestValues);
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
          result: 'null',
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
    console.log('type');
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
        request?.walletConnectV2RequestValues?.onComplete(type);
      });
    }
  };
  Navigation.handleAction(Routes.CONFIRM_REQUEST, {
    openAutomatically: true,
    transactionDetails: request,
    onCancel,
    onSuccess,
    onCloseScreen,
    network,
    address,
  });
};
