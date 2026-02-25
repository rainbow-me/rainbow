import { JsonRpcProvider } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import { Wallet } from '@ethersproject/wallet';
import { initializeWallet } from '@/state/wallets/initializeWallet';
import { logger, RainbowError } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import URL from 'url-parse';
import { savePIN } from '@/handlers/authentication';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { addNewTransaction } from '@/state/pendingTransactions';
import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import { type TransactionType, TransactionStatus } from '@/entities/transactions';
import { ChainId } from '@/state/backendNetworks/types';
import { getAccountAddress } from '@/state/wallets/walletsStore';
import { IS_ANDROID } from '@/env';

/**
 * Handles E2E test commands via rainbow://e2e/<action> deeplinks.
 *
 * Actions:
 *
 *   Import a wallet
 *   - import?privateKey=<key>&name=<name>
 *
 *   Toggle Anvil connection
 *   - connect-anvil
 *
 *   Send ETH to test wallet
 *   - fund-wallet?amount=<eth>
 *
 *   Inject a synthetic pending tx
 *   - inject-pending-tx?type=<type>&delegation=true&nonce=<n>
 *
 *   Dismiss all visible toasts immediately
 *   - clear-toasts
 *
 * See e2e/README.md for usage.
 */
export function TestDeeplinkHandler() {
  useEffect(() => {
    const listener = Linking.addListener('url', async ({ url }) => {
      const { protocol, host, pathname, query } = new URL(url, true);
      if (protocol !== 'rainbow:' || host !== 'e2e') {
        return;
      }

      const action = pathname.split('/')[1];

      switch (action) {
        case 'import':
          await savePIN('1111');
          await initializeWallet({
            seedPhrase: query.privateKey,
            name: query.name,
            userPin: '1111',
          });
          Navigation.replace(Routes.SWIPE_LAYOUT, {
            screen: Routes.WALLET_SCREEN,
          });
          break;

        case 'connect-anvil': {
          try {
            const store = useConnectedToAnvilStore.getState();
            store.setConnectedToAnvil(!store.connectedToAnvil);
            logger.debug('toggled anvil connection');
          } catch (e) {
            useConnectedToAnvilStore.getState().setConnectedToAnvil(false);
            logger.error(new RainbowError('error toggling anvil connection'), {
              message: e instanceof Error ? e.message : String(e),
            });
          }
          Navigation.handleAction(Routes.WALLET_SCREEN);
          break;
        }

        case 'fund-wallet': {
          const RPC_URL = IS_ANDROID ? 'http://10.0.2.2:8545' : 'http://127.0.0.1:8545';
          try {
            const provider = new JsonRpcProvider(RPC_URL);
            const wallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
            const testWalletAddress = '0x4d14289265eb7c166cF111A76B6D742e3b85dF85';
            await wallet.sendTransaction({
              to: testWalletAddress,
              value: parseEther(String(query.amount)),
            });
          } catch (e) {
            logger.error(new RainbowError('error funding test wallet'), {
              message: e instanceof Error ? e.message : String(e),
            });
          }
          break;
        }

        case 'inject-pending-tx': {
          const txType = query.type as TransactionType;
          const delegation = query.delegation === 'true';
          const nonce = parseInt(query.nonce as string, 10);
          const accountAddress = getAccountAddress();

          addNewTransaction({
            address: accountAddress,
            chainId: ChainId.mainnet,
            transaction: {
              chainId: ChainId.mainnet,
              from: accountAddress,
              to: (query.to as string) || accountAddress,
              hash: `0xdeadbeef${Date.now().toString(16)}`,
              nonce,
              status: TransactionStatus.pending,
              type: txType,
              network: 'mainnet',
              ...(delegation && { delegation: true }),
              ...(query.gasLimit && { gasLimit: query.gasLimit as string }),
              ...(query.data && { data: query.data as string }),
              ...(query.value && { value: query.value as string }),
              ...(query.swap && { swap: JSON.parse(query.swap as string) }),
            },
          });
          break;
        }

        case 'clear-toasts': {
          useRainbowToastsStore.getState().removeAllToasts();
          break;
        }

        default:
          logger.debug(`[TestDeeplinkHandler]: unknown path`, { url });
          break;
      }
    });
    return listener.remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
