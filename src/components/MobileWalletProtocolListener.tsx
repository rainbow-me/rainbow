import { useEffect, useRef } from 'react';
import {
  addDiagnosticLogListener,
  getAndroidIntentUrl,
  isHandshakeAction,
  useMobileWalletProtocolHost,
} from '@coinbase/mobile-wallet-protocol-host';
import { handleMobileWalletProtocolRequest } from '@/utils/requestNavigationHandlers';
import { logger, RainbowError } from '@/logger';
import { IS_ANDROID, IS_DEV } from '@/env';

export enum MobileWalletProtocolUserErrors {
  USER_REJECTED_HANDSHAKE = 'User rejected the handshake',
  USER_REJECTED_REQUEST = 'User rejected request',
  ABORTED = 'Aborted',
  READ_ONLY_WALLET = 'This wallet is read-only',
}

const ERROR_MESSAGES_TO_IGNORE = Object.values(MobileWalletProtocolUserErrors);

export const MobileWalletProtocolListener = () => {
  const { message, handleRequestUrl, sendFailureToClient, session, ...mwpProps } = useMobileWalletProtocolHost();
  const lastMessageUuidRef = useRef<string | null>(null);
  const pendingMessageRef = useRef<typeof message | null>(null);

  useEffect(() => {
    const handleMessage = async () => {
      if (message && lastMessageUuidRef.current !== message.uuid) {
        lastMessageUuidRef.current = message.uuid;

        // Check if it's a handshake request
        const isHandshake = message.actions.some(isHandshakeAction);

        if (isHandshake || session) {
          try {
            await handleMobileWalletProtocolRequest({ request: message, session, ...mwpProps });
          } catch (error) {
            if (error instanceof Error && ERROR_MESSAGES_TO_IGNORE.includes(error.message as MobileWalletProtocolUserErrors)) {
              logger.debug(`[MobileWalletProtocolListener]: Error handling Mobile Wallet Protocol request`, {
                error,
                message,
              });
            } else {
              logger.error(new RainbowError(`[MobileWalletProtocolListener]: Error handling Mobile Wallet Protocol request`), {
                error,
                message,
              });
            }
          }
        } else {
          // Store the message to process once we have a valid session
          pendingMessageRef.current = message;
        }
      }
    };

    handleMessage();
  }, [message, session, mwpProps]);

  useEffect(() => {
    if (session && pendingMessageRef.current) {
      const pendingMessage = pendingMessageRef.current;
      pendingMessageRef.current = null;
      handleMobileWalletProtocolRequest({ request: pendingMessage, session, ...mwpProps });
    }
  }, [session, mwpProps]);

  useEffect(() => {
    if (IS_DEV) {
      const removeListener = addDiagnosticLogListener(event => {
        logger.debug(`[MobileWalletProtocolListener]: Diagnostic log event: ${JSON.stringify(event, null, 2)}`);
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
