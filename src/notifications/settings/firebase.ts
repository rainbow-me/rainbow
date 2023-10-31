import { NOTIFICATIONS_API_KEY } from 'react-native-dotenv';
import {
  NotificationTopicType,
  NotificationSubscriptionWalletsType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import messaging from '@react-native-firebase/messaging';
import { trackChangedNotificationSettings } from '@/notifications/analytics';
import { NotificationTopic } from '@/notifications/settings/constants';
import { logger } from '@/logger';
import { rainbowFetch } from '@/rainbow-fetch';

const NOTIFICATION_SUBSCRIPTIONS_URL =
  'https://notifications.p.rainbow.me/api/v1/subscriptions';

const updateNotificationSubscription = async (
  firebaseToken: string,
  wallets: NotificationSubscriptionWalletsType[]
) => {
  const options = {
    firebase_token: firebaseToken,
    wallets: wallets,
  };
  const response = await rainbowFetch(NOTIFICATION_SUBSCRIPTIONS_URL, {
    method: 'put',
    body: JSON.stringify(options),
    headers: {
      Authorization: `Bearer ${NOTIFICATIONS_API_KEY}`,
    },
  });

  return response.data;
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
