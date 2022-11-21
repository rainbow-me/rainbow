import { Migration, MigrationName } from '@/migrations/types';
import {
  getAllNotificationSettingsFromStorage,
  getSettingsVersion,
  setAllNotificationSettingsToStorage,
  setSettingsVersion,
} from '@/notifications/settings/storage';

export default function migrateNotificationSettingsToV2(): Migration {
  return {
    name: MigrationName.migrateNotificationSettingsToVersion2,
    migrate(): Promise<void> {
      const walletSettings = getAllNotificationSettingsFromStorage();

      // migrate to V2
      if (walletSettings.length && getSettingsVersion() === 1) {
        //
        const newSettings = walletSettings.map(wallet => ({
          ...wallet,
          appliedDefaults: true,
        }));
        setAllNotificationSettingsToStorage(newSettings);
      }
      setSettingsVersion(2);
      return Promise.resolve();
    },
  };
}
