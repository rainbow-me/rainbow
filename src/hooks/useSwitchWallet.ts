import { useDispatch } from 'react-redux';
import { addressSetSelected, walletsSetSelected } from '../redux/wallets';
import useInitializeWallet from './useInitializeWallet';
import { toChecksumAddress } from '@/handlers/web3';
import { RainbowAccount } from '@/model/wallet';
import useWallets from './useWallets';

export default function useSwitchWallet() {
  const initializeWallet = useInitializeWallet();
  const dispatch = useDispatch();
  const { wallets } = useWallets();

  const switchToWalletWithAddress = async (address: string): Promise<string | null> => {
    const walletKey = Object.keys(wallets!).find(key => {
      // Addresses
      return wallets![key].addresses.find((account: RainbowAccount) => account.address.toLowerCase() === address.toLowerCase());
    });

    if (!walletKey) return null;
    const p1 = dispatch(walletsSetSelected(wallets![walletKey]));
    const p2 = dispatch(addressSetSelected(toChecksumAddress(address)!));
    await Promise.all([p1, p2]);
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 7.
    return initializeWallet(null, null, null, false, false, null, true);
  };

  return {
    switchToWalletWithAddress,
  };
}
