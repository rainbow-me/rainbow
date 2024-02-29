import { Migration, MigrationName } from '@/migrations/types';
import { queryClient } from '@/react-query';
import { queryStorage } from '@/storage/legacy';

export function migratePersistedQueriesToMMKV(): Migration {
  return {
    name: MigrationName.migratePersistedQueriesToMMKV,
    async defer() {
      // query storage will retreive the whole query state from asyncstorage and replace it in MMKV
      await queryStorage.get(['rainbow.react-query']);
      return;
    },
  };
}
