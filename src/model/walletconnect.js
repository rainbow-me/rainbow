import FCM from 'react-native-fcm';
import { WalletConnector } from 'walletconnect';
import * as ethWallet from './ethWallet';

export let walletConnectInstance = {
  walletWebhook: 'https://walletconnect.balance.io/webhook/push-notify',
  fcmToken: null,
  walletConnector: null 
}

export const walletConnectInit = async (bridgeDomain, sessionId, sharedKey, dappName) => {
  const fcmToken = await FCM.getFCMToken();
  const walletConnector = new WalletConnector(bridgeDomain, { sessionId: sessionId, sharedKey: sharedKey, dappName: dappName });
  walletConnectInstance.walletConnector = walletConnector;
  walletConnectInstance.fcmToken = fcmToken;
}

export const walletConnectSendSession = async () => {
  const address = await ethWallet.loadAddress();
  const encryptedData = await walletConnector.encrypt({address: address});
  await walletConnectInstance.walletConnector.sendSessionStatus({
    fcmToken: walletConnectInstance.fcmToken,
    walletWebhook: walletConnectInstance.walletWebhook,
    data: { address: address }
  });
}
