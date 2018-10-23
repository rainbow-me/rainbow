import RNWalletConnect from 'rn-walletconnect-wallet';
import lang from 'i18n-js';
import { commonStorage } from 'balance-common';
import { AlertIOS } from 'react-native';
import { assign, get, mapValues, values } from 'lodash';
//const PUSH_ENDPOINT = 'https://walletconnect.balance.io/webhook/push-notify';
const PUSH_ENDPOINT = 'https://us-central1-balance-424a3.cloudfunctions.net/push';

export const walletConnectInit = async (accountAddress, uriString) => {
  const fcmTokenLocal = await commonStorage.getLocal('balanceWalletFcmToken');
  const fcmToken = fcmTokenLocal ? fcmTokenLocal.data : null;
  if (fcmToken) {
    try {
      const walletConnector = new RNWalletConnect({
        uri: uriString,
        push: {
          type: 'fcm',
          token: fcmToken,
          webhook: PUSH_ENDPOINT,
        },
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
}

export const walletConnectInitAllConnectors = async () => {
  try {
    const allSessions = await commonStorage.getAllValidWalletConnectSessions();
    console.log('allSessions', allSessions);
    const allConnectors = mapValues(allSessions, (session) => {
      const walletConnector = new RNWalletConnect({
        uri: session.uriString,
        push: null,
      });
      walletConnector.expires = session.expiration;
      return walletConnector;
    });
    return allConnectors;
  } catch (error) {
    AlertIOS.alert('Unable to retrieve all WalletConnect sessions.');
    return {};
  }
}

export const walletConnectDisconnect = async (walletConnector) => {
  if (walletConnector) {
    try {
      await commonStorage.removeWalletConnectSession(walletConnector.sessionId);
      await walletConnector.killSession();
    } catch (error) {
      AlertIOS.alert('Failed to disconnect WalletConnect session');
    }
  }
}

export const walletConnectGetAllTransactions = async (walletConnectors) => {
  try {
    const sessionToTransactions = mapValues(walletConnectors, (walletConnector) => new Promise((resolve, reject) => {
      const sessionId = walletConnector.sessionId;
      const dappName = walletConnector.dappName;
      walletConnector.getAllCallRequests()
      .then(allCalls => {
        const sessionTransactionMapping = mapValues(allCalls, (transactionPayload, callId) => {
          const callData = get(transactionPayload, 'data.params[0]', null);
          return { sessionId, transactionId: callId, callData, dappName };
        });
        resolve(sessionTransactionMapping);
      }).catch(error => {
        resolve({});
      });
    }));
    const sessionTransactionValues = values(sessionToTransactions);
    const transactionValues = await Promise.all(sessionTransactionValues);
    const allTransactions = assign({}, ...transactionValues);
    return allTransactions;
  } catch(error) {
    AlertIOS.alert('Error fetching all transactions from open WalletConnect sessions.');
    return {};
  }
};

export const walletConnectGetTransaction = async (callId, walletConnector) => {
  try {
    if (walletConnector) {
      const dappName = walletConnector.dappName;
      const callData = await walletConnector.getCallRequest(callId);
      transaction = get(callData, 'data.params[0]', null);
      return { callData: transaction, dappName };
    }
    return null;
  } catch(error) {
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
