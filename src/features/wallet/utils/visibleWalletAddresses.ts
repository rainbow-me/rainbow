import { type AllRainbowWallets } from '@/features/wallet/types';
import { getConsistentArray } from '@/helpers/getConsistentArray';
import WalletTypes from '@/helpers/walletTypes';

/** Lowercased addresses of visible accounts, split into owned and watched (read-only) wallets. */
export function getVisibleWalletAddresses(wallets: AllRainbowWallets | null): { owned: string[]; watched: string[] } {
  const owned: string[] = [];
  const watched: string[] = [];

  for (const wallet of Object.values(wallets || {})) {
    const target = wallet.type === WalletTypes.readOnly ? watched : owned;
    for (const account of wallet.addresses || []) {
      if (account.visible) target.push(account.address.toLowerCase());
    }
  }

  return { owned: getConsistentArray(owned), watched: getConsistentArray(watched) };
}
