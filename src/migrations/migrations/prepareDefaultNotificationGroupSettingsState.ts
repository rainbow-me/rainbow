import { Migration, MigrationName } from '@/migrations/types';
import { addDefaultNotificationGroupSettings } from '@/notifications/settings';

export function prepareDefaultNotificationGroupSettingsState(): Migration {
  return {
    name: MigrationName.prepareDefaultNotificationGroupSettingsState,
    async migrate() {
      addDefaultNotificationGroupSettings();
    },
  };
}
