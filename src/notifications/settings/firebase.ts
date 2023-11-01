import { NOTIFICATIONS_API_KEY } from 'react-native-dotenv';
import { RainbowNetworks } from '@/networks';
import {
  NotificationTopicType,
  NotificationSubscriptionWalletsType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import { getFCMToken } from '@/notifications/tokens';
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

export const updateWalletSettings = async (
  walletSettings: WalletNotificationSettings[]
): Promise<WalletNotificationSettings[] | undefined> => {
  const subscriptionPayload = parseWalletSettings(walletSettings);
  const firebaseToken = await getFCMToken();
  if (!firebaseToken) return;
  const newSettings = await updateNotificationSubscription(
    firebaseToken,
    subscriptionPayload
  );
  return newSettings;
};

const parseWalletSettings = (
  walletSettings: WalletNotificationSettings[]
): NotificationSubscriptionWalletsType[] => {
  const walletSettingsPerChainId = walletSettings.map(setting => {
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
        address: setting.address,
        transaction_action_types: topics,
      };
    });
  });
  return walletSettingsPerChainId.flat();
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
