import { initializeWallet } from '@/state/wallets/initializeWallet';
import { logger } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import URL from 'url-parse';
import { useDispatch } from 'react-redux';
import { settingsUpdateNetwork } from '@/redux/settings';
import { ChainId } from '@/state/backendNetworks/types';

/**
 * Handles E2E test commands. See e2e/README.md:31 for usage.
 */
export function TestDeeplinkHandler() {
  const dispatch = useDispatch();

  useEffect(() => {
    const listener = Linking.addListener('url', async ({ url }) => {
      const { protocol, host, pathname, query } = new URL(url, true);
      if (protocol !== 'rainbow:' || host !== 'e2e') {
        return;
      }

      const action = pathname.split('/')[1];

      switch (action) {
        case 'import':
          await initializeWallet({
            seedPhrase: query.privateKey,
            name: query.name,
            userPin: '1111',
          });
          Navigation.handleAction(
            Routes.SWIPE_LAYOUT,
            {
              screen: Routes.WALLET_SCREEN,
              params: { initialized: true },
            },
            true
          );
          break;
        case 'switchNetwork': {
          const networkName = query.network as string;
          let chainId: ChainId | undefined;
          // Map network names to chain IDs
          switch (networkName) {
            case 'base':
              chainId = ChainId.base;
              break;
            case 'optimism':
              chainId = ChainId.optimism;
              break;
            case 'arbitrum':
              chainId = ChainId.arbitrum;
              break;
            case 'polygon':
              chainId = ChainId.polygon;
              break;
            case 'mainnet':
              chainId = ChainId.mainnet;
              break;
            case 'anvil':
              chainId = ChainId.anvil;
              break;
            default:
              logger.debug(`[TestDeeplinkHandler]: unsupported network`, { networkName });
              return;
          }

          if (chainId) {
            dispatch(settingsUpdateNetwork(chainId));
            logger.debug(`[TestDeeplinkHandler]: switched to network`, { networkName, chainId });
          }
          break;
        }
        default:
          logger.debug(`[TestDeeplinkHandler]: unknown path`, { url });
          break;
      }
    });
    return listener.remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return null;
}
