import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';
import { useCallback, useEffect, useMemo, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import Logger from '@/utils/logger';

type ValueOf<T> = T[keyof T];

export const NotificationTopic = {
  SENT: 'sent',
  RECEIVED: 'received',
  PURCHASED: 'purchased',
  SOLD: 'sold',
  MINTED: 'minted',
  SWAPPED: 'swapped',
  APPROVALS: 'approvals',
  OTHER: 'other',
};

export const NotificationRelationship = {
  OWNER: 'owner',
  WATCHER: 'watcher',
};

export type WalletNotificationSettingsType = {
  address: string;
  topics: { [key: ValueOf<typeof NotificationTopic>]: boolean };
  enabled: boolean;
  type: ValueOf<typeof NotificationRelationship>;
};

const WALLET_TOPICS_STORAGE_KEY = 'notificationSettings';
const WALLET_GROUPS_STORAGE_KEY = 'notificationGroupToggle';
export const NOTIFICATIONS_DEFAULT_CHAIN_ID = 1; // hardcoded mainnet until we get multi-chain support

const storage = new MMKV({
  id: STORAGE_IDS.NOTIFICATIONS,
});

/* 
  Grabs notification settings for all wallets if they exist,
  otherwise returns an empty array.
*/
export const getAllNotificationSettingsFromStorage = () => {
  const data = storage.getString(WALLET_TOPICS_STORAGE_KEY);

  if (data) return JSON.parse(data);
  return [];
};

export const getExistingGroupSettingsFromStorage = () => {
  const data = storage.getString(WALLET_GROUPS_STORAGE_KEY);

  if (data) return JSON.parse(data);
  return [];
};

/* 
  Hook to constantly listen to notification settings.
*/
export const useAllNotificationSettingsFromStorage = () => {
  const data = getAllNotificationSettingsFromStorage();
  const existingGroupSettingsData = getExistingGroupSettingsFromStorage();

  const [notificationSettings, setNotificationSettings] = useState<
    WalletNotificationSettingsType[]
  >(data);
  const [existingGroupSettings, setExistingGroupSettings] = useState<{
    [key: ValueOf<typeof NotificationRelationship>]: boolean;
  }>(existingGroupSettingsData);
  const listener = storage.addOnValueChangedListener(changedKey => {
    if (changedKey === WALLET_TOPICS_STORAGE_KEY) {
      const newSettings = storage.getString(changedKey);
      newSettings && setNotificationSettings(JSON.parse(newSettings));
    } else if (changedKey === WALLET_GROUPS_STORAGE_KEY) {
      const newSettings = storage.getString(changedKey);
      newSettings && setExistingGroupSettings(JSON.parse(newSettings));
    }
  });
  useEffect(() => () => {
    listener.remove();
  });
  return { notificationSettings, existingGroupSettings };
};

/*
  Checks if notification settings exist for a wallet and returns a boolean.
*/
export const walletHasNotificationSettings = (address: string) => {
  const data = getAllNotificationSettingsFromStorage();
  const settings = data.find(
    (wallet: WalletNotificationSettingsType) => wallet.address === address
  );

  return !!settings;
};

/*
  1. Reads notification settings for all wallets from storage.
  2. Matches settings for the wallet with the given address.
  3. Excludes that wallet from the array and saves the new array.
  4. Unsubscribes the wallet from all notification topics on Firebase.
*/
export const removeNotificationSettingsForWallet = (address: string) => {
  const allSettings = getAllNotificationSettingsFromStorage();
  const settingsForWallet = allSettings.find(
    (wallet: WalletNotificationSettingsType) => wallet.address === address
  );
  const newSettings = allSettings.filter(
    (wallet: WalletNotificationSettingsType) => wallet.address !== address
  );

  unsubscribeWalletFromAllNotificationTopics(
    settingsForWallet.type,
    NOTIFICATIONS_DEFAULT_CHAIN_ID,
    address
  );
  storage.set(WALLET_TOPICS_STORAGE_KEY, JSON.stringify(newSettings));
};

/* 
  1. Checks if notification settings already exist for the given address.
  2. Grabs all notification settings from storage.
  3. Appends default settings for the given address to the array.
  4. Saves the new array to storage.
  5. Subscribes the wallet to all notification topics on Firebase.
*/
export const addDefaultNotificationSettingsForWallet = (
  address: string,
  relationship: string
) => {
  const existingSettings = walletHasNotificationSettings(address);
  const defaultEnabledTopicSettings = {};
  Object.values(NotificationTopic).forEach(
    // looping through topics and setting them all as true by default
    // @ts-expect-error: Object.values() returns a string[]
    topic => (defaultEnabledTopicSettings[topic] = true)
  );

  if (!existingSettings) {
    const isOwnedWallet = relationship === NotificationRelationship.OWNER;
    const settings = getAllNotificationSettingsFromStorage();
    const groupSettings = getExistingGroupSettingsFromStorage();
    const notificationsEnabled =
      isOwnedWallet && groupSettings[NotificationRelationship.OWNER];
    const newSettings = [
      ...settings,
      {
        address,
        topics: defaultEnabledTopicSettings,
        enabled: notificationsEnabled, // turn off notifications for watched wallets by default
        type: relationship,
      },
    ];

    storage.set(WALLET_TOPICS_STORAGE_KEY, JSON.stringify(newSettings));

    if (notificationsEnabled) {
      // only auto-subscribe to topics for owned wallets
      subscribeWalletToAllNotificationTopics(
        relationship,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        address
      );
    }
  } else {
    const settings = getAllNotificationSettingsFromStorage();
    const settingsForWallet = settings.find(
      (wallet: WalletNotificationSettingsType) => wallet.address === address
    );

    // handle case where user imports an already watched wallet which becomes owned
    if (settingsForWallet.type !== relationship) {
      Logger.log(
        `Notifications: unsubscribing ${address} from all [${settingsForWallet.type}] notifications and subscribing to all notifications as [${relationship}]`
      );

      const settingsIndex = settings.findIndex(
        (wallet: WalletNotificationSettingsType) => wallet.address === address
      );

      unsubscribeWalletFromAllNotificationTopics(
        settingsForWallet.type,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        address
      );
      subscribeWalletToAllNotificationTopics(
        relationship,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        address
      );
      // update config for this wallet with new relationship and all topics enabled by default
      settings[settingsIndex].type = relationship;
      settings[settingsIndex].enabled = true;
      settings[settingsIndex].topics = defaultEnabledTopicSettings;

      storage.set(WALLET_TOPICS_STORAGE_KEY, JSON.stringify(settings));
    }
  }
};

/* 
  Checks if group notification settings are present in storage
  and adds default values for them if they do not exist.
*/
export const addDefaultNotificationGroupSettings = () => {
  const data = storage.getString(WALLET_GROUPS_STORAGE_KEY);

  if (!data) {
    const defaultSettings = {
      [NotificationRelationship.OWNER]: true,
      [NotificationRelationship.WATCHER]: false,
    };
    storage.set(WALLET_GROUPS_STORAGE_KEY, JSON.stringify(defaultSettings));
  }
};

// Runs the above function when the app is loaded to make sure settings are always present.
addDefaultNotificationGroupSettings();

/*
  * Hook for getting and setting notification settings for a single wallet.

  Returns an object with the wallet address, enabled/disabled topics, relationship,
  and a main boolean for enabling/disabling all notifications for this wallet.

  Also returns a function for updating settings.
  The function saves new option values to storage and handles 
  subscribing/unsubscribing to Firebase based on selected topics for this wallet.
*/
export const useNotificationSettings = (address: string) => {
  const data = getAllNotificationSettingsFromStorage();
  const settingsForWallet = data.find(
    (wallet: WalletNotificationSettingsType) => wallet.address === address
  );
  const [notifications, setNotificationSettings] = useState(settingsForWallet);

  const updateSettings = useCallback(
    (options: object) => {
      const newSettings = data.map((wallet: WalletNotificationSettingsType) => {
        if (wallet.address === address) {
          return { ...wallet, ...options };
        }
        return wallet;
      });
      const newSettingsForWallet = newSettings.find(
        (wallet: WalletNotificationSettingsType) => wallet.address === address
      );
      storage.set(WALLET_TOPICS_STORAGE_KEY, JSON.stringify(newSettings));
      setNotificationSettings(newSettingsForWallet);
    },
    [address, data]
  );

  return { notifications, updateSettings };
};

export const updateSettingsForWallets = (
  type: ValueOf<typeof NotificationRelationship>,
  options: object
) => {
  const data = getAllNotificationSettingsFromStorage();
  const newSettings = data.map((wallet: WalletNotificationSettingsType) => {
    if (wallet.type === type) {
      return { ...wallet, ...options };
    }
    return wallet;
  });
  storage.set(WALLET_TOPICS_STORAGE_KEY, JSON.stringify(newSettings));
};

/* 
  Hook for getting and setting notification settings for all wallets 
  in an owned/watched group.

  Returns a boolean for two groups: owned and watched.
  Provides a function for updating the group settings.
*/
export const useWalletGroupNotificationSettings = () => {
  const {
    notificationSettings,
    existingGroupSettings,
  } = useAllNotificationSettingsFromStorage();

  const ownerEnabled = existingGroupSettings[NotificationRelationship.OWNER];
  const watcherEnabled =
    existingGroupSettings[NotificationRelationship.WATCHER];

  const {
    lastWatchedWalletEnabled,
    lastOwnedWalletEnabled,
    allWatchedWalletsDisabled,
    allOwnedWalletsDisabled,
    watchedWallets,
    ownedWallets,
  } = useMemo(() => {
    const ownedWallets = notificationSettings.filter(
      (wallet: WalletNotificationSettingsType) =>
        wallet.type === NotificationRelationship.OWNER
    );
    const watchedWallets = notificationSettings.filter(
      (wallet: WalletNotificationSettingsType) =>
        wallet.type === NotificationRelationship.WATCHER
    );
    const allOwnedWalletsDisabled = ownedWallets.reduce(
      (prevWalletDisabled, wallet) => prevWalletDisabled && !wallet.enabled,
      true
    );

    const allWatchedWalletsDisabled = watchedWallets.reduce(
      (prevWalletDisabled, wallet) => prevWalletDisabled && !wallet.enabled,
      true
    );
    const lastOwnedWalletEnabled =
      ownedWallets.filter(wallet => wallet.enabled).length === 1;
    const lastWatchedWalletEnabled =
      watchedWallets.filter(wallet => wallet.enabled).length === 1;

    return {
      lastWatchedWalletEnabled,
      lastOwnedWalletEnabled,
      allWatchedWalletsDisabled,
      allOwnedWalletsDisabled,
      watchedWallets,
      ownedWallets,
    };
  }, [notificationSettings]);

  const updateSectionSettings = useCallback(
    (options: object) => {
      const newSettings = { ...existingGroupSettings, ...options };
      storage.set(WALLET_GROUPS_STORAGE_KEY, JSON.stringify(newSettings));
    },
    [existingGroupSettings]
  );

  const updateGroupSettings = useCallback(
    (options: object) => {
      const newSettings = { ...existingGroupSettings, ...options };
      const newOwnerEnabled = newSettings[NotificationRelationship.OWNER];
      const newWatcherEnabled = newSettings[NotificationRelationship.WATCHER];

      storage.set(WALLET_GROUPS_STORAGE_KEY, JSON.stringify(newSettings));

      if (newOwnerEnabled !== ownerEnabled) {
        toggleGroupNotifications(
          ownedWallets,
          NotificationRelationship.OWNER,
          newOwnerEnabled
        );
      }

      if (newWatcherEnabled !== watcherEnabled) {
        toggleGroupNotifications(
          watchedWallets,
          NotificationRelationship.WATCHER,
          newWatcherEnabled
        );
      }
    },
    [
      existingGroupSettings,
      ownedWallets,
      ownerEnabled,
      watchedWallets,
      watcherEnabled,
    ]
  );

  const isOwnerEnabled = useMemo(
    () => ownerEnabled && !allOwnedWalletsDisabled,
    [allOwnedWalletsDisabled, ownerEnabled]
  );
  const isWatcherEnabled = useMemo(
    () => watcherEnabled && !allWatchedWalletsDisabled,
    [allWatchedWalletsDisabled, watcherEnabled]
  );

  return {
    ownerEnabled: isOwnerEnabled,
    watcherEnabled: isWatcherEnabled,
    lastOwnedWalletEnabled,
    lastWatchedWalletEnabled,
    updateGroupSettings,
    updateSectionSettings,
  };
};

/*
  Function for enabling/disabling all notifications for a group of wallets.
  Also used to batch toggle notifications for a single wallet 
  when using the `Allow Notifications` switch in the wallet settings view.
*/
export function toggleGroupNotifications(
  wallets: WalletNotificationSettingsType[],
  relationship: ValueOf<typeof NotificationRelationship>,
  enableNotifications: boolean
) {
  if (enableNotifications) {
    // loop through all owned wallets, loop through their topics, subscribe to enabled topics
    wallets.forEach((wallet: WalletNotificationSettingsType) => {
      const { topics, address } = wallet;
      // when toggling a whole group, check if notifications
      // are specifically enabled for this wallet
      // if (enabled || singleWallet) {
      Object.keys(topics).forEach(
        (topic: ValueOf<typeof NotificationTopic>) => {
          if (topics[topic]) {
            subscribeWalletToSingleNotificationTopic(
              relationship,
              NOTIFICATIONS_DEFAULT_CHAIN_ID,
              address,
              topic
            );
          }
        }
      );
      // }
    });
  } else {
    // loop through all owned wallets, unsubscribe from all topics
    wallets.forEach((wallet: WalletNotificationSettingsType) => {
      unsubscribeWalletFromAllNotificationTopics(
        relationship,
        NOTIFICATIONS_DEFAULT_CHAIN_ID,
        wallet.address
      );
    });
  }
}

/*
  Function for subscribing/unsubscribing a wallet to/from a single notification topic.  
*/
export function toggleTopicForWallet(
  relationship: ValueOf<typeof NotificationRelationship>,
  address: string,
  topic: ValueOf<typeof NotificationTopic>,
  enableTopic: boolean
) {
  if (enableTopic) {
    subscribeWalletToSingleNotificationTopic(
      relationship,
      NOTIFICATIONS_DEFAULT_CHAIN_ID,
      address,
      topic
    );
  } else {
    unsubscribeWalletFromSingleNotificationTopic(
      relationship,
      NOTIFICATIONS_DEFAULT_CHAIN_ID,
      address,
      topic
    );
  }
}

/*
  Firebase functions for subscribing/unsubscribing to topics.
*/
const subscribeWalletToAllNotificationTopics = async (
  type: string,
  chainId: number,
  address: string
) => {
  Object.values(NotificationTopic).forEach(topic => {
    Logger.log(
      `Notifications: subscribing ${type}:${address} to [ ${topic} ] `
    );
    messaging().subscribeToTopic(
      `${type}_${chainId}_${address.toLowerCase()}_${topic}`
    );
  });
};

const unsubscribeWalletFromAllNotificationTopics = async (
  type: string,
  chainId: number,
  address: string
) => {
  Object.values(NotificationTopic).forEach(topic => {
    Logger.log(
      `Notifications: unsubscribing ${type}:${address} from [ ${topic} ]`
    );
    messaging().unsubscribeFromTopic(
      `${type}_${chainId}_${address.toLowerCase()}_${topic}`
    );
  });
};

const subscribeWalletToSingleNotificationTopic = async (
  type: string,
  chainId: number,
  address: string,
  topic: ValueOf<typeof NotificationTopic>
) => {
  Logger.log(`Notifications: subscribing ${type}:${address} to [ ${topic} ]`);
  messaging().subscribeToTopic(
    `${type}_${chainId}_${address.toLowerCase()}_${topic}`
  );
};

const unsubscribeWalletFromSingleNotificationTopic = async (
  type: string,
  chainId: number,
  address: string,
  topic: ValueOf<typeof NotificationTopic>
) => {
  Logger.log(
    `Notifications: unsubscribing ${type}:${address} from [ ${topic} ]`
  );
  messaging().unsubscribeFromTopic(
    `${type}_${chainId}_${address.toLowerCase()}_${topic}`
  );
};
