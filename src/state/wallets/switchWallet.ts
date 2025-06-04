import { toChecksumAddress } from '@/handlers/web3';
import { initializeWallet } from '@/state/wallets/initializeWallet';
import { getWallets, setSelectedWallet } from '@/state/wallets/walletsStore';
import { isLowerCaseMatch } from '@/utils';

export const switchWallet = async (address: string): Promise<string | null> => {
  const wallets = getWallets();
  if (!wallets) return null;

  const walletKey = Object.keys(wallets).find(key => {
    return wallets[key].addresses.find(account => isLowerCaseMatch(account.address, address));
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
