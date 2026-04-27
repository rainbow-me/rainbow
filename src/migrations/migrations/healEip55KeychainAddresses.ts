import { normalizeAddress } from '@/features/address/core/address';
import { MigrationName, type Migration } from '@/migrations/types';
import { getAllWallets, loadAddress, saveAddress, saveAllWallets } from '@/model/wallet';

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
      const storedAddress = await loadAddress();
      if (storedAddress) {
        const normalized = normalizeAddress(storedAddress);
        if (normalized && normalized !== storedAddress) {
          await saveAddress(normalized);
        }
      }

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
    },
  };
}
