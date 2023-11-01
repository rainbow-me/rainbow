import { NOTIFICATIONS_API_KEY } from 'react-native-dotenv';
import { RainbowNetworks } from '@/networks';
import {
  NotificationTopicType,
  NotificationSubscriptionWalletsType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import { getFCMToken, saveFCMToken } from '@/notifications/tokens';
import messaging from '@react-native-firebase/messaging';
import { trackChangedNotificationSettings } from '@/notifications/analytics';
import { NotificationTopic } from '@/notifications/settings/constants';
import { logger } from '@/logger';
import { rainbowFetch } from '@/rainbow-fetch';

const NOTIFICATION_SUBSCRIPTIONS_URL =
  'https://notifications.p.rainbow.me/api/v1/subscriptions';

const INVALID_FCM_TOKEN_ERROR =
  'failed to validate FCM token: invalid or expired FCM token';

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

    // TODO JIN - sentry log this error
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
  const subscriptionResponse = await updateNotificationSubscription(
    firebaseToken,
    wallets
  );

  if (!subscriptionResponse.error) {
    // success
    return true;
  } else if (subscriptionResponse.shouldRetry) {
    await saveFCMToken();
    const refreshedFirebaseToken = await getFCMToken();
    if (!refreshedFirebaseToken) return false;

    const subscriptionRetryResponse = await updateNotificationSubscription(
      refreshedFirebaseToken,
      wallets
    );
    if (!subscriptionRetryResponse.error) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

export const updateWalletSettings = async (
  walletSettings: WalletNotificationSettings[]
): Promise<WalletNotificationSettings[] | undefined> => {
  const subscriptionPayload = parseWalletSettings(walletSettings);
  const firebaseToken = await getFCMToken();

  if (!firebaseToken) return;
  const success = await updateNotificationSubscriptionWithRetry(
    firebaseToken,
    subscriptionPayload
  );
  if (success) {
    return walletSettings.map(setting => {
      return {
        ...setting,
        successfullyFinishedInitialSubscription: true,
        enabled: true,
      };
    });
  } else {
    return;
  }
};

const parseWalletSettings = (
  walletSettings: WalletNotificationSettings[]
): NotificationSubscriptionWalletsType[] => {
  return walletSettings.flatMap(setting => {
    const topics = Object.keys(setting.topics).filter(
      topic => !!setting.topics[topic]
    );
    const notificationChainIds = RainbowNetworks.filter(
      network => network.enabled && network.features.notifications
    ).map(network => network.id);

    return notificationChainIds.map(chainId => {
      return {
        type: setting.type,
        chain_id: chainId,
        address: setting.address.toLowerCase(),
        transaction_action_types: topics,
      };
    });
  });
};

export const unsubscribeWalletFromAllNotificationTopics = (
  type: string,
  chainId: number,
  address: string
): Promise<void[]> => {
  return Promise.all(
    Object.values(NotificationTopic).map(topic =>
      unsubscribeWalletFromSingleNotificationTopic(
        type,
        chainId,
        address,
        topic
      )
    )
  );
};

export const subscribeWalletToSingleNotificationTopic = (
  type: string,
  chainId: number,
  address: string,
  topic: NotificationTopicType
): Promise<void> => {
  logger.debug(
    `Notifications: subscribing ${type}:${address} to [ ${topic.toUpperCase()} ]`,
    {},
    logger.DebugContext.notifications
  );
  return messaging()
    .subscribeToTopic(`${type}_${chainId}_${address.toLowerCase()}_${topic}`)
    .then(() =>
      trackChangedNotificationSettings(chainId, topic, type, 'subscribe')
    );
};

export const unsubscribeWalletFromSingleNotificationTopic = async (
  type: string,
  chainId: number,
  address: string,
  topic: NotificationTopicType
) => {
  logger.debug(
    `Notifications: unsubscribing ${type}:${address} from [ ${topic.toUpperCase()} ]`,
    {},
    logger.DebugContext.notifications
  );
  return messaging()
    .unsubscribeFromTopic(
      `${type}_${chainId}_${address.toLowerCase()}_${topic}`
    )
    .then(() => {
      trackChangedNotificationSettings(chainId, topic, type, 'unsubscribe');
    });
};
