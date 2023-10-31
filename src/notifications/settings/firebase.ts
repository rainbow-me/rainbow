import { NOTIFICATIONS_API_KEY } from 'react-native-dotenv';
import { logger, RainbowError } from '@/logger';
import { supportedNotificationsChainIds } from '@/chains';
import {
  GlobalNotificationTopicType,
  WalletNotificationTopicType,
  NotificationSubscriptionWalletsType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import messaging from '@react-native-firebase/messaging';
import { trackChangedNotificationSettings } from '@/notifications/analytics';
import { GlobalNotificationTopic, WalletNotificationTopic } from '@/notifications/settings/constants';
import { getFCMToken, saveFCMToken } from '@/notifications/tokens';
import { rainbowFetch } from '@/rainbow-fetch';

const NOTIFICATION_SUBSCRIPTIONS_URL = 'https://notifications.p.rainbow.me/api/v1/subscriptions';

const INVALID_FCM_TOKEN_ERROR = 'failed to validate FCM token: invalid or expired FCM token';

type NotificationsSubscriptionResponse = {
  error: boolean;
  shouldRetry: boolean;
};

const updateNotificationSubscription = async (
  firebaseToken: string,
  wallets: NotificationSubscriptionWalletsType[]
): Promise<NotificationsSubscriptionResponse> => {
  try {
    const options = {
      firebase_token: firebaseToken,
      wallets: wallets,
    };
    await rainbowFetch(NOTIFICATION_SUBSCRIPTIONS_URL, {
      method: 'put',
      body: JSON.stringify(options),
      headers: {
        Authorization: `Bearer ${NOTIFICATIONS_API_KEY}`,
      },
    });

    // success
    return {
      error: false,
      shouldRetry: false,
    };
  } catch (error: any) {
    // if INVALID_FCM_TOKEN_ERROR message, retry with updated FCM token
    if (error.message === INVALID_FCM_TOKEN_ERROR) {
      return {
        error: true,
        shouldRetry: true,
      };
    }

    logger.error(new RainbowError('Failed to subscribe to notifications'), {
      message: (error as Error).message,
    });

    return {
      error: true,
      shouldRetry: false,
    };
  }
};

const updateNotificationSubscriptionWithRetry = async (
  firebaseToken: string,
  wallets: NotificationSubscriptionWalletsType[]
): Promise<boolean> => {
  const subscriptionResponse = await updateNotificationSubscription(firebaseToken, wallets);

  if (!subscriptionResponse.error) {
    // success
    return true;
  } else if (subscriptionResponse.shouldRetry) {
    // retry with an updated FCM token
    await saveFCMToken();
    const refreshedFirebaseToken = await getFCMToken();
    if (!refreshedFirebaseToken) return false;

    const subscriptionRetryResponse = await updateNotificationSubscription(refreshedFirebaseToken, wallets);
    return !subscriptionRetryResponse.error;
  } else {
    return false;
  }
};

// returns updated wallet settings on success, undefined otherwise
export const publishWalletSettings = async (
  walletSettings: WalletNotificationSettings[]
): Promise<WalletNotificationSettings[] | undefined> => {
  try {
    const subscriptionPayload = parseWalletSettings(walletSettings);
    let firebaseToken = await getFCMToken();

    // refresh the FCM token if not found
    if (!firebaseToken) {
      await saveFCMToken();
      firebaseToken = await getFCMToken();
      if (!firebaseToken) return;
    }

    const success = await updateNotificationSubscriptionWithRetry(firebaseToken, subscriptionPayload);
    if (success) {
      return walletSettings.map(setting => {
        return {
          ...setting,
          successfullyFinishedInitialSubscription: true,
        };
      });
    } else {
      return;
    }
  } catch (e: any) {
    logger.error(new RainbowError('Failed to publish wallet notification settings'), {
      message: (e as Error).message,
    });

    return;
  }
};

const parseWalletSettings = (walletSettings: WalletNotificationSettings[]): NotificationSubscriptionWalletsType[] => {
  const enabledWalletSettings = walletSettings.filter(setting => setting.enabled);
  return enabledWalletSettings.flatMap(setting => {
    const topics = Object.keys(setting.topics).filter(topic => !!setting.topics[topic]);
    return supportedNotificationsChainIds.map(chainId => {
      return {
        type: setting.type,
        chain_id: chainId,
        address: setting.address.toLowerCase(),
        transaction_action_types: topics,
      };
    });
  });
};

export const unsubscribeWalletFromAllNotificationTopics = (type: string, chainId: number, address: string): Promise<void[]> => {
  return Promise.all(
    Object.values(WalletNotificationTopic).map(topic => unsubscribeWalletFromNotificationTopic(type, chainId, address, topic))
  );
};

export const unsubscribeFromAllGlobalNotificationTopics = (): Promise<void[]> => {
  return Promise.all(Object.values(GlobalNotificationTopic).map(topic => unsubscribeFromGlobalNotificationTopic(topic)));
};

export const subscribeWalletToNotificationTopic = async (
  type: string,
  chainId: number,
  address: string,
  topic: WalletNotificationTopicType
): Promise<void> => {
  logger.debug(`[notifications]: subscribing ${type}:${address} to [ ${topic.toUpperCase()} ]`, {}, logger.DebugContext.notifications);
  return messaging()
    .subscribeToTopic(`${type}_${chainId}_${address.toLowerCase()}_${topic}`)
    .then(() => trackChangedNotificationSettings(topic, 'subscribe', chainId, type));
};

export const unsubscribeWalletFromNotificationTopic = async (
  type: string,
  chainId: number,
  address: string,
  topic: WalletNotificationTopicType
) => {
  logger.debug(`[notifications]: unsubscribing ${type}:${address} from [ ${topic.toUpperCase()} ]`, {}, logger.DebugContext.notifications);
  return messaging()
    .unsubscribeFromTopic(`${type}_${chainId}_${address.toLowerCase()}_${topic}`)
    .then(() => {
      trackChangedNotificationSettings(topic, 'unsubscribe', chainId, type);
    });
};

export const subscribeToGlobalNotificationTopic = async (topic: GlobalNotificationTopicType): Promise<void> => {
  logger.debug(`[notifications]: subscribing to [ ${topic.toUpperCase()} ]`, {}, logger.DebugContext.notifications);
  return messaging()
    .subscribeToTopic(topic)
    .then(() => trackChangedNotificationSettings(topic, 'subscribe'));
};

export const unsubscribeFromGlobalNotificationTopic = async (topic: GlobalNotificationTopicType) => {
  logger.debug(`[notifications]: unsubscribing from [ ${topic.toUpperCase()} ]`, {}, logger.DebugContext.notifications);
  return messaging()
    .unsubscribeFromTopic(topic)
    .then(() => {
      trackChangedNotificationSettings(topic, 'unsubscribe');
    });
};
