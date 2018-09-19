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
  const something = walletConnector._parseWalletConnectURI(uriString);
  console.log('walletconnector', walletConnector);
  if (fcmToken) {
    try {
      await walletConnector.sendSessionStatus({ fcmToken, pushEndpoint: PUSH_ENDPOINT, data: [accountAddress] });
      console.log('sent session status');
      await commonStorage.saveWalletConnectSession(walletConnector.sessionId, uriString, walletConnector.expires);
      console.log('saved wc session');
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
    const allSessions = await commonStorage.getLocal('walletconnect');
    //const allSessions = await commonStorage.getAllValidWalletConnectSessions();
    console.log('>>>all sessions', allSessions);
    const allConnectors = mapValues(allSessions, (session) => {
      const walletConnector = new RNWalletConnect(session.uriString);
      walletConnector.expires = session.expiration;
      return walletConnector;
    });
    console.log('allconnectors', allConnectors);
    return allConnectors;
  } catch (error) {
    AlertIOS.alert('Unable to retrieve all WalletConnect sessions.');
    console.log('init all connectors error');
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
    console.log('wc get all txns');
    const sessionToTransactions = mapValues(walletConnectors, async (walletConnector) => {
      const sessionId = walletConnector.sessionId;
      const dappName = walletConnector.dappName;
      const sessionTransactions = await walletConnector.getAllTransactionRequests();
      const sessionTransactionMapping = mapValues(sessionTransactions, (transactionPayload, transactionId) => {
        return { sessionId, transactionId, transactionPayload, dappName };
      });
      return sessionTransactionMapping;
    });
    console.log('sessionToTxns', sessionToTransactions);
    const transactionValues = values(sessionToTransactions);
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
