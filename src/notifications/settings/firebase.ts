import { NOTIFICATIONS_API_KEY } from 'react-native-dotenv';
import { logger, RainbowError } from '@/logger';
import {
  GlobalNotificationTopics,
  GlobalNotificationTopicType,
  NotificationSubscriptionWalletsType,
  WalletNotificationSettings,
} from '@/notifications/settings/types';
import { getFCMToken, saveFCMToken } from '@/notifications/tokens';
import { rainbowFetch } from '@/rainbow-fetch';

const NOTIFICATION_SUBSCRIPTIONS_URL = 'https://notifications.p.rainbow.me/api/v1/subscriptions';

const INVALID_FCM_TOKEN_ERROR = 'failed to validate FCM token: invalid or expired FCM token';

type NotificationsSubscriptionResponse = {
  error: boolean;
  shouldRetry: boolean;
};

const updateNotificationSubscription = async ({
  firebaseToken,
  marketingTopics,
  wallets,
}: {
  firebaseToken: string;
  marketingTopics: GlobalNotificationTopicType[];
  wallets: NotificationSubscriptionWalletsType[];
}): Promise<NotificationsSubscriptionResponse> => {
  try {
    const options = {
      firebase_token: firebaseToken,
      marketing_topics: marketingTopics,
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

const updateNotificationSubscriptionWithRetry = async ({
  firebaseToken,
  marketingTopics,
  wallets,
}: {
  firebaseToken: string;
  marketingTopics: GlobalNotificationTopicType[];
  wallets: NotificationSubscriptionWalletsType[];
}): Promise<boolean> => {
  const subscriptionResponse = await updateNotificationSubscription({ firebaseToken, marketingTopics, wallets });

  if (!subscriptionResponse.error) {
    // success
    return true;
  } else if (subscriptionResponse.shouldRetry) {
    // retry with an updated FCM token
    const refreshedFirebaseToken = await saveFCMToken();
    if (!refreshedFirebaseToken) return false;

    const subscriptionRetryResponse = await updateNotificationSubscription({
      firebaseToken: refreshedFirebaseToken,
      marketingTopics,
      wallets,
    });
    return !subscriptionRetryResponse.error;
  } else {
    return false;
  }
};

// returns updated wallet settings on success, undefined otherwise
export const publishWalletSettings = async ({
  globalSettings,
  walletSettings,
}: {
  globalSettings: GlobalNotificationTopics;
  walletSettings: WalletNotificationSettings[];
}): Promise<WalletNotificationSettings[] | undefined> => {
  try {
    const wallets = parseWalletSettings(walletSettings);
    const marketingTopics = Object.keys(globalSettings).filter(topic => globalSettings[topic]);
    let firebaseToken = await getFCMToken();

    // refresh the FCM token if not found
    if (!firebaseToken) {
      firebaseToken = await saveFCMToken();
      if (!firebaseToken) return;
    }

    const success = await updateNotificationSubscriptionWithRetry({ firebaseToken, marketingTopics, wallets });
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
  return enabledWalletSettings.map(setting => {
    const topics = Object.keys(setting.topics).filter(topic => !!setting.topics[topic]);
    return {
      type: setting.type,
      address: setting.address.toLowerCase(),
      transaction_action_types: topics,
    };
  });
};
