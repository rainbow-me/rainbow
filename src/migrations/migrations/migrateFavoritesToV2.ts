import { AddressOrEth, UniqueId } from '@/__swaps__/types/assets';
import { getStandardizedUniqueIdWorklet } from '@/__swaps__/utils/swaps';
import { EthereumAddress, RainbowToken } from '@/entities';
import { createQueryKey, queryClient } from '@/react-query';
import { favoritesQueryKey } from '@/resources/favorites';
import { ethereumUtils } from '@/utils';
import { Migration, MigrationName } from '../types';

export function migrateFavoritesToV2(): Migration {
  return {
    name: MigrationName.migrateFavoritesToV2,
    async migrate() {
      // v1 used just the address as key, v2 uses uniqueId as key and builds this uniqueId with ChainId instead of Network
      const favoritesV1QueryKey = createQueryKey('favorites', {}, { persisterVersion: 1 });
      const v1Data = queryClient.getQueryData<Record<EthereumAddress, RainbowToken>>(favoritesV1QueryKey);
      if (v1Data) {
        const migratedFavorites: Record<UniqueId, RainbowToken> = {};
        for (const favorite of Object.values(v1Data)) {
          const uniqueId = getStandardizedUniqueIdWorklet({
            address: favorite.address as AddressOrEth,
            chainId: ethereumUtils.getChainIdFromNetwork(favorite.network),
          });
          favorite.uniqueId = uniqueId; // v2 unique uses chainId instead of Network
          migratedFavorites[uniqueId] = favorite;
        }
        queryClient.setQueryData(favoritesQueryKey, migratedFavorites);
        queryClient.setQueryData(favoritesV1QueryKey, undefined); // clear v1 store data
      }
    },
  };
}
