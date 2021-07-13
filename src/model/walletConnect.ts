import AsyncStorage from '@react-native-community/async-storage';
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/clientv2';
import { ClientTypes, SessionTypes } from '@walletconnect/typesv2';

let client: WalletConnectClient;

const wcLogger = (a: String, b?: any) => console.log(`WC ::: ${a}`, b);

export const walletConnectInit = async () => {
  client = await WalletConnectClient.init({
    controller: true,
    logger: 'debug',
    metadata: {
      description: 'Test Wallet',
      icons: ['https://walletconnect.org/walletconnect-logo.png'],
      name: 'Test Wallet',
      url: '#',
    },
    relayProvider: 'wss://relay.walletconnect.org',
    storageOptions: {
      asyncStorage: AsyncStorage as any,
    },
  });

  wcLogger('Client started!');

  client.on(
    CLIENT_EVENTS.session.proposal,
    async (proposal: SessionTypes.Proposal) => {
      // user should be prompted to approve the proposed session permissions displaying also dapp metadata
      //   const { proposer, permissions } = proposal;
      //   const { metadata } = proposer;
      //   let approved: boolean;
      wcLogger('SessionTypes.Proposal', proposal);
      //   handleSessionUserApproval(approved, proposal); // described in the step 4
    }
  );

  client.on(
    CLIENT_EVENTS.session.created,
    async (session: SessionTypes.Created) => {
      // session created succesfully
      wcLogger('SessionTypes.session', session);
    }
  );
};

export const walletConnectPair = async (uri: ClientTypes.PairParams) => {
  wcLogger('start walletConnectPair', uri);
  const pair = await client.pair({ uri });
  wcLogger('on walletConnectPair', pair);
};
