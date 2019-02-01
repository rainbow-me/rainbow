import { commonStorage } from 'balance-common';
import lang from 'i18n-js';
import {
  assign, forEach, get, mapValues, values,
} from 'lodash';
import { AlertIOS } from 'react-native';
import RNWalletConnect from '@walletconnect/react-native';
import { DEVICE_LANGUAGE } from '../helpers/constants';

const getFCMToken = async () => {
  const fcmTokenLocal = await commonStorage.getLocal('balanceWalletFcmToken');
  const fcmToken = get(fcmTokenLocal, 'data', null);
  if (!fcmToken) {
    throw new Error('Push notification token unavailable.');
  }
  return fcmToken;
};

const getNativeOptions = async () => {
  const language = DEVICE_LANGUAGE.replace(/[-_](\w?)+/gi, '').toLowerCase();
  const token = await getFCMToken();

  const nativeOptions = {
    clientMeta: {
      description: 'Store and secure all your ERC-20 tokens in one place',
      url: 'https://balance.io',
      icons: ['https://avatars0.githubusercontent.com/u/19879255?s=200&v=4'],
      name: 'Balance Wallet',
      ssl: true,
    },
    push: {
      url: 'https://us-central1-balance-424a3.cloudfunctions.net',
      type: 'fcm',
      token,
      peerMeta: true,
      language,
    },
  };

  return nativeOptions;
};

export const walletConnectInit = async (accountAddress, uriString) => {
  try {
    const nativeOptions = await getNativeOptions();
    try {
      const walletConnector = new RNWalletConnect(
        {
          uri: uriString,
        },
        nativeOptions,
      );
      await walletConnector.approveSession({ chainId: 1, accounts: [accountAddress] });
      await commonStorage.saveWalletConnectSession(walletConnector.peerId, walletConnector.session);
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

    const nativeOptions = getNativeOptions();

    const allConnectors = mapValues(allSessions, session => {
      const walletConnector = new RNWalletConnect(
        {
          session,
        },
        nativeOptions,
      );
      return walletConnector;
    });
    return allConnectors;
  } catch (error) {
    AlertIOS.alert('Unable to retrieve all WalletConnect sessions.');
    return {};
  }
};

export const walletConnectDisconnectAll = async walletConnectors => {
  try {
    const peerIds = values(mapValues(walletConnectors, walletConnector => walletConnector.peerId));
    await commonStorage.removeWalletConnectSessions(peerIds);
    forEach(walletConnectors, walletConnector => walletConnector.killSession());
  } catch (error) {
    AlertIOS.alert('Failed to disconnect all WalletConnect sessions');
  }
};

const getRequestsForSession = walletConnector => new Promise((resolve, reject) => {
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
});

export const walletConnectGetAllRequests = async walletConnectors => {
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
