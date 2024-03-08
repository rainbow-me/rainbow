import { Migration, MigrationName } from '@/migrations/types';
import { queryClient } from '@/react-query';
import { favoritesQueryKey } from '@/resources/favorites';
import { queryStorage } from '@/storage/legacy';

export function migratePersistedQueriesToMMKV(): Migration {
  return {
    name: MigrationName.migratePersistedQueriesToMMKV,
    async migrate() {
      const queryState = await queryStorage.get(['rainbow.react-query']);
      const favoritesState = queryState?.clientState?.queries[favoritesQueryKey[1]];
      await queryClient.setQueryData(favoritesQueryKey, favoritesState);
      return;
    },
  };
}
