import { analytics } from '@/analytics';
import { MinimalNotification } from '@/notifications/types';
import { getPermissionStatus } from '@/notifications/permissions';
import messaging from '@react-native-firebase/messaging';
import {
  NotificationRelationship,
  WALLET_GROUPS_STORAGE_KEY,
  WALLET_TOPICS_STORAGE_KEY,
  GroupSettings,
  NotificationRelationshipType,
  NotificationTopicType,
  WalletNotificationSettings,
  notificationSettingsStorage,
} from '@/notifications/settings';

export const trackTappedPushNotification = (
  notification: MinimalNotification | undefined
) => {
  analytics.track('Tapped Push Notification', {
    campaign: {
      name: notification?.data?.type ?? 'default',
      medium: 'Push',
    },
  });
};

export const trackChangedNotificationSettings = (
  topic: NotificationTopicType,
  action: 'subscribe' | 'unsubscribe',
  chainId?: number,
  type?: NotificationRelationshipType
) => {
  analytics.track('Changed Notification Settings', {
    chainId,
    topic,
    type,
    action,
  });
};

export const trackPushNotificationPermissionStatus = (
  status: PushNotificationPermissionStatus
) => {
  analytics.identify(undefined, { notificationsPermissionStatus: status });
};

type PushNotificationPermissionStatus = 'enabled' | 'disabled' | 'never asked';

export const resolveAndTrackPushNotificationPermissionStatus = async () => {
  const permissionStatus = await getPermissionStatus();
  let statusToReport: PushNotificationPermissionStatus = 'never asked';

  if (
    permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    permissionStatus === messaging.AuthorizationStatus.PROVISIONAL
  ) {
    statusToReport = 'enabled';
  } else if (permissionStatus === messaging.AuthorizationStatus.DENIED) {
    statusToReport = 'disabled';
  }

  trackPushNotificationPermissionStatus(statusToReport);
};

export const trackWalletsSubscribedForNotifications = () => {
  const walletsStringValue = notificationSettingsStorage.getString(
    WALLET_TOPICS_STORAGE_KEY
  );
  const groupsStringValue = notificationSettingsStorage.getString(
    WALLET_GROUPS_STORAGE_KEY
  );

  if (!walletsStringValue || !groupsStringValue) return;

  const wallets = JSON.parse(
    walletsStringValue
  ) as WalletNotificationSettings[];
  const groups = JSON.parse(groupsStringValue) as GroupSettings;

  const { imported, watched } = countWalletsWithNotificationsTurnedOn(wallets);

  trackNumberOfWalletsWithNotificationsTurnedOn(
    groups[NotificationRelationship.OWNER] ? imported : 0,
    groups[NotificationRelationship.WATCHER] ? watched : 0
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
  const stringValue = notificationSettingsStorage.getString(
    WALLET_TOPICS_STORAGE_KEY
  );

  if (!stringValue) return;

  const wallets = JSON.parse(stringValue) as WalletNotificationSettings[];
  const { imported, watched } = countWalletsWithNotificationsTurnedOn(wallets);

  trackNumberOfWalletsWithNotificationsTurnedOn(
    state[NotificationRelationship.OWNER] ? imported : 0,
    state[NotificationRelationship.WATCHER] ? watched : 0
  );
};

const onTopicsStateChange = (state: WalletNotificationSettings[]) => {
  const { imported, watched } = countWalletsWithNotificationsTurnedOn(state);

  trackNumberOfWalletsWithNotificationsTurnedOn(imported, watched);
};

const countWalletsWithNotificationsTurnedOn = (
  wallets: WalletNotificationSettings[]
) => {
  let imported = 0;
  let watched = 0;

  wallets.forEach(entry => {
    if (!entry.enabled) return;
    if (entry.type === NotificationRelationship.OWNER) imported += 1;
    else watched += 1;
  });

  return {
    imported,
    watched,
  };
};

const trackNumberOfWalletsWithNotificationsTurnedOn = (
  imported: number,
  watched: number
) => {
  analytics.identify(undefined, {
    numberOfImportedWalletsWithNotificationsTurnedOn: imported,
    numberOfWatchedWalletsWithNotificationsTurnedOn: watched,
  });
};
