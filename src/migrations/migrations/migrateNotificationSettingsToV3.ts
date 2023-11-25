import { Migration, MigrationName } from '@/migrations/types';
import { getAllWalletNotificationSettingsFromStorage, setAllWalletNotificationSettingsToStorage } from '@/notifications/settings/storage';

export function migrateNotificationSettingsToV3(): Migration {
  return {
    name: MigrationName.migrateNotificationSettingsToVersion3,
    async migrate() {
      const walletSettings = getAllWalletNotificationSettingsFromStorage();

      // reset successfullyFinishedInitialSubscription
      if (walletSettings.length) {
        const newSettings = walletSettings.map(wallet => ({
          ...wallet,
          successfullyFinishedInitialSubscription: false,
        }));
        setAllWalletNotificationSettingsToStorage(newSettings);
      }
      return;
    },
  };
}
