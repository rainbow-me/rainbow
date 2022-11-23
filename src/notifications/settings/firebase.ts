import {
  NotificationTopicType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import Logger from 'logger';
import messaging from '@react-native-firebase/messaging';
import { trackChangedNotificationSettings } from '@/notifications/analytics';
import { NotificationTopic } from '@/notifications/settings/constants';

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
  Logger.log(
    `Notifications: subscribing ${type}:${address} to [ ${topic.toUpperCase()} ]`
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
  Logger.log(
    `Notifications: unsubscribing ${type}:${address} from [ ${topic.toUpperCase()} ]`
  );
  return messaging()
    .unsubscribeFromTopic(
      `${type}_${chainId}_${address.toLowerCase()}_${topic}`
    )
    .then(() => {
      trackChangedNotificationSettings(chainId, topic, type, 'unsubscribe');
    });
};
