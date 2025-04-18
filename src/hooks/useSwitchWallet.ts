import { ensureChecksumAddress } from '@/handlers/web3';
import { RainbowAccount } from '@/model/wallet';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import useInitializeWallet from './useInitializeWallet';

export default function useSwitchWallet() {
  const initializeWallet = useInitializeWallet();
  const wallets = useWalletsStore(state => state.wallets);

  const switchToWalletWithAddress = async (address: string): Promise<string | null> => {
    if (!wallets) return null;

    const walletKey = Object.keys(wallets).find(key => {
      // Addresses
      return wallets[key].addresses.find((account: RainbowAccount) => account.address.toLowerCase() === address.toLowerCase());
    });

    if (!walletKey) return null;

    const { setSelectedWallet } = useWalletsStore.getState();
    setSelectedWallet(wallets[walletKey], ensureChecksumAddress(address));

    return initializeWallet({
      shouldRunMigrations: false,
      overwrite: false,
      switching: true,
    });
  };

  return {
    switchToWalletWithAddress,
  };
}
