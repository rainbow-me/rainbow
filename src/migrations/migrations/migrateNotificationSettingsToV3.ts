import { Migration, MigrationName } from '@/migrations/types';
import {
  getAllNotificationSettingsFromStorage,
  setAllNotificationSettingsToStorage,
} from '@/notifications/settings/storage';

export function migrateNotificationSettingsToV3(): Migration {
  return {
    name: MigrationName.migrateNotificationSettingsToVersion3,
    async migrate() {
      const walletSettings = getAllNotificationSettingsFromStorage();

      // reset successfullyFinishedInitialSubscription
      if (walletSettings.length) {
        const newSettings = walletSettings.map(wallet => ({
          ...wallet,
          successfullyFinishedInitialSubscription: false,
        }));
        setAllNotificationSettingsToStorage(newSettings);
      }
      return;
    },
  };
}
