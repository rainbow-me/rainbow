import { initializeWallet } from '@/state/wallets/initializeWallet';
import { logger } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import URL from 'url-parse';

/**
 * Handles E2E test commands. See e2e/README.md:31 for usage.
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
          await initializeWallet({
            seedPhrase: query.privateKey,
            name: query.name,
            userPin: '1111',
          });
          Navigation.replace(Routes.SWIPE_LAYOUT, {
            screen: Routes.WALLET_SCREEN,
            params: { initialized: true },
          });
          break;
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
