import { type Address } from 'viem';

import { type RainbowWallet } from '@/features/wallet/types';
import { ensureValidHex } from '@/handlers/web3';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

/**
 * Selects and persists a visible account. A group ID disambiguates duplicate
 * addresses; address-only callers retain the selected group when it contains
 * the account. Returns null when the account is not in the visible inventory.
 */
export async function switchWallet(address: Address, walletId?: RainbowWallet['id']): Promise<Address | null> {
  const state = useWalletsStore.getState();
  const matches = (account: RainbowWallet['addresses'][number]): boolean => account.visible && isLowerCaseMatch(account.address, address);

  let wallet = walletId === undefined ? state.getSelectedWallet() : state.wallets[walletId];
  let account = wallet?.addresses.find(matches);
  if (walletId === undefined && !account) {
    for (const candidate of Object.values(state.wallets)) {
      account = candidate.addresses.find(matches);
      if (account) {
        wallet = candidate;
        break;
      }
    }
  }
  if (!wallet || !account) return null;

  const accountAddress = ensureValidHex(account.address);
  await state.setSelectedWallet(wallet.id, accountAddress);
  return accountAddress;
}
