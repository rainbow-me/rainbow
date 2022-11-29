import SignClient from '@walletconnect/sign-client';
import { WC_PROJECT_ID } from 'react-native-dotenv';
import { useNavigation } from '@react-navigation/native';
import { URL } from 'url';
import qs from 'querystring';
import { InteractionManager } from 'react-native';

import { IS_TEST } from '@/env';
import { logger, RainbowError } from '@/logger';
import store from '@/redux/store';
import {
  saveWalletConnectUri,
  WalletconnectApprovalSheetRouteParams,
} from '@/redux/walletconnect';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import { delay } from '@/helpers/utilities';

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

/**
 * Like the `waintingFn` from the v1 impl
 */
function runAfterInteractions(callback: () => unknown) {
  return IS_TEST
    ? setTimeout(callback, 2000)
    : InteractionManager.runAfterInteractions(callback);
}

export async function handleWalletConnectV2QR(
  {
    uri,
    navigation,
  }: {
    uri: string;
    navigation: ReturnType<typeof useNavigation>;
  },
  // TODO no idea what dappScheme is
  callback?: (status: string, dappScheme: string) => void
) {
  logger.debug(`WCv2 handleWalletConnectV2QR`, { uri, WC_PROJECT_ID });

  const receivedTimestamp = Date.now();
  let timeout: NodeJS.Timeout | undefined;

  // const { walletConnectUris } = store.getState().walletconnect;
  // if (walletConnectUris.includes(uri)) return;
  // store.dispatch(saveWalletConnectUri(uri));

  try {
    const client = await signClient;
    let alreadyNavigated = false;

    const handleApproveOrDeny: WalletconnectApprovalSheetRouteParams['callback'] = async ({
      approved,
      chainId,
      accountAddress,
      walletConnectV2Proposal,
    }) => {
      const {
        id,
        proposer,
        requiredNamespaces,
      } = walletConnectV2Proposal.params;

      if (alreadyNavigated) {
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
           * WC v2 stores existing sessions itself, so we don't need to persist
           * ourselves
           */
          const { topic, acknowledged } = await client.approve({
            id,
            namespaces,
          });
          const session = await acknowledged();

          logger.debug(`WC v2: session created`, { session });

          callback?.('connect', '');

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

          // store.dispatch(
          //   walletConnectRejectSession(peerId, walletConnector!)
          // );
          callback?.('reject', '');
          analytics.track('Rejected new WalletConnect session', {
            dappName: proposer.metadata.name,
            dappUrl: proposer.metadata.url,
          });
        }
      } else {
        callback?.('timedOut', '');
        const url = new URL(uri);
        const bridge = qs.parse(url?.search)?.bridge;

        logger.debug(`WC v2: session approval timed out`, {
          approved,
          chainId,
          accountAddress,
        });

        analytics.track('New WalletConnect session time out', {
          bridge,
          dappName: proposer.metadata.name,
          dappUrl: proposer.metadata.url,
        });
      }

      // TODO do I need to clean up pairings? WC doesn't do it for me, even though I might have denied the session
    };

    runAfterInteractions(async () => {
      if (!IS_TEST) {
        // Wait until the app is idle so we can navigate
        // This usually happens only when coming from a cold start
        while (!store.getState().appState.walletReady) {
          await delay(300);
        }
      }

      logger.debug(`WC v2: wallet ready, moving along...`);

      timeout = setTimeout(() => {
        if (alreadyNavigated) {
          logger.debug(
            `WC v2: session_proposal already processed, ignoring timeout`
          );
          return;
        }

        logger.debug(`WC v2: session_proposal timed out`);

        const routeParams: WalletconnectApprovalSheetRouteParams = {
          receivedTimestamp,
          timedOut: true,
          callback: handleApproveOrDeny,
        };

        Navigation.handleAction(
          Routes.WALLET_CONNECT_APPROVAL_SHEET,
          routeParams
        );
      }, 20_000);

      // TODO why would I want to navigate again here? V1 sends navigate, maybe shows a loading state?
      // if I do need this, I need to clear the timeout too
    });

    client.on('session_proposal', proposal => {
      logger.debug(`WC v2: session_proposal`, { event: proposal });

      if (timeout) clearTimeout(timeout);

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
          walletConnectV2Proposal: proposal,
        },
        timedOut: false,
        callback: handleApproveOrDeny,
      };

      Navigation.handleAction(
        Routes.WALLET_CONNECT_APPROVAL_SHEET,
        routeParams
      );

      alreadyNavigated = true;
    });

    await client.core.pairing.pair({ uri });
  } catch (e) {
    if (timeout) clearTimeout(timeout);
    console.error(e);
  }
}

export async function initListeners() {
  const client = await signClient;

  // TODO ignore expired requests?

  client.on('session_request', event => {
    logger.debug(`WC v2: session_request`, { event });
  });

  client.on('session_delete', event => {
    logger.debug(`WC v2: session_delete`, { event });
  });

  const pairings = client.core.pairing.getPairings();
  logger.debug(`initListeners`, { pairings });
  // pairings.forEach(p => client.core.pairing.disconnect({ topic: p.topic }));
}
