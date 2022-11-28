import SignClient from '@walletconnect/sign-client';
import { WC_PROJECT_ID } from 'react-native-dotenv';
import { useNavigation } from '@react-navigation/native';

import store from '@/redux/store';
import { saveWalletConnectUri } from '@/redux/walletconnect';

export async function handleWalletConnectV2QR ({
  uri,
  navigation,
}: {
  uri: string
  navigation: ReturnType<typeof useNavigation>
}) {
  const { walletConnectUris } = store.getState().walletconnect;
  if (walletConnectUris.includes(uri)) return;
  store.dispatch(saveWalletConnectUri(uri));

  const signClient = await SignClient.init({
    projectId: WC_PROJECT_ID,
    // relayUrl: "<YOUR RELAY URL>",
    metadata: {
      name: '🌈 Rainbow',
      description: 'Rainbow makes exploring Ethereum fun and accessible 🌈',
      url: 'https://rainbow.me',
      icons: ['https://avatars2.githubusercontent.com/u/48327834?s=200&v=4'],
    },
  });

  signClient.on('session_proposal', proposal => {
    console.log(JSON.stringify(proposal, null, '  '));

    const receivedTimestamp = Date.now();
    const routeParams = {
      receivedTimestamp,
      meta: {
        chainId: 1, // TODO
        dappName: '',
        dappUrl: '',
        imageUrl: '',
      },
      timedOut: false, // TODO
      async callback(
        approved: boolean,
        chainId: number,
        accountAddress: string,
      ) {
      }
    }
  });

  await signClient.core.pairing.pair({ uri });
}
