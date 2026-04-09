import type { WalletKitTypes } from '@reown/walletkit';
import { getSdkError } from '@walletconnect/utils';
import { uniq } from 'lodash';

import { analytics } from '@/analytics';
import Alert from '@/components/alerts/Alert';
import { hideWalletConnectToast } from '@/components/toasts/WalletConnectToast';
import { IS_IOS } from '@/env';
import { events } from '@/handlers/appEvents';
import { maybeSignUri } from '@/handlers/imgix';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import Navigation, { getActiveRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { fetchDappMetadata } from '@/resources/metadata/dapp';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

import { showErrorSheet } from '../components/showErrorSheet';
import { getWalletKitClient } from '../services/client';
import { lastConnector, maybeGoBackAndClearHasPendingRedirect, setHasPendingDeeplinkPendingRedirect } from '../services/pair';
import { type WalletconnectApprovalSheetRouteParams } from '../types';
import {
  getApprovedNamespaces,
  SUPPORTED_SESSION_EVENTS,
  SUPPORTED_SIGNING_METHODS,
  SUPPORTED_TRANSACTION_METHODS,
} from '../utils/rpcParams';

const T = i18n.l.walletconnect;

// listen for THIS topic pairing, and clear timeout if received
export function trackTopicHandler(proposal: WalletKitTypes.SessionProposal | WalletKitTypes.SessionAuthenticate) {
  logger.debug(`[walletConnect]: pair: handler`, { proposal });

  const { metadata } = 'proposer' in proposal.params ? proposal.params.proposer : proposal.params.requester;

  analytics.track(analytics.event.wcNewPairing, {
    dappName: metadata.name,
    dappUrl: metadata.url,
    connector: lastConnector || 'unknown',
  });
}

async function rejectProposal({
  proposal,
  reason,
}: {
  proposal: WalletKitTypes.SessionProposal;
  reason: Parameters<typeof getSdkError>[0];
}) {
  logger.warn(`[walletConnect]: session approval denied`, {
    reason,
    proposal,
  });

  const client = await getWalletKitClient();
  const { id, proposer } = proposal.params;

  await client.rejectSession({ id, reason: getSdkError(reason) });

  analytics.track(analytics.event.wcNewSessionRejected, {
    dappName: proposer.metadata.name,
    dappUrl: proposer.metadata.url,
  });
}

export async function onSessionProposal(proposal: WalletKitTypes.SessionProposal) {
  try {
    trackTopicHandler(proposal);

    logger.debug(`[walletConnect]: session_proposal`, { proposal }, logger.DebugContext.walletconnect);

    const verifiedData = proposal.verifyContext.verified;
    const receivedTimestamp = Date.now();
    const { proposer, requiredNamespaces, optionalNamespaces } = proposal.params;

    const requiredChains = requiredNamespaces?.eip155?.chains || [];
    const optionalChains = optionalNamespaces?.eip155?.chains || [];

    const chains = uniq([...requiredChains, ...optionalChains]);

    // we already checked for eip155 namespace above
    const chainIds = chains?.map(chain => parseInt(chain.split('eip155:')[1]));
    const supportedChainIds = useBackendNetworksStore.getState().getSupportedChainIds();
    const chainIdsToUse = chainIds.filter(chainId => supportedChainIds.includes(chainId));

    const peerMeta = proposer.metadata;
    const metadata = await fetchDappMetadata({ url: peerMeta.url, status: true });

    const dappName = metadata?.appName || peerMeta.name || i18n.t(i18n.l.walletconnect.unknown_dapp);
    const dappImage = metadata?.appLogo || peerMeta?.icons?.[0];

    const routeParams: WalletconnectApprovalSheetRouteParams = {
      receivedTimestamp,
      meta: {
        chainIds: chainIdsToUse,
        dappName,
        dappScheme: 'unused in WC v2', // only used for deeplinks from WC v1
        dappUrl: peerMeta.url || i18n.t(i18n.l.walletconnect.unknown_url),
        imageUrl: maybeSignUri(dappImage, { w: 200 }),
        peerId: proposer.publicKey,
        isWalletConnectV2: true,
      },
      verifiedData,
      timedOut: false,
      callback: async (approved, approvedChainId, accountAddress) => {
        const client = await getWalletKitClient();

        const { id, proposer, requiredNamespaces } = proposal.params;

        if (approved) {
          logger.debug(
            `[walletConnect]: session approved`,
            {
              approved,
              approvedChainId,
              accountAddress,
            },
            logger.DebugContext.walletconnect
          );

          // we only support EVM chains rn
          const supportedEvents = requiredNamespaces?.eip155?.events || SUPPORTED_SESSION_EVENTS;

          /** @see https://chainagnostic.org/CAIPs/caip-2 */
          const caip2ChainIds = supportedChainIds.map(id => `eip155:${id}`);
          const namespaces = getApprovedNamespaces({
            proposal: proposal.params,
            supportedNamespaces: {
              eip155: {
                chains: caip2ChainIds,
                methods: [...SUPPORTED_SIGNING_METHODS, ...SUPPORTED_TRANSACTION_METHODS],
                events: supportedEvents,
                accounts: caip2ChainIds.map(id => `${id}:${accountAddress}`),
              },
            },
          });

          logger.debug(`[walletConnect]: session approved namespaces`, { namespaces }, logger.DebugContext.walletconnect);

          try {
            if (namespaces.success) {
              /**
               * WC v2 stores existing _pairings_ itself, so we don't need to persist
               * ourselves
               */
              await client.approveSession({
                id,
                namespaces: namespaces.result,
              });

              // let the ConnectedDappsSheet know we've got a new one
              events.emit('walletConnectV2SessionCreated');

              logger.debug(`[walletConnect]: session created`, {}, logger.DebugContext.walletconnect);

              analytics.track(analytics.event.wcNewSessionApproved, {
                dappName: proposer.metadata.name,
                dappUrl: proposer.metadata.url,
              });

              maybeGoBackAndClearHasPendingRedirect();
              if (IS_IOS) {
                Navigation.handleAction(Routes.WALLET_CONNECT_REDIRECT_SHEET, {
                  type: 'connect',
                });
              }
            } else {
              await rejectProposal({
                proposal,
                reason: 'INVALID_SESSION_SETTLE_REQUEST',
              });

              analytics.track(analytics.event.wcRequestFailed, { type: `invalid namespaces`, reason: namespaces.error.message });

              showErrorSheet({
                title: i18n.t(T.errors.generic_title),
                body: `${i18n.t(T.errors.namespaces_invalid)} \n \n ${namespaces.error.message}`,
                sheetHeight: 400,
                onClose: maybeGoBackAndClearHasPendingRedirect,
              });
            }
          } catch (e) {
            setHasPendingDeeplinkPendingRedirect(false);

            Alert({
              buttons: [
                {
                  style: 'cancel',
                  text: i18n.t(i18n.l.walletconnect.go_back),
                },
              ],
              message: i18n.t(i18n.l.walletconnect.failed_to_connect_to, {
                appName: dappName,
              }),
              title: i18n.t(i18n.l.walletconnect.connection_failed),
            });

            logger.error(new RainbowError(`[walletConnect]: session approval failed`), {
              error: (e as Error).message,
            });
          }
        } else if (!approved) {
          await rejectProposal({ proposal, reason: 'USER_REJECTED' });
        }
      },
    };

    hideWalletConnectToast();

    /**
     * We might see this at any point in the app, so only use `replace`
     * sometimes if the user is already looking at the approval sheet.
     */
    const shouldReplace = getActiveRoute()?.name === Routes.WALLET_CONNECT_APPROVAL_SHEET;
    const navigate = shouldReplace ? Navigation.replace : Navigation.handleAction;

    navigate(Routes.WALLET_CONNECT_APPROVAL_SHEET, routeParams);
  } catch (error) {
    logger.error(
      new RainbowError(`[walletConnect]: session request catch all`, {
        ...(error as Error),
      })
    );
  }
}
