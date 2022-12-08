import SignClient from '@walletconnect/sign-client';
import { SignClientTypes } from '@walletconnect/types';
import { getSdkError, parseUri } from '@walletconnect/utils';
import { WC_PROJECT_ID } from 'react-native-dotenv';
import { NavigationContainerRef } from '@react-navigation/native';
import Minimizer from 'react-native-minimizer';

import { logger, RainbowError } from '@/logger';
import { WalletconnectApprovalSheetRouteParams } from '@/redux/walletconnect';
import { Navigation } from '@/navigation';
import { getActiveRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import { maybeSignUri } from '@/handlers/imgix';
import { dappLogoOverride, dappNameOverride } from '@/helpers/dappNameHandler';
import { Alert } from '@/components/alerts';
import * as lang from '@/languages';

/**
 * Indicates that the app should redirect or go back after the next action
 * completes
 *
 * This is a hack to get around having to muddy the scopes of our event
 * listeners. BE CAREFUL WITH THIS.
 */
let hasDeeplinkPendingRedirect = false;

/**
 * Set `hasDeeplinkPendingRedirect` to a boolean, indicating that the app
 * should redirect or go back after the next action completes
 *
 * This is a hack to get around having to muddy the scopes of our event
 * listeners. BE CAREFUL WITH THIS.
 */
export function setHasPendingDeeplinkPendingRedirect(value: boolean) {
  hasDeeplinkPendingRedirect = value;
}

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
        // empty, the sheet will show the error state
        async callback() {},
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

  /**
   * Trying to be defensive here, but I'm not sure we support this anyway so
   * probably not a big deal right now.
   */
  if (!requiredNamespaces.eip155) {
    logger.error(new RainbowError(`WC v2: missing required namespace eip155`));
    return;
  }

  const { chains } = requiredNamespaces.eip155;
  const chainId = parseInt(chains[0].split('eip155:')[1]);
  const peerMeta = proposer.metadata;
  const dappName = dappNameOverride(peerMeta.name) || 'Unknown Dapp';

  const routeParams: WalletconnectApprovalSheetRouteParams = {
    receivedTimestamp,
    meta: {
      chainId,
      dappName,
      dappScheme: peerMeta.url || 'Unknown URL', // TODO
      dappUrl: peerMeta.url || 'Unknown URL',
      imageUrl: maybeSignUri(
        dappLogoOverride(peerMeta?.url) || peerMeta?.icons?.[0]
      ),
      peerId: proposer.publicKey,
    },
    timedOut: false,
    callback: async (approved, approvedChainId, accountAddress) => {
      const client = await signClient;
      const { id, proposer, requiredNamespaces } = proposal.params;

      if (approved) {
        logger.debug(`WC v2: session approved`, {
          approved,
          approvedChainId,
          accountAddress,
        });

        const namespaces: Parameters<
          typeof client.approve
        >[0]['namespaces'] = {};

        for (const [key, value] of Object.entries(requiredNamespaces)) {
          namespaces[key] = {
            accounts: [],
            methods: value.methods,
            events: value.events,
          };

          // TODO do we support connecting to multiple chains at the same time?
          // The sheet def doesn't, only shows one
          for (const chain of value.chains) {
            const chainId = parseInt(chain.split(`${key}:`)[1]);
            namespaces[key].accounts.push(
              `${key}:${chainId}:${accountAddress}`
            );
          }
        }

        logger.debug(`WC v2: session approved namespaces`, { namespaces });

        try {
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

          if (hasDeeplinkPendingRedirect) {
            setHasPendingDeeplinkPendingRedirect(false);
            Minimizer.goBack();
          }

          logger.debug(`WC v2: session created`, { session });

          analytics.track('Approved new WalletConnect session', {
            dappName: proposer.metadata.name,
            dappUrl: proposer.metadata.url,
          });
        } catch (e) {
          Alert({
            buttons: [
              {
                style: 'cancel',
                text: lang.t(lang.l.walletconnect.go_back),
              },
            ],
            message: lang.t(lang.l.walletconnect.failed_to_connect_to, {
              appName: dappName,
            }),
            title: lang.t(lang.l.walletconnect.connection_failed),
          });

          logger.error(new RainbowError(`WC v2: session approval failed`), {
            error: (e as Error).message,
          });
        }
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
