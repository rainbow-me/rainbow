import { Migration, MigrationName } from '@/migrations/types';
import { queryClient } from '@/react-query';
import { favoritesQueryKey } from '@/resources/favorites';
import { queryStorage } from '@/storage/legacy';

export function migratePersistedQueriesToMMKV(): Migration {
  return {
    name: MigrationName.migratePersistedQueriesToMMKV,
    async migrate() {
      const queryState = JSON.parse(await queryStorage.get(['rainbow.react-query']))
      const favoritesState = queryState?.clientState?.queries?.find?.((query: { queryKey: string[]; }) => query?.queryKey[1] == favoritesQueryKey[1])
      await queryClient.setQueryData(favoritesQueryKey, favoritesState);
      return;
    },
  };
}
