import AsyncStorage from '@react-native-community/async-storage';
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/clientv2';
import { ClientTypes, SessionTypes } from '@walletconnect/typesv2';
import { Alert } from 'react-native';
import { Navigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

let client: WalletConnectClient;

const wcLogger = (a: String, b?: any) => console.info(`::: WC ::: ${a}`, b);

function handleSessionUserApproval(
  userApproved: boolean,
  proposal: SessionTypes.Proposal
) {
  if (userApproved) {
    // if user approved then include response with accounts matching the chains and wallet metadata
    const response: SessionTypes.Response = {
      state: {
        accounts: ['0x292D909a4A38ff5023E539CD4dFFE92493fd8380@eip155:1'],
      },
    };
    client.approve({ proposal, response });
  } else {
    // if user didn't approve then reject with no response
    client.reject({ proposal });
  }
}

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
      const { name, url, icons } = metadata;
      Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {
        callback: (approved: boolean) => {
          if (approved) {
            wcLogger('approved');
          } else {
            wcLogger('rejected');
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
