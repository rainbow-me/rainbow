import { Migration, MigrationName } from '../types';
import store from '@/redux/store';
import { queryClient } from '@/react-query';
import { nftsQueryKey } from '@/resources/nfts';

export function deleteNFTsReactQueryCache(): Migration {
  return {
    name: MigrationName.deleteNFTsReactQueryCache,
    async migrate() {
      const { wallets } = store.getState().wallets;

      const walletAddresses = wallets ? Object.values(wallets).flatMap(wallet => wallet.addresses.map(account => account.address)) : [];

      walletAddresses.forEach(address => queryClient.resetQueries(nftsQueryKey({ address })));
    },
  };
}
