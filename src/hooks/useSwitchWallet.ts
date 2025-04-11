import { toChecksumAddress } from '@/handlers/web3';
import { RainbowAccount } from '@/model/wallet';
import { useWalletsStore } from '../redux/wallets';
import useInitializeWallet from './useInitializeWallet';

export default function useSwitchWallet() {
  const initializeWallet = useInitializeWallet();
  const wallets = useWalletsStore(state => state.wallets);

  const switchToWalletWithAddress = async (address: string): Promise<string | null> => {
    const walletKey = Object.keys(wallets!).find(key => {
      // Addresses
      return wallets![key].addresses.find((account: RainbowAccount) => account.address.toLowerCase() === address.toLowerCase());
    });

    if (!walletKey) return null;
    useWalletsStore.getState().setSelectedWallet(wallets![walletKey]);
    useWalletsStore.getState().setSelectedAddress(toChecksumAddress(address)!);
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 7.
    return initializeWallet(null, null, null, false, false, null, true);
  };

  return {
    switchToWalletWithAddress,
  };
}
