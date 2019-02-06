import {
  assign, get, mapValues, values,
} from 'lodash';
import { AlertIOS } from 'react-native';

export const walletConnectGetAllRequests = async walletConnectors => {
  try {
    const sessionToRequests = mapValues(
      walletConnectors,
      walletConnector => new Promise((resolve, reject) => {
        const { peerMeta, peerId } = walletConnector;
        walletConnector
          .getAllCallRequests()
          .then(allCalls => resolve(
            mapValues(allCalls, (requestPayload, callId) => ({
              callData: get(requestPayload, 'data'),
              peerMeta,
              peerId,
              callId,
            })),
          ))
          .catch(error => resolve({}));
      }),
    );
    const requestValues = await Promise.all(values(sessionToRequests));
    return assign({}, ...requestValues);
  } catch (error) {
    AlertIOS.alert('Error fetching all requests from open WalletConnect sessions.');
    return {};
  }
};

export const walletConnectGetRequest = async (callId, walletConnector) => {
  try {
    if (walletConnector) {
      const callData = await walletConnector.getCallRequest(callId);
      return get(callData, 'data');
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const walletConnectSendStatus = async (walletConnector, callId, result) => {
  if (walletConnector) {
    try {
      if (result) {
        await walletConnector.approveCallRequest(callId, { result });
      } else {
        await walletConnector.rejectCallRequest(callId);
      }
    } catch (error) {
      AlertIOS.alert('Failed to send request status to WalletConnect.');
    }
  } else {
    AlertIOS.alert('WalletConnect session has expired while trying to send request status. Please reconnect.');
  }
};
