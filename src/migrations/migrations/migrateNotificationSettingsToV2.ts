import { Migration, MigrationName } from '@/migrations/types';
import { getAllWalletNotificationSettingsFromStorage, setAllWalletNotificationSettingsToStorage } from '@/notifications/settings/storage';

export function migrateNotificationSettingsToV2(): Migration {
  return {
    name: MigrationName.migrateNotificationSettingsToVersion2,
    async migrate() {
      const walletSettings = getAllWalletNotificationSettingsFromStorage();
      let settingsVersion = 1;

      if (walletSettings.length > 0 && walletSettings[0].successfullyFinishedInitialSubscription !== undefined) {
        settingsVersion = 2;
      }

      // if we are already migrated, but the migration ran anyway
      if (settingsVersion === 2) return;

      // migrating from v1 ro v2
      if (walletSettings.length) {
        const newSettings = walletSettings.map(wallet => ({
          ...wallet,
          successfullyFinishedInitialSubscription: true,
        }));
        setAllWalletNotificationSettingsToStorage(newSettings);
      }
      return;
    },
  };
}
