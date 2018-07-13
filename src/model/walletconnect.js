import { WalletConnector } from 'walletconnect';
import personalData from './personalData';
import { commonStorage } from 'balance-common';

const WALLET_WEBHOOK = 'https://walletconnect.balance.io/webhook/push-notify';

export const walletConnectInit = async (bridgeDomain, sessionId, sharedKey, dappName) => {
  const { accountAddress } = getState().account;
  const fcmTokenLocal = commonStorage.getLocal('fcmToken');
  const fcmToken = fcmTokenLocal ? fcmTokenLocal.data : null;
  const walletConnector = new WalletConnector(bridgeDomain, { sessionId, sharedKey, dappName });
  commonStorage.saveWalletConnectAccount(walletConnector);
  try {
    await walletConnector.sendSessionStatus({ fcmToken, WALLET_WEBHOOK, data: { address, personalData } });
  } catch (error) {
    //TODO error handling
  }
}

export const walletConnectSendTransactionHash = async (transactionId, success, txHash) => {
  const walletConnector = commonStorage.getWalletConnectAccount();
  try {
    await walletConnector.sendTransactionStatus(transactionId, { success, txHash });
  } catch (error) {
    //TODO error handling
  }
};

export const walletConnectGetTransaction = async (transactionId) => {
  const walletConnector = commonStorage.getWalletConnectAccount();
  const transaction = await walletConnector.getTransactionRequest(transactionId);
  return transaction;
};
