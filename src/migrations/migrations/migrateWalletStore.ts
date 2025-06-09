import { Migration, MigrationName } from '@/migrations/types';
import { getSelectedWalletFromKeychain } from '@/model/wallet';
import store from '@/redux/store';
import { loadWallets, setSelectedWallet } from '@/state/wallets/walletsStore';

console.log('hi?', store.getState());

export function migrateWalletStore(): Migration {
  return {
    name: MigrationName.migrateWalletStore,
    async migrate() {
      const previousSelected = await getSelectedWalletFromKeychain();
      // @ts-expect-error: this has been removed but should still be persisted
      const previousAccount = store.getState().settings['accountAddress'] as string | undefined;

      console.log('previousSelected', previousSelected);
      console.log('previousAccount', previousAccount);

      if (previousSelected) {
        await loadWallets();
        setSelectedWallet(previousSelected.wallet, previousAccount);
      }
    },
  };
}
