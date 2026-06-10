import messaging from '@react-native-firebase/messaging';
import { gretch } from 'gretchen';

import { events } from '@/handlers/appEvents';
import { logger, RainbowError } from '@/logger';
import { getFCMToken } from '@/notifications/tokens';
import { PerformanceReports, PerformanceReportSegments, PerformanceTracking } from '@/performance/tracking';
import { delay } from '@/utils/delay';

import { getWalletKitClient } from '../services/client';
import { setSyncWalletKitClient } from '../services/syncClient';
import { onSessionProposal } from './onSessionProposal';
import { onSessionRequest } from './onSessionRequest';

const ECHO_SERVER_SUBSCRIPTION_MAX_ATTEMPTS = 3;
const ECHO_SERVER_SUBSCRIPTION_RETRY_DELAY_MS = 1_000;

export async function initListeners() {
  PerformanceTracking.startReportSegment(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.initWalletConnect);
  const client = await getWalletKitClient();
  PerformanceTracking.finishReportSegment(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.initWalletConnect);

  setSyncWalletKitClient(client);

  logger.debug(`[walletConnect]: walletKitClient initialized, initListeners`, {}, logger.DebugContext.walletconnect);

  client.on('session_proposal', onSessionProposal);
  client.on('session_request', onSessionRequest);
  // Temporarily disabling this since there's a bug on the WC side
  // client.on('session_authenticate', onSessionAuthenticate);
  client.on('session_delete', () => {
    logger.debug(`[walletConnect]: session_delete`, {}, logger.DebugContext.walletconnect);

    setTimeout(() => {
      events.emit('walletConnectV2SessionDeleted');
    }, 500);
  });
}

export async function initWalletConnectPushNotifications() {
  try {
    const token = await getFCMToken();
    if (!token) {
      // No token here means push isn't available for this user; nothing to subscribe.
      return;
    }

    const client = await getWalletKitClient();
    const client_id = await client.core.crypto.getClientId();

    await subscribeToEchoServer({ token, client_id });

    messaging().onTokenRefresh(async (token: string) => {
      await subscribeToEchoServer({ token, client_id });
    });
  } catch (e) {
    logger.error(new RainbowError(`[walletConnect]: initListeners failed`), { error: e });
  }
}

async function subscribeToEchoServer({ client_id, token }: { client_id: string; token: string }) {
  let error: unknown;

  for (let attempt = 0; attempt < ECHO_SERVER_SUBSCRIPTION_MAX_ATTEMPTS; attempt++) {
    if (attempt) {
      await delay(ECHO_SERVER_SUBSCRIPTION_RETRY_DELAY_MS * attempt);
    }

    const res = await gretch(`https://wcpush.p.rainbow.me/clients`, {
      method: 'POST',
      json: {
        type: 'FCM',
        client_id,
        token,
      },
    }).json();

    if (!res.error) return;

    if (!isRetryableEchoServerSubscriptionError(res.error)) {
      error = res.error;
      break;
    }
  }

  if (error) {
    /*
     * Network errors and timeouts are expected to be transient and are retried
     * above. Keep this warning for unexpected response/parsing failures.
     */
    logger.warn(`[walletConnect]: echo server subscription failed`, {
      error,
    });
  }
}

function isRetryableEchoServerSubscriptionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name.includes('HTTPTimeout') || error.message.includes('Request timed out') || error.message.includes('Network request failed'))
  );
}
