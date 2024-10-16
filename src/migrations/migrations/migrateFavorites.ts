import { UniqueId } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/utils/ethereumUtils';
import { EthereumAddress, RainbowToken } from '@/entities';
import { createQueryKey, persistOptions, queryClient } from '@/react-query';
import { favoritesQueryKey } from '@/resources/favorites';
import { persistQueryClientRestore, persistQueryClientSave } from '@tanstack/react-query-persist-client';
import { Migration, MigrationName } from '../types';

const favoritesV1QueryKey = createQueryKey('favorites', {}, { persisterVersion: 1 });
const favoritesV2QueryKey = createQueryKey('favorites', {}, { persisterVersion: 2 });

export function migrateFavoritesV2(): Migration {
  return {
    name: MigrationName.migrateFavoritesV2,
    async migrate() {
      await persistQueryClientRestore({ queryClient, persister: persistOptions.persister }); // first restore persisted data

      // v1 used just the address as key, v2 uses uniqueId as key and builds this uniqueId with ChainId instead of Network
      const v1Data = queryClient.getQueryData<Record<EthereumAddress, RainbowToken>>(favoritesV1QueryKey);

      if (!v1Data) return;

      const migratedFavorites: Record<UniqueId, RainbowToken> = {};
      for (const favorite of Object.values(v1Data)) {
        const uniqueId = getUniqueId(favorite.address, favorite.chainId);
        favorite.uniqueId = uniqueId; // v2 unique uses chainId instead of Network
        migratedFavorites[uniqueId] = favorite;
      }
      queryClient.setQueryData(favoritesQueryKey, migratedFavorites);

      await persistQueryClientSave({ queryClient, persister: persistOptions.persister });
    },
  };
}

export function migrateFavoritesV3(): Migration {
  return {
    name: MigrationName.migrateFavoritesV3,
    async migrate() {
      await persistQueryClientRestore({ queryClient, persister: persistOptions.persister }); // first restore persisted data

      const v2Data = queryClient.getQueryData<Record<UniqueId, RainbowToken>>(favoritesV2QueryKey);
      if (!v2Data) return;

      queryClient.setQueryData(favoritesQueryKey, v2Data, { updatedAt: 0 });

      await persistQueryClientSave({ queryClient, persister: persistOptions.persister });
    },
  };
}
