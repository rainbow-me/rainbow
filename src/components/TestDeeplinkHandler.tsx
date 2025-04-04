import { useInitializeWallet } from '@/hooks';
import { logger } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import URL from 'url-parse';

export function TestDeeplinkHandler() {
  const initializeWallet = useInitializeWallet();

  useEffect(() => {
    const listener = Linking.addListener('url', async ({ url }) => {
      const { protocol, host, pathname, query } = new URL(url, true);
      if (protocol !== 'rainbow:' || host !== 'e2e') {
        return;
      }

      const action = pathname.split('/')[1];

      switch (action) {
        case 'import':
          await initializeWallet(query.privateKey, null, query.name, false, false, null, false, null, false, '1111');
          Navigation.handleAction(
            Routes.SWIPE_LAYOUT,
            {
              screen: Routes.WALLET_SCREEN,
              params: { initialized: true },
            },
            true
          );
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
