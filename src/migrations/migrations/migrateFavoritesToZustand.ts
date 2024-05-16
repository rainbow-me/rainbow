import { EthereumAddress } from '@rainbow-me/swaps';
import { Migration, MigrationName } from '../types';
import { RainbowToken } from '@/entities';
import { queryClient } from '@/react-query';
import { favoritesQueryKey } from '@/resources/favorites';
import { Hex } from 'viem';
import { userAssetsStore } from '@/state/assets/userAssets';

export function migrateFavoritesToZustand(): Migration {
  return {
    name: MigrationName.migrateFavoritesToZustand,
    async migrate() {
      const favorites = queryClient.getQueryData<Record<EthereumAddress, RainbowToken>>(favoritesQueryKey);

      if (favorites) {
        const favoriteAddresses: Hex[] = [];
        Object.keys(favorites).forEach((address: string) => {
          favoriteAddresses.push(address as Hex);
        });

        userAssetsStore.setState({
          favorites: new Set(favoriteAddresses),
        });
      }
    },
  };
}
