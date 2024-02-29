import { analytics, analyticsV2 } from '@/analytics';
import { MinimalNotification } from '@/notifications/types';
import { getPermissionStatus } from '@/notifications/permissions';
import messaging from '@react-native-firebase/messaging';
import {
  WalletNotificationRelationship,
  WALLET_GROUPS_STORAGE_KEY,
  WALLET_TOPICS_STORAGE_KEY,
  GroupSettings,
  WalletNotificationRelationshipType,
  WalletNotificationTopicType,
  WalletNotificationSettings,
  notificationSettingsStorage,
} from '@/notifications/settings';

export const trackTappedPushNotification = (notification: MinimalNotification | undefined) => {
  analytics.track('Tapped Push Notification', {
    campaign: {
      name: notification?.data?.type ?? 'default',
      medium: 'Push',
    },
  });
};

export const trackChangedNotificationSettings = (
  topic: WalletNotificationTopicType,
  action: 'subscribe' | 'unsubscribe',
  chainId?: number,
  type?: WalletNotificationRelationshipType
) => {
  analytics.track('Changed Notification Settings', {
    chainId,
    topic,
    type,
    action,
  });
};

export const trackPushNotificationPermissionStatus = async (status: PushNotificationPermissionStatus) => {
  analyticsV2.identify({ notificationsPermissionStatus: status });
};

type PushNotificationPermissionStatus = 'enabled' | 'disabled' | 'never asked';

export const resolveAndTrackPushNotificationPermissionStatus = async () => {
  const permissionStatus = await getPermissionStatus();
  let statusToReport: PushNotificationPermissionStatus = 'never asked';

  if (permissionStatus === messaging.AuthorizationStatus.AUTHORIZED || permissionStatus === messaging.AuthorizationStatus.PROVISIONAL) {
    statusToReport = 'enabled';
  } else if (permissionStatus === messaging.AuthorizationStatus.DENIED) {
    statusToReport = 'disabled';
  }

  trackPushNotificationPermissionStatus(statusToReport);
};

export const trackWalletsSubscribedForNotifications = () => {
  const walletsStringValue = notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY);
  const groupsStringValue = notificationSettingsStorage.getString(WALLET_GROUPS_STORAGE_KEY);

  if (!walletsStringValue || !groupsStringValue) return;

  const wallets = JSON.parse(walletsStringValue) as WalletNotificationSettings[];
  const groups = JSON.parse(groupsStringValue) as GroupSettings;

  const { imported, watched } = countWalletsWithNotificationsTurnedOn(wallets);

  trackNumberOfWalletsWithNotificationsTurnedOn(
    groups[WalletNotificationRelationship.OWNER] ? imported : 0,
    groups[WalletNotificationRelationship.WATCHER] ? watched : 0
  );
};

export type NotificationSubscriptionChangesListener = {
  remove: () => void;
};

export const registerNotificationSubscriptionChangesListener = (): NotificationSubscriptionChangesListener => {
  return notificationSettingsStorage.addOnValueChangedListener(key => {
    if (key === WALLET_GROUPS_STORAGE_KEY) {
      const stringValue = notificationSettingsStorage.getString(key);
      if (stringValue) {
        const value = JSON.parse(stringValue) as GroupSettings;
        onGroupStateChange(value);
      }
    } else if (key === WALLET_TOPICS_STORAGE_KEY) {
      const stringValue = notificationSettingsStorage.getString(key);
      if (stringValue) {
        const value = JSON.parse(stringValue);
        onTopicsStateChange(value);
      }
    }
  });
};

const onGroupStateChange = (state: GroupSettings) => {
  const stringValue = notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY);

  if (!stringValue) return;

  const wallets = JSON.parse(stringValue) as WalletNotificationSettings[];
  const { imported, watched } = countWalletsWithNotificationsTurnedOn(wallets);

  trackNumberOfWalletsWithNotificationsTurnedOn(
    state[WalletNotificationRelationship.OWNER] ? imported : 0,
    state[WalletNotificationRelationship.WATCHER] ? watched : 0
  );
};

const onTopicsStateChange = (state: WalletNotificationSettings[]) => {
  const { imported, watched } = countWalletsWithNotificationsTurnedOn(state);

  trackNumberOfWalletsWithNotificationsTurnedOn(imported, watched);
};

const countWalletsWithNotificationsTurnedOn = (wallets: WalletNotificationSettings[]) => {
  let imported = 0;
  let watched = 0;

  wallets.forEach(entry => {
    if (!entry.enabled) return;
    if (entry.type === WalletNotificationRelationship.OWNER) imported += 1;
    else watched += 1;
  });

  return {
    imported,
    watched,
  };
};

const trackNumberOfWalletsWithNotificationsTurnedOn = async (imported: number, watched: number) => {
  analyticsV2.identify({
    numberOfImportedWalletsWithNotificationsTurnedOn: imported,
    numberOfWatchedWalletsWithNotificationsTurnedOn: watched,
  });
};
