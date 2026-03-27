import { type IWalletKit, WalletKit } from '@reown/walletkit';
import type WalletConnectCore from '@walletconnect/core';
import { Core } from '@walletconnect/core';
import { WC_PROJECT_ID } from 'react-native-dotenv';

let walletConnectCore: WalletConnectCore | undefined;

let walletKitClient: ReturnType<(typeof WalletKit)['init']> | undefined;

let initPromise: Promise<IWalletKit> | undefined = undefined;

export const initializeWCv2 = async () => {
  if (!walletConnectCore) {
    walletConnectCore = new Core({ projectId: WC_PROJECT_ID });
  }

  if (!walletKitClient) {
    // eslint-disable-next-line require-atomic-updates
    walletKitClient = WalletKit.init({
      core: walletConnectCore,
      metadata: {
        name: '\u{1F308} Rainbow',
        description: 'Rainbow makes exploring Ethereum fun and accessible \u{1F308}',
        url: 'https://rainbow.me',
        icons: ['https://avatars2.githubusercontent.com/u/48327834?s=200&v=4'],
        redirect: {
          native: 'rainbow://wc',
          universal: 'https://rnbwapp.com/wc',
        },
      },
    });
  }

  return walletKitClient;
};

export async function getWalletKitClient() {
  if (!initPromise) {
    initPromise = initializeWCv2();
  }

  return initPromise;
}
