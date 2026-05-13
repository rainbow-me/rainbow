import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';

import URL from 'url-parse';

import { E2EStatusMarker } from '@/components/E2EStatusMarker';
import { savePIN } from '@/handlers/authentication';
import { logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { initializeWallet } from '@/state/wallets/initializeWallet';

type E2ECommandStatus = 'idle' | 'wallet-importing' | 'wallet-ready' | 'wallet-error';

/**
 * Handles E2E test commands. See e2e/README.md:31 for usage.
 */
export function TestDeeplinkHandler() {
  const [commandStatus, setCommandStatus] = useState<E2ECommandStatus>('idle');

  const handleUrl = useCallback(async (url: string | null) => {
    if (!url) return;

    try {
      const { protocol, host, pathname, query } = new URL(url, true);
      if (protocol !== 'rainbow:' || host !== 'e2e') {
        return;
      }

      const action = pathname.split('/')[1];

      switch (action) {
        case 'import': {
          const privateKey = getQueryValue(query.privateKey);
          const name = getQueryValue(query.name);
          if (!privateKey || !name) {
            throw new RainbowError('[TestDeeplinkHandler]: missing import params');
          }

          setCommandStatus('wallet-importing');
          await savePIN('1111');
          await initializeWallet({
            seedPhrase: privateKey,
            name,
            userPin: '1111',
          });
          Navigation.replace(Routes.SWIPE_LAYOUT, {
            screen: Routes.WALLET_SCREEN,
          });
          setCommandStatus('wallet-ready');
          break;
        }
        default:
          logger.debug(`[TestDeeplinkHandler]: unknown path`, { url });
          break;
      }
    } catch (e) {
      setCommandStatus('wallet-error');
      logger.error(new RainbowError('[TestDeeplinkHandler]: command failed', e), {
        url,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  useEffect(() => {
    Linking.getInitialURL()
      .then(handleUrl)
      .catch(e => {
        logger.error(new RainbowError('[TestDeeplinkHandler]: failed to read initial URL', e), {
          message: e instanceof Error ? e.message : String(e),
        });
      });

    const listener = Linking.addListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return listener.remove;
  }, [handleUrl]);

  return <E2EStatusMarker id={commandStatus === 'idle' ? null : `e2e-${commandStatus}`} />;
}

function getQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
