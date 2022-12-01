import { Migration, MigrationName } from '@/migrations/types';
import {
  getAllNotificationSettingsFromStorage,
  getSettingsVersion,
  setAllNotificationSettingsToStorage,
  setSettingsVersion,
} from '@/notifications/settings/storage';

export function migrateNotificationSettingsToV2(): Migration {
  return {
    name: MigrationName.migrateNotificationSettingsToVersion2,
    migrate() {
      const walletSettings = getAllNotificationSettingsFromStorage();

      // if we are already migrated, but the migration ran anyway
      if (getSettingsVersion() === 2) return Promise.resolve();

      // migrating from v1 ro v2
      if (walletSettings.length && getSettingsVersion() === 1) {
        const newSettings = walletSettings.map(wallet => ({
          ...wallet,
          successfullyFinishedInitialSubscription: true,
        }));
        setAllNotificationSettingsToStorage(newSettings);
      }
      setSettingsVersion(2);
      return Promise.resolve();
    },
  };
}
