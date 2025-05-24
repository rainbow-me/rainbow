import { toChecksumAddress } from '@/handlers/web3';
import { RainbowAccount } from '@/model/wallet';
import { initializeWallet } from '@/state/wallets/initializeWallet';
import { getWallets, setSelectedWallet } from '@/state/wallets/walletsStore';

export const switchWallet = async (address: string): Promise<string | null> => {
  const wallets = getWallets();
  if (!wallets) return null;

  const walletKey = Object.keys(wallets).find(key => {
    // Addresses
    return wallets[key].addresses.find((account: RainbowAccount) => account.address.toLowerCase() === address.toLowerCase());
  });
  if (!walletKey) return null;

  const validAddress = toChecksumAddress(address);
  if (!validAddress) return null;

  setSelectedWallet(wallets[walletKey], validAddress);

  return initializeWallet({
    shouldRunMigrations: false,
    overwrite: false,
    switching: true,
  });
};
