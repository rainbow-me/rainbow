import RNWalletConnect from 'rn-walletconnect-wallet';
import { commonStorage } from 'balance-common';

const PUSH_ENDPOINT = 'https://walletconnect.balance.io/webhook/push-notify';

export const walletConnectInit = async (accountAddress, bridgeUrl, sessionId, sharedKey, dappName) => {
  const fcmTokenLocal = await commonStorage.getLocal('fcmToken');
  const fcmToken = fcmTokenLocal ? fcmTokenLocal.data : null;
  const walletConnector = new RNWalletConnect({ bridgeUrl, sessionId, sharedKey, dappName });
  await commonStorage.saveWalletConnectAccount({ bridgeUrl, sessionId, sharedKey, dappName });
  try {
    await walletConnector.sendSessionStatus({ fcmToken, pushEndpoint: PUSH_ENDPOINT, data: [accountAddress] });
  } catch (error) {
    console.log('error sending session status', error);
    // TODO: show error 
  }
}

export const walletConnectGetTransaction = async (transactionId) => {
  const { bridgeUrl, sessionId, sharedKey, dappName } = await commonStorage.getWalletConnectAccount();
  const walletConnector = new RNWalletConnect({ bridgeUrl, dappName, sessionId, sharedKey});
  const transaction = await walletConnector.getTransactionRequest(transactionId);
  return transaction;
};

export const walletConnectSendTransactionHash = async (transactionId, success, txHash) => {
  const { bridgeUrl, dappName, sessionId, sharedKey }  = await commonStorage.getWalletConnectAccount();
  const walletConnector = new RNWalletConnect({ bridgeUrl, dappName, sessionId, sharedKey});
  try {
    await walletConnector.sendTransactionStatus(transactionId, { success, txHash });
  } catch (error) {
    console.log('error sending transaction hash', error);
    //TODO error handling
  }
};

