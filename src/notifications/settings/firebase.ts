import { NOTIFICATIONS_API_KEY } from 'react-native-dotenv';
import { logger, RainbowError } from '@/logger';
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
  const subscriptionResponse = await updateNotificationSubscription(
    firebaseToken,
    wallets
  );

  if (!subscriptionResponse.error) {
    // success
    return true;
  } else if (subscriptionResponse.shouldRetry) {
    // retry with an updated FCM token
    await saveFCMToken();
    const refreshedFirebaseToken = await getFCMToken();
    if (!refreshedFirebaseToken) return false;

    const subscriptionRetryResponse = await updateNotificationSubscription(
      refreshedFirebaseToken,
      wallets
    );
    return !subscriptionRetryResponse.error;
  } else {
    return false;
  }
};

/**
 Firebase functions for subscribing/unsubscribing to topics.
 */
export const subscribeWalletToAllEnabledTopics = (
  settings: WalletNotificationSettings,
  chainId: number
): Promise<void[]> => {
  return Promise.all(
    Object.entries(settings.topics).map(([topic, isEnabled]) => {
      if (isEnabled) {
        return subscribeWalletToSingleNotificationTopic(
          settings.type,
          chainId,
          settings.address,
          topic
        );
      } else {
        return Promise.resolve();
      }
    })
  );
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

    const success = await updateNotificationSubscriptionWithRetry(
      firebaseToken,
      subscriptionPayload
    );
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
    logger.error(
      new RainbowError('Failed to publish wallet notification settings'),
      {
        message: (e as Error).message,
      }
    );

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
