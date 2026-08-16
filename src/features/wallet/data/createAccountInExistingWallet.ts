import { initializeWalletProfilePreference } from '@/features/wallet/data/initializeWalletProfilePreference';
import { saveAddress, saveAllWallets, setSelectedWallet } from '@/features/wallet/data/walletKeychain';
import { type RainbowWallet } from '@/features/wallet/types';
import { ensureValidHex } from '@/handlers/web3';
import { generateAccount } from '@/model/wallet';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { addressHashedColorIndex } from '@/utils/profileUtils';

/** Creates and selects the next derived account in an existing wallet, then persists the updated wallet records. */
export async function createAccountInExistingWallet({
  id,
  name,
  color,
}: {
  id: RainbowWallet['id'];
  name: RainbowWallet['name'];
  color: RainbowWallet['color'] | null;
}): Promise<void> {
  const wallet = useWalletsStore.getState().wallets[id];
  if (!wallet) throw new Error(`[createAccountInExistingWallet]: Wallet ${id} not found`);

  const lastIndex = wallet.addresses.reduce((highestIndex, account) => Math.max(highestIndex, account.index), 0);
  const newIndex = lastIndex + 1;
  const account = await generateAccount(id, newIndex);
  if (!account) throw new Error('[createAccountInExistingWallet]: No account generated');

  const walletColorIndex = color ?? addressHashedColorIndex(account.address);
  if (walletColorIndex == null) {
    throw new Error(`[createAccountInExistingWallet]: No wallet color index for ${account.address}`);
  }

  useWalletsStore.setState(state => {
    const updatedWallet: RainbowWallet = {
      ...state.wallets[id],
      addresses: [
        ...state.wallets[id].addresses,
        {
          address: account.address,
          avatar: null,
          color: walletColorIndex,
          index: newIndex,
          label: name,
          visible: true,
        },
      ],
    };

    return {
      accountAddress: ensureValidHex(account.address),
      selected: updatedWallet,
      wallets: {
        ...state.wallets,
        [id]: updatedWallet,
      },
    };
  });

  initializeWalletProfilePreference(account.address, walletColorIndex);

  const { wallets } = useWalletsStore.getState();
  await Promise.all([saveAddress(account.address), setSelectedWallet(wallets[id]), saveAllWallets(wallets)]);
}
