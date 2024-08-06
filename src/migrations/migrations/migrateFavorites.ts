import { AddressOrEth, UniqueId } from '@/__swaps__/types/assets';
import { getStandardizedUniqueIdWorklet } from '@/__swaps__/utils/swaps';
import { EthereumAddress, RainbowToken } from '@/entities';
import { createQueryKey, queryClient } from '@/react-query';
import { favoritesQueryKey } from '@/resources/favorites';
import { ethereumUtils } from '@/utils';
import { Migration, MigrationName } from '../types';

const favoritesV1QueryKey = createQueryKey('favorites', {}, { persisterVersion: 1 });
const favoritesV2QueryKey = createQueryKey('favorites', {}, { persisterVersion: 2 });

export function migrateFavoritesV2(): Migration {
  return {
    name: MigrationName.migrateFavoritesV2,
    async migrate() {
      // v1 used just the address as key, v2 uses uniqueId as key and builds this uniqueId with ChainId instead of Network
      const v1Data = queryClient.getQueryData<Record<EthereumAddress, RainbowToken>>(favoritesV1QueryKey);
      if (!v1Data) return;

      const migratedFavorites: Record<UniqueId, RainbowToken> = {};
      for (const favorite of Object.values(v1Data)) {
        const uniqueId = getStandardizedUniqueIdWorklet({
          address: favorite.address as AddressOrEth,
          chainId: ethereumUtils.getChainIdFromNetwork(favorite.network),
        });
        favorite.uniqueId = uniqueId; // v2 unique uses chainId instead of Network
        migratedFavorites[uniqueId] = favorite;
      }
      queryClient.setQueryData(favoritesV2QueryKey, migratedFavorites, { updatedAt: 0 });
      queryClient.setQueryData(favoritesV1QueryKey, undefined); // clear v1 store data
    },
  };
}

export function migrateFavoritesV3(): Migration {
  return {
    name: MigrationName.migrateFavoritesV3,
    async migrate() {
      console.log('MIGRATE V2 TO V3');
      const v2Data = queryClient.getQueryData<Record<UniqueId, RainbowToken>>(favoritesV2QueryKey);
      if (v2Data) {
        queryClient.setQueryData(favoritesQueryKey, v2Data, { updatedAt: 0 });
      }
    },
  };
}
