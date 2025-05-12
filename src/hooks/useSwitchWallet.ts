import { toChecksumAddress } from '@/handlers/web3';
import { RainbowAccount } from '@/model/wallet';
import { setSelectedWallet, useWallets } from '@/state/wallets/walletsStore';
import useInitializeWallet from './useInitializeWallet';

export default function useSwitchWallet() {
  const initializeWallet = useInitializeWallet();
  const wallets = useWallets();

  const switchToWalletWithAddress = async (address: string): Promise<string | null> => {
    if (!wallets) return null;

    const walletKey = Object.keys(wallets).find(key => {
      // Addresses
      return wallets[key].addresses.find((account: RainbowAccount) => account.address.toLowerCase() === address.toLowerCase());
    });
    if (!walletKey) return null;

    const validAddress = toChecksumAddress(address);
    if (!validAddress) return null;

    setSelectedWallet(wallets[walletKey], validAddress);

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 7.
    return initializeWallet(null, null, null, false, false, null, true);
  };

  return {
    switchToWalletWithAddress,
  };
}
