import { normalizeAddress } from '@/features/address/core/address';
import { MigrationName, type Migration } from '@/migrations/types';
import { getAllWallets, getSelectedWallet, loadAddress, saveAddress, saveAllWallets, setSelectedWallet } from '@/model/wallet';

/**
 * One-shot heal: canonicalize EIP-55 addresses persisted in keychain.
 *
 * The watched-wallet import flow previously accepted addresses without enforcing EIP-55 checksum,
 * so non-canonical addresses could end up persisted as if they were valid (APP-3673). This
 * migration canonicalizes any such entries so downstream consumers receive properly-formed
 * addresses regardless of how the data originally got written.
 */
export function healEip55KeychainAddresses(): Migration {
  return {
    name: MigrationName.healEip55KeychainAddresses,
    async migrate() {
      // `addressKey`: source of truth for the active address. `loadWallets` reads this and writes
      // it into the Zustand store on every boot. If left non-canonical here, the in-memory state
      // would be re-polluted on every launch even after the MMKV-side migration ran.
      const storedAddress = await loadAddress();
      if (storedAddress) {
        const normalized = normalizeAddress(storedAddress);
        if (normalized && normalized !== storedAddress) {
          await saveAddress(normalized);
        }
      }

      // `allWalletsKey`: source of truth for the full wallets map. `loadWallets` reads this and
      // hydrates `state.wallets`, which powers the wallet switcher and any address-based UI lookup.
      // Same re-pollution concern as above if left bad-case.
      const result = await getAllWallets();
      if (result?.wallets) {
        let changed = false;
        for (const wallet of Object.values(result.wallets)) {
          for (const account of wallet.addresses || []) {
            const normalized = normalizeAddress(account.address);
            if (normalized && normalized !== account.address) {
              account.address = normalized;
              changed = true;
            }
          }
        }
        if (changed) {
          await saveAllWallets(result.wallets);
        }
      }

      // `selectedWalletKey`: separate keychain entry holding a snapshot of the active wallet.
      // `loadWallets` reads this independently and assigns it to `state.selected`. Without healing
      // it here, the wallet switcher / account header would still surface bad-case addresses on
      // next boot, even though the wallets map and active address are clean.
      const selectedWalletData = await getSelectedWallet();
      if (selectedWalletData?.wallet) {
        let changed = false;
        for (const account of selectedWalletData.wallet.addresses || []) {
          const normalized = normalizeAddress(account.address);
          if (normalized && normalized !== account.address) {
            account.address = normalized;
            changed = true;
          }
        }
        if (changed) {
          await setSelectedWallet(selectedWalletData.wallet);
        }
      }
    },
  };
}
