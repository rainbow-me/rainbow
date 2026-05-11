import { Platform } from 'react-native';

import type { WalletKitTypes } from '@reown/walletkit';

import { DAppStatus } from '@/graphql/__generated__/metadata';
import { getProvider } from '@/handlers/web3';
import WalletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { fetchDappMetadata } from '@/resources/metadata/dapp';
import * as portal from '@/screens/Portal';
import { ChainId } from '@/state/backendNetworks/types';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';

import { AuthRequest } from '../screens/AuthRequest';
import { getWalletKitClient } from '../services/client';
import { maybeGoBackAndClearHasPendingRedirect } from '../services/pair';
import { AuthRequestResponseErrorReason, type AuthRequestAuthenticateSignature } from '../types';
import { trackTopicHandler } from './onSessionProposal';

export async function onSessionAuthenticate(event: WalletKitTypes.SessionAuthenticate) {
  trackTopicHandler(event);

  const client = await getWalletKitClient();

  logger.debug(`[walletConnect]: auth_request`, { event }, logger.DebugContext.walletconnect);

  const authenticate: AuthRequestAuthenticateSignature = async ({ address }) => {
    try {
      const selectedWallet = getWalletWithAccount(address);
      const isHardwareWallet = selectedWallet?.type === WalletTypes.bluetooth;
      const iss = `did:pkh:eip155:1:${address}`;

      // exit early if possible
      if (selectedWallet?.type === WalletTypes.readOnly) {
        await client.respondSessionRequest({
          topic: event.topic,
          response: {
            id: event.id,
            error: {
              code: 0,
              message: `Wallet is read-only`,
            },
            jsonrpc: '2.0',
          },
        });

        return {
          success: false,
          reason: AuthRequestResponseErrorReason.ReadOnly,
        };
      }

      /**
       * Locally scoped to this `authenticate` function. Simply here to
       * encapsulate reused code.
       */
      const loadWalletAndSignMessage = async () => {
        const provider = getProvider({ chainId: ChainId.mainnet });
        const wallet = await loadWallet({ address, provider });

        if (!wallet) {
          logger.error(new RainbowError(`[walletConnect]: could not loadWallet to sign auth_request`));

          return undefined;
        }
        const message = client.formatAuthMessage({
          iss,
          request: event.params.authPayload,
        });
        // prompt the user to sign the message
        return wallet.signMessage(message);
      };

      // Get signature either directly, or via hardware wallet flow
      const signature = await (isHardwareWallet
        ? new Promise<Awaited<ReturnType<typeof loadWalletAndSignMessage>>>((y, n) => {
            Navigation.handleAction(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
              async submit() {
                try {
                  y(loadWalletAndSignMessage());
                } catch (e) {
                  n(e);
                }
              },
            });
          })
        : loadWalletAndSignMessage());

      if (!signature) {
        return {
          success: false,
          reason: AuthRequestResponseErrorReason.Unknown,
        };
      }

      // respond to WC
      await client.respondSessionRequest({
        topic: event.topic,
        response: {
          id: event.id,
          result: JSON.stringify({
            signature: {
              s: signature,
              t: 'eip191',
            },
          }),
          jsonrpc: '2.0',
        },
      });

      // only handled on success
      maybeGoBackAndClearHasPendingRedirect({ delay: 300 });

      return { success: true };
    } catch (e: any) {
      logger.error(new RainbowError(`[walletConnect]: an unknown error occurred when signing auth_request`), {
        message: e.message,
      });
      return { success: false, reason: AuthRequestResponseErrorReason.Unknown };
    }
  };

  // need to prefetch dapp metadata since portal is static
  const url = event?.verifyContext?.verified?.origin || event.params.requester.metadata.url;
  const metadata = await fetchDappMetadata({ url, status: true });

  const isScam = metadata.status === DAppStatus.Scam;
  portal.open(
    () =>
      AuthRequest({
        authenticate,
        requesterMeta: event.params.requester.metadata,
        verifiedData: event?.verifyContext.verified,
      }),
    { sheetHeight: Platform.OS === 'android' ? 560 : 520 + (isScam ? 40 : 0) }
  );
}
