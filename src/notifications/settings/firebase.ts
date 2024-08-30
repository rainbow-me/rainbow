import { GlobalNotificationTopicType, WalletNotificationTopicType, WalletNotificationSettings } from '@/notifications/settings/types';
import messaging from '@react-native-firebase/messaging';
import { trackChangedNotificationSettings } from '@/notifications/analytics';
import { GlobalNotificationTopic, WalletNotificationTopic } from '@/notifications/settings/constants';
import { logger } from '@/logger';

/**
 Firebase functions for subscribing/unsubscribing to topics.
 */
export const subscribeWalletToAllEnabledTopics = (settings: WalletNotificationSettings, chainId: number): Promise<void[]> => {
  return Promise.all(
    Object.entries(settings.topics).map(([topic, isEnabled]) => {
      if (isEnabled) {
        return subscribeWalletToNotificationTopic(settings.type, chainId, settings.address, topic);
      } else {
        return Promise.resolve();
      }
    })
  );
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
  logger.debug(`Notifications: subscribing ${type}:${address} to [ ${topic.toUpperCase()} ]`, {}, logger.DebugContext.notifications);
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
  logger.debug(`Notifications: unsubscribing ${type}:${address} from [ ${topic.toUpperCase()} ]`, {}, logger.DebugContext.notifications);
  return messaging()
    .unsubscribeFromTopic(`${type}_${chainId}_${address.toLowerCase()}_${topic}`)
    .then(() => {
      trackChangedNotificationSettings(topic, 'unsubscribe', chainId, type);
    });
};

export const subscribeToGlobalNotificationTopic = async (topic: GlobalNotificationTopicType): Promise<void> => {
  logger.debug(`Notifications: subscribing to [ ${topic.toUpperCase()} ]`, {}, logger.DebugContext.notifications);
  return messaging()
    .subscribeToTopic(topic)
    .then(() => trackChangedNotificationSettings(topic, 'subscribe'));
};

export const unsubscribeFromGlobalNotificationTopic = async (topic: GlobalNotificationTopicType) => {
  logger.debug(`Notifications: unsubscribing from [ ${topic.toUpperCase()} ]`, {}, logger.DebugContext.notifications);
  return messaging()
    .unsubscribeFromTopic(topic)
    .then(() => {
      trackChangedNotificationSettings(topic, 'unsubscribe');
    });
};
