import messaging from '@react-native-firebase/messaging';

import { logger } from '@/logger';
import { getPermissionStatus, isNotificationPermissionGranted } from '@/notifications/permissions';

/**
 * Reads the current FCM token from Firebase's native cache. The SDK refreshes
 * the cache on rotation including while the app is killed or backgrounded,
 * so callers should read fresh on every use rather than holding the value.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const fcmToken = await messaging().getToken();
    if (!fcmToken) {
      logger.warn('[notifications]: messaging().getToken() returned empty');
      return null;
    }
    return fcmToken;
  } catch (error) {
    // On iOS, messaging().getToken() throws for users without an APNs token,
    // which is the expected state when permission was never granted. Only warn
    // when permission is granted, so this surfaces genuine mint failures and
    // stays quiet on the expected path.
    const granted = await getPermissionStatus()
      .then(isNotificationPermissionGranted)
      .catch(() => false);
    if (granted) {
      logger.warn('[notifications]: getFCMToken failed', { error });
    }
    return null;
  }
}
