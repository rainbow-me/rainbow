import { useEffect, useRef } from 'react';
import { addDiagnosticLogListener, getAndroidIntentUrl, useMobileWalletProtocolHost } from '@coinbase/mobile-wallet-protocol-host';
import { handleMobileWalletProtocolRequest } from '@/utils/requestNavigationHandlers';
import { logger, RainbowError } from '@/logger';
import { IS_ANDROID, IS_DEV } from '@/env';

export const MobileWalletProtocolListener = () => {
  const { message, handleRequestUrl, sendFailureToClient, ...mwpProps } = useMobileWalletProtocolHost();
  const lastMessageUuidRef = useRef<string | null>(null);

  useEffect(() => {
    if (message && lastMessageUuidRef.current !== message.uuid) {
      lastMessageUuidRef.current = message.uuid;
      try {
        handleMobileWalletProtocolRequest({ request: message, ...mwpProps });
      } catch (error) {
        logger.error(new RainbowError('Error handling Mobile Wallet Protocol request'), {
          error,
        });
      }
    }
  }, [message, mwpProps]);

  useEffect(() => {
    if (IS_DEV) {
      const removeListener = addDiagnosticLogListener(event => {
        console.log('Event:', JSON.stringify(event, null, 2));
      });

      return () => removeListener();
    }
  }, []);

  useEffect(() => {
    if (IS_ANDROID) {
      (async function handleAndroidIntent() {
        const intentUrl = await getAndroidIntentUrl();
        if (intentUrl) {
          const response = await handleRequestUrl(intentUrl);
          if (response.error) {
            // Return error to client app if session is expired or invalid
            const { errorMessage, decodedRequest } = response.error;
            await sendFailureToClient(errorMessage, decodedRequest);
          }
        }
      })();
    }
  }, [handleRequestUrl, sendFailureToClient]);

  return null;
};
