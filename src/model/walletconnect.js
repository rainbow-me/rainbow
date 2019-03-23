import lang from 'i18n-js';
import {
  assign,
  forEach,
  get,
  mapValues,
  values,
} from 'lodash';
import { commonStorage } from '@rainbow-me/rainbow-common';
import { AlertIOS } from 'react-native';
import RNWalletConnect from 'rn-walletconnect-wallet';

const PUSH_ENDPOINT = 'https://us-central1-rainbow-me.cloudfunctions.net/push';

export const walletConnectInit = async (accountAddress, uriString) => {
  try {
    const fcmTokenLocal = await commonStorage.getLocal('rainbowFcmToken');
    const fcmToken = get(fcmTokenLocal, 'data', null);
    if (!fcmToken) {
      throw new Error('Push notification token unavailable.');
    }

    try {
      const walletConnector = new RNWalletConnect({
        push: {
          token: fcmToken,
          type: 'fcm',
          webhook: PUSH_ENDPOINT,
        },
        uri: uriString,
      });
      await walletConnector.approveSession({ accounts: [accountAddress] });
      await commonStorage.saveWalletConnectSession(walletConnector.sessionId, uriString, walletConnector.expires);
      return walletConnector;
    } catch (error) {
      console.log(error);
      AlertIOS.alert(lang.t('wallet.wallet_connect.error'));
      return null;
    }
  } catch (error) {
    AlertIOS.alert(lang.t('wallet.wallet_connect.missing_fcm'));
    return null;
  }
};

export const walletConnectInitAllConnectors = async () => {
  try {
    const allSessions = await commonStorage.getAllValidWalletConnectSessions();
    const allConnectors = mapValues(allSessions, (session) => {
      const walletConnector = new RNWalletConnect({
        push: null,
        uri: session.uriString,
      });
      walletConnector.expires = session.expiration;
      return walletConnector;
    });
    return allConnectors;
  } catch (error) {
    AlertIOS.alert('Unable to retrieve all WalletConnect sessions.');
    return {};
  }
};

export const walletConnectDisconnectAll = async (walletConnectors) => {
  try {
    const sessionIds = values(mapValues(walletConnectors, (walletConnector) => walletConnector.sessionId));
    await commonStorage.removeWalletConnectSessions(sessionIds);
    forEach(walletConnectors, (walletConnector) => walletConnector.killSession());
  } catch (error) {
    AlertIOS.alert('Failed to disconnect all WalletConnect sessions');
  }
};

const getRequestsForSession = (walletConnector) => new Promise((resolve, reject) => {
  const { dappName, sessionId } = walletConnector;
  walletConnector.getAllCallRequests()
    .then((allCalls) =>
      resolve(mapValues(allCalls, (requestPayload, callId) => ({
        callData: get(requestPayload, 'data'),
        callId,
        dappName,
        sessionId,
      }))))
    .catch(error => resolve({}));
});

export const walletConnectGetAllRequests = async (walletConnectors) => {
  try {
    const sessionToRequests = mapValues(walletConnectors, getRequestsForSession);
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
