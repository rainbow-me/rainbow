import SignClient from '@walletconnect/sign-client';
import { SignClientTypes } from '@walletconnect/types';
import { getSdkError, parseUri } from '@walletconnect/utils';
import { WC_PROJECT_ID } from 'react-native-dotenv';
import { NavigationContainerRef } from '@react-navigation/native';

import { logger, RainbowError } from '@/logger';
import { WalletconnectApprovalSheetRouteParams } from '@/redux/walletconnect';
import { Navigation } from '@/navigation';
import { getActiveRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';

const signClient = Promise.resolve(
  SignClient.init({
    projectId: WC_PROJECT_ID,
    // relayUrl: "<YOUR RELAY URL>",
    metadata: {
      name: '🌈 Rainbow',
      description: 'Rainbow makes exploring Ethereum fun and accessible 🌈',
      url: 'https://rainbow.me',
      icons: ['https://avatars2.githubusercontent.com/u/48327834?s=200&v=4'],
    },
  })
);

export async function pair({ uri }: { uri: string }) {
  logger.debug(`WC v2: pair`, { uri });

  // show loading state as feedback for user
  Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {});

  const receivedTimestamp = Date.now();
  const { topic } = parseUri(uri);
  const client = await signClient;

  await client.core.pairing.pair({ uri });

  const timeout = setTimeout(() => {
    const route: ReturnType<
      NavigationContainerRef['getCurrentRoute']
    > = getActiveRoute();

    if (!route) return;

    /**
     * If user is still looking at the approval sheet, show them the failure
     * state. Otherwise, do nothing
     */
    if (route.name === Routes.WALLET_CONNECT_APPROVAL_SHEET) {
      const routeParams: WalletconnectApprovalSheetRouteParams = {
        receivedTimestamp,
        timedOut: true,
        async callback() {
          logger.debug(`callback`);
        },
      };

      // end load state with `timedOut` and provide failure callback
      Navigation.handleAction(
        Routes.WALLET_CONNECT_APPROVAL_SHEET,
        routeParams,
        true
      );
    }

    analytics.track('New WalletConnect session time out');
  }, 20_000);

  function handler(
    proposal: SignClientTypes.EventArguments['session_proposal']
  ) {
    // listen for THIS topic pairing, and clear timeout if received
    if (proposal.params.pairingTopic === topic) {
      client.off('session_proposal', handler);
      clearTimeout(timeout);
    }
  }

  client.on('session_proposal', handler);
}

// TODO ignore expired requests?
export async function initListeners() {
  const client = await signClient;

  client.on('session_proposal', onSessionProposal);
}

export function onSessionProposal(
  proposal: SignClientTypes.EventArguments['session_proposal']
) {
  logger.debug(`WC v2: session_proposal`, { event: proposal });

  const receivedTimestamp = Date.now();
  const {
    id,
    proposer,
    expiry,
    pairingTopic,
    requiredNamespaces,
  } = proposal.params;

  // TODO what if eip155 namespace doesn't exist
  // TODO do I need to check for existing sessions? WC v2 might do this for us

  const { chains } = requiredNamespaces.eip155;
  const chainId = parseInt(chains[0].split('eip155:')[1]);

  const routeParams: WalletconnectApprovalSheetRouteParams = {
    receivedTimestamp,
    meta: {
      chainId,
      dappName: proposer.metadata.name,
      dappScheme: '', // TODO
      dappUrl: proposer.metadata.url,
      imageUrl: proposer.metadata.icons[0],
      peerId: proposer.publicKey,
    },
    timedOut: false,
    callback: async (approved, chainId, accountAddress) => {
      const client = await signClient;
      const { id, proposer, requiredNamespaces } = proposal.params;

      if (approved) {
        logger.debug(`WC v2: session approved`, {
          approved,
          chainId,
          accountAddress,
        });

        const namespaces = Object.keys(requiredNamespaces).reduce<
          Parameters<typeof client.approve>[0]['namespaces']
        >((ns, key) => {
          ns[key] = {
            accounts: [`${key}:${chainId}:${accountAddress}`],
            methods: requiredNamespaces.eip155.methods,
            events: requiredNamespaces.eip155.events,
          };
          return ns;
        }, {});

        /**
         * This is equivalent handling of setPendingRequest and
         * walletConnectApproveSession, since setPendingRequest is only used
         * within the /redux/walletconnect handlers
         *
         * WC v2 stores existing _pairings_ itself, so we don't need to persist
         * ourselves
         */
        const { acknowledged } = await client.approve({
          id,
          namespaces,
        });
        const session = await acknowledged();

        logger.debug(`WC v2: session created`, { session });

        analytics.track('Approved new WalletConnect session', {
          dappName: proposer.metadata.name,
          dappUrl: proposer.metadata.url,
        });
      } else if (!approved) {
        logger.debug(`WC v2: session approval denied`, {
          approved,
          chainId,
          accountAddress,
        });

        await client.reject({ id, reason: getSdkError('USER_REJECTED') });

        analytics.track('Rejected new WalletConnect session', {
          dappName: proposer.metadata.name,
          dappUrl: proposer.metadata.url,
        });
      }
    },
  };

  /**
   * We might see this at any point in the app, so only use `replace`
   * sometimes if the user is already looking at the approval sheet.
   */
  Navigation.handleAction(
    Routes.WALLET_CONNECT_APPROVAL_SHEET,
    routeParams,
    getActiveRoute()?.name === Routes.WALLET_CONNECT_APPROVAL_SHEET
  );
}
