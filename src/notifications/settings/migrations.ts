import {
  getAllNotificationSettingsFromStorage,
  getExistingGroupSettingsFromStorage,
  getSettingsVersion,
  setAllNotificationSettingsToStorage,
  setSettingsVersion,
} from '@/notifications/settings/storage';

export const migrateWalletSettings = () => {
  const walletSettings = getAllNotificationSettingsFromStorage();

  // migrate to V2
  if (walletSettings.length && getSettingsVersion() === 1) {
    const newSettings = walletSettings.map(wallet => ({
      ...wallet,
      appliedDefaults: true,
    }));
    setAllNotificationSettingsToStorage(newSettings);
    setSettingsVersion(2);
  }
};
