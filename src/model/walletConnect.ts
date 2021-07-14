import AsyncStorage from '@react-native-community/async-storage';
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/clientv2';
import { ClientTypes, SessionTypes } from '@walletconnect/typesv2';
import { Alert } from 'react-native';
import { Navigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

let client: WalletConnectClient;

const SUPPORTED_MAIN_CHAINS = [
  'eip155:1',
  'eip155:10',
  'eip155:137',
  'eip155:42161',
];

const SUPPORTED_TEST_CHAINS = ['eip155:3', 'eip155:4', 'eip155:5', 'eip155:42'];

const generateWalletConnectAccount = (address: string, chain: string) =>
  `${address}@${chain}`;

// eslint-disable-next-line no-console
const wcLogger = (a: String, b?: any) => console.info(`::: WC ::: ${a}`, b);

const isSupportedChain = (chain: string) =>
  SUPPORTED_MAIN_CHAINS.includes(chain) ||
  SUPPORTED_TEST_CHAINS.includes(chain);

export const walletConnectInit = async () => {
  client = await WalletConnectClient.init({
    controller: true,
    // logger: 'debug',
    metadata: {
      description: 'Rainbow makes exploring Ethereum fun and accessible 🌈',
      icons: ['https://avatars2.githubusercontent.com/u/48327834?s=200&v=4'],
      name: '🌈 Rainbow',
      url: 'https://rainbow.me',
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
      const { proposer, permissions } = proposal;
      const { metadata } = proposer;
      //   let approved: boolean;
      wcLogger('permissions', permissions);
      wcLogger('metadata', metadata);

      const chains = permissions.blockchain.chains;

      // should we connect several networks at the same time?
      if (!isSupportedChain(chains[0])) {
        Alert.alert('Chain not supported', `${chains[0]} is not supported`);
        wcLogger('rejected');
        client.reject({ proposal });
        return;
      }
      const { name, url, icons } = metadata;
      Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {
        callback: (
          approved: boolean,
          chainId: string,
          accountAddress: string
        ) => {
          if (approved) {
            wcLogger('approved');
            const response: SessionTypes.Response = {
              metadata: {
                description:
                  'Rainbow makes exploring Ethereum fun and accessible 🌈',
                icons: [
                  'https://avatars2.githubusercontent.com/u/48327834?s=200&v=4',
                ],
                name: '🌈 Rainbow',
                url: 'https://rainbow.me',
              },
              state: {
                accounts: [
                  generateWalletConnectAccount(accountAddress, chains[0]),
                ],
              },
            };
            client.approve({ proposal, response });
          } else {
            wcLogger('rejected');
            client.reject({ proposal });
          }
        },
        meta: {
          dappName: name,
          dappUrl: url,
          imageUrl: icons?.[0],
        },
      });
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

export const walletConnectPair = async (uri: string) => {
  wcLogger('start walletConnectPair', uri);
  const pair = await client.pair({ uri });
  // when is paired we'll get a SessionTypes.Proposal
  wcLogger('on walletConnectPair', pair);
};
