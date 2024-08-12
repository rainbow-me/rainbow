import { useCallback, useEffect, useRef } from 'react';
import { useMobileWalletProtocolHost } from '@coinbase/mobile-wallet-protocol-host';
import { logger, RainbowError } from '@/logger';
import { branchListener } from '@/utils/branch';
import branch from 'react-native-branch';
import { Linking } from 'react-native';
import handleDeeplink from '@/handlers/deeplinks';
import { useInitialRoute } from '@/navigation/initialRoute';

export const DeeplinkListener = () => {
  const branchListenerRef = useRef<ReturnType<typeof branch.subscribe> | null>(null);
  const initialRoute = useInitialRoute();

  const { handleRequestUrl, sendFailureToClient } = useMobileWalletProtocolHost();

  const setupDeeplinking = useCallback(async () => {
    const initialUrl = await Linking.getInitialURL();

    branchListenerRef.current = await branchListener(async url => {
      logger.debug(`Branch: listener called`, {}, logger.DebugContext.deeplinks);

      try {
        handleDeeplink({
          url,
          initialRoute,
          handleRequestUrl,
          sendFailureToClient,
        });
      } catch (error) {
        if (error instanceof Error) {
          logger.error(new RainbowError('Error opening deeplink'), {
            message: error.message,
            url,
          });
        } else {
          logger.error(new RainbowError('Error opening deeplink'), {
            message: 'Unknown error',
            url,
          });
        }
      }
    });

    if (initialUrl) {
      logger.debug(`App: has initial URL, opening with Branch`, { initialUrl });
      branch.openURL(initialUrl);
    }
  }, [initialRoute]);

  useEffect(() => {
    setupDeeplinking();
  }, []);

  return null;
};
