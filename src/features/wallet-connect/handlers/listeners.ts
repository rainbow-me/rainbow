import messaging from '@react-native-firebase/messaging';
import { gretch } from 'gretchen';

import { events } from '@/handlers/appEvents';
import { logger, RainbowError } from '@/logger';
import { getFCMToken } from '@/notifications/tokens';
import { PerformanceReports, PerformanceReportSegments, PerformanceTracking } from '@/performance/tracking';

import { getWalletKitClient } from '../services/client';
import { setSyncWalletKitClient } from '../services/syncClient';
import { onSessionProposal } from './onSessionProposal';
import { onSessionRequest } from './onSessionRequest';

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
  const res = await gretch(`https://wcpush.p.rainbow.me/clients`, {
    method: 'POST',
    json: {
      type: 'FCM',
      client_id,
      token,
    },
  }).json();

  if (res.error) {
    /*
     * Most of these appear to be network errors and timeouts. So our backend
     * should report these to Datadog, and we can leave this as a warn to
     * continue to monitor.
     */
    logger.warn(`[walletConnect]: echo server subscription failed`, {
      error: res.error,
    });
  }
}
