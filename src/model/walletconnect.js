import RNWalletConnect from 'rn-walletconnect-wallet';
import lang from 'i18n-js';
import { commonStorage } from 'balance-common';
import { AlertIOS } from 'react-native';
import { assign, mapValues, values } from 'lodash';
const PUSH_ENDPOINT = 'https://walletconnect.balance.io/webhook/push-notify';

export const walletConnectInit = async (accountAddress, uriString) => {
  const fcmTokenLocal = await commonStorage.getLocal('balanceWalletFcmToken');
  const fcmToken = fcmTokenLocal ? fcmTokenLocal.data : null;
  const walletConnector = new RNWalletConnect(uriString);
  if (fcmToken) {
    try {
      await walletConnector.sendSessionStatus({ fcmToken, pushEndpoint: PUSH_ENDPOINT, data: [accountAddress] });
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
    console.log('walletconnect init all connectors', commonStorage);
    const allSessions = await commonStorage.getAllValidWalletConnectSessions();
    const allConnectors = mapValues(allSessions, (session) => {
      const walletConnector = new RNWalletConnect(session.uriString);
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
      await walletConnector.disconnectSession(walletConnector.sessionId);
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
      walletConnector.getAllTransactionRequests()
        .then(sessionTransactions => {
          const sessionTransactionMapping = mapValues(sessionTransactions, (transactionPayloadx, transactionId) => {
            return { sessionId, transactionId, transactionPayloadx, dappName };
          });
          resolve(sessionTransactionMapping);
        })
        .catch(error => {
          resolve({});
        });
    }));
    const sessionTransactionValues = values(sessionToTransactions);
    const transactionValues = await Promise.all(sessionTransactionValues);
    const allTransactions = assign({}, ...transactionValues);
    return allTransactions;
  } catch(error) {
    console.log('Error getting all transactions from WalletConnect', error);
    // TODO: show error
    return {};
  }
};

export const walletConnectGetTransaction = async (transactionId, walletConnector) => {
  try {
    if (walletConnector) {
      const dappName = walletConnector.dappName;
      const transactionPayload = await walletConnector.getTransactionRequest(transactionId);
      return { transactionPayload, dappName };
    }
    return null;
  } catch(error) {
    console.log('Error getting transaction from Wallet Connect', error);
    return null;
  }
};

export const walletConnectSendTransactionHash = async (walletConnector, transactionId, success, txHash) => {
  if (walletConnector) {
    try {
      await walletConnector.sendTransactionStatus(transactionId, { success, txHash });
    } catch (error) {
      console.log('error sending transaction hash', error);
      //TODO error handling
    }
  } else {
    //TODO error handling
    console.log('WalletConnect session has expired while trying to send transaction hash');
  }
};
