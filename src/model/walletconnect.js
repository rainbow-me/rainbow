import RNWalletConnect from 'rn-walletconnect-wallet';
import lang from 'react-native-i18n';
import { commonStorage } from 'balance-common';
import { AlertIOS } from 'react-native';

const PUSH_ENDPOINT = 'https://walletconnect.balance.io/webhook/push-notify';

export const walletConnectInit = async (accountAddress, bridgeUrl, sessionId, sharedKey, dappName) => {
  const fcmTokenLocal = await commonStorage.getLocal('balanceWalletFcmToken');
  const fcmToken = fcmTokenLocal ? fcmTokenLocal.data : null;
  const walletConnector = new RNWalletConnect({ bridgeUrl, sessionId, sharedKey, dappName });
  // TODO fcmToken is null logic
  await commonStorage.saveWalletConnectSession({ bridgeUrl, sessionId, sharedKey, dappName });
  try {
    await walletConnector.sendSessionStatus({ fcmToken, pushEndpoint: PUSH_ENDPOINT, data: [accountAddress] });
  } catch (error) {
    AlertIOS.alert(lang.t('wallet.wallet_connect.error'));
  }
}

export const walletConnectGetTransaction = async (transactionId) => {
  try {
    const walletConnectSession = await commonStorage.getWalletConnectSession();
    if (walletConnectSession) {
      const { bridgeUrl, sessionId, sharedKey, dappName } = walletConnectSession;
      const walletConnector = new RNWalletConnect({ bridgeUrl, dappName, sessionId, sharedKey});
      return await walletConnector.getTransactionRequest(transactionId);
    }
    return null;
  } catch(error) {
    console.log('Error getting transaction from Wallet Connect', error);
    // TODO: show error
    return null;
  }
};

export const walletConnectSendTransactionHash = async (transactionId, success, txHash) => {
  const walletConnectSession = await commonStorage.getWalletConnectSession();
  if (walletConnectSession) {
    const { bridgeUrl, sessionId, sharedKey, dappName } = walletConnectSession;
    const walletConnector = new RNWalletConnect({ bridgeUrl, dappName, sessionId, sharedKey});
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
