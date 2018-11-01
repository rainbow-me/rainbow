import { commonStorage } from 'balance-common';
import { assign, get, mapValues, values } from 'lodash';
import { AlertIOS } from 'react-native';
import RNWalletConnect from 'rn-walletconnect-wallet';

const PUSH_ENDPOINT = 'https://us-central1-balance-424a3.cloudfunctions.net/push';

export const walletConnectInit = async (accountAddress, uriString) => {
  const fcmTokenLocal = await commonStorage.getLocal('balanceWalletFcmToken');
  const fcmToken = get(fcmTokenLocal, 'data', null);

  if (fcmToken) {
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
      console.log('walletConnector.expires', new Date(walletConnector.expires));
      await commonStorage.saveWalletConnectSession(walletConnector.sessionId, uriString, walletConnector.expires);
      return walletConnector;
    } catch (error) {
      console.log(error);
      AlertIOS.alert('Unable to initialize with WalletConnect');
      return null;
    }
  } else {
    AlertIOS.alert('Unable to find wallet FCM token.');
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

export const walletConnectDisconnect = async (walletConnector) => {
  if (walletConnector) {
    try {
      await commonStorage.removeWalletConnectSession(walletConnector._sessionId);
      await walletConnector.killSession();
    } catch (error) {
      AlertIOS.alert('Failed to disconnect WalletConnect session');
    }
  }
};

const getTransactionForSession = (walletConnector) => new Promise((resolve, reject) => {
  const { dappName, sessionId } = walletConnector;
  walletConnector.getAllCallRequests()
    .then((allCalls) =>
      resolve(mapValues(allCalls, (transactionPayload, callId) => ({
        callData: get(transactionPayload, 'data.params[0]', null),
        dappName,
        sessionId,
        callId,
      }))))
    .catch(error => resolve({}));
});

export const walletConnectGetAllTransactions = async (walletConnectors) => {
  try {
    const sessionToTransactions = mapValues(walletConnectors, getTransactionForSession);
    const transactionValues = await Promise.all(values(sessionToTransactions));
    return assign({}, ...transactionValues);
  } catch (error) {
    AlertIOS.alert('Error fetching all transactions from open WalletConnect sessions.');
    return {};
  }
};

export const walletConnectGetTransaction = async (callId, walletConnector) => {
  try {
    if (walletConnector) {
      const { dappName } = walletConnector;
      const callData = await walletConnector.getCallRequest(callId);
      return {
        callData: get(callData, 'data.params[0]', null),
        dappName,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const walletConnectSendTransactionHash = async (walletConnector, callId, success, txHash) => {
  if (walletConnector) {
    try {
      if (success) {
        await walletConnector.approveCallRequest(callId, { result: txHash });
      } else {
        await walletConnector.rejectCallRequest(callId);
      }
    } catch (error) {
      AlertIOS.alert('Failed to send transaction status to WalletConnect.');
    }
  } else {
    AlertIOS.alert('WalletConnect session has expired while trying to send transaction hash. Please reconnect.');
  }
};
