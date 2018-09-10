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
      AlertIOS.alert('Unable to initialize with WalletConnect');
      return null;
    }
  } else {
    AlertIOS.alert('Unable to find wallet FCM token.');
    return null;
  }
}

export const walletConnectDisconnect = async (walletConnector) => {
  // TODO: removing session from commonStorage
  // const session = await commonStorage.removeWalletConnectSession(sessionId);
  if (walletConnector) {
    try {
      await walletConnector.disconnectSession(sessionId);
    } catch (error) {
      AlertIOS.alert('Failed to disconnect WalletConnect session');
    }
  }
}

export const walletConnectGetAllTransactions = async (allValidSessions) => {
  try {
    // TODO: may be all valid walletconnectos (not sessions)
    // const allValidSessions = await commonStorage.getAllValidWalletConnectSessions();
    const sessionToTransactions = mapValues(allValidSessions, (session) => {
      const walletConnector = new RNWalletConnect(session.uriString);
      const sessionId = walletConnector.sessionId;
      const dappName = walletConnector.dappName;
      const sessionTransactions = await walletConnector.getAllTransactionRequests();
      const sessionTransactionMapping = mapValues(sessionTransactions, (transactionPayload, transactionId) => {
        return { sessionId, transactionId, transactionPayload, dappName };
      });
      return sessionTransactionMapping;
    });
    const transactionValues = values(sessionToTransactions);
    const allTransactions = assign({}, ...transactionValues);
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
  //const session = await commonStorage.getWalletConnectSession(sessionId);
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
