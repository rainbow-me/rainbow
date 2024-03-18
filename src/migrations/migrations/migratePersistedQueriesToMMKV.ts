import { Migration, MigrationName } from '@/migrations/types';
import { queryClient } from '@/react-query';
import { favoritesQueryKey } from '@/resources/favorites';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function migratePersistedQueriesToMMKV(): Migration {
  return {
    name: MigrationName.migratePersistedQueriesToMMKV,
    async migrate() {
      const data = await AsyncStorage.getItem('rainbow.react-query');
      if (!data) return;

      const queryState = JSON.parse(data);
      const favoritesState = queryState?.clientState?.queries?.find?.(
        (query: { queryKey: string[] }) => query?.queryKey[1] == favoritesQueryKey[1]
      );
      await queryClient.setQueryData(favoritesQueryKey, favoritesState?.state?.data);
      return;
    },
  };
}
