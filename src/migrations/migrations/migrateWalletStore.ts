import { Migration, MigrationName } from '@/migrations/types';
import { getSelectedWalletFromKeychain, loadAddress } from '@/model/wallet';
import store from '@/redux/store';
import { loadWallets, setSelectedWallet } from '@/state/wallets/walletsStore';

console.log('hi?', store.getState());

export function migrateWalletStore(): Migration {
  return {
    name: MigrationName.migrateWalletStore,
    async migrate() {
      const previousSelected = await getSelectedWalletFromKeychain();
      const previousAccount = await loadAddress();

      console.log('previousSelected', previousSelected);
      console.log('previousAccount', previousAccount);

      if (previousSelected) {
        await loadWallets();
        if (previousAccount) {
          setSelectedWallet(previousSelected.wallet, previousAccount);
        } else {
          setSelectedWallet(previousSelected.wallet);
        }
      }
    },
  };
}
