import WalletTypes from '@/helpers/walletTypes';
import {
  useWalletsStore,
  selectIsDamaged,
  selectIsReadOnlyWallet,
  selectIsHardwareWallet,
  selectSelectedWallet,
  selectWalletNames,
  selectWallets,
} from '../redux/wallets';

/**
 * @deprecated Use useWalletsStore with selectors directly instead.
 * Example: const [isDamaged, isReadOnlyWallet] = useWalletsStore(state => [selectIsDamaged(state), selectIsReadOnlyWallet(state)]);
 * Or for a single value: const isDamaged = useWalletsStore(selectIsDamaged);
 */
export default function useWallets() {
  const { selected, walletNames, wallets } = useWalletsStore();

  return {
    isDamaged: selected?.damaged,
    isReadOnlyWallet: selected?.type === WalletTypes.readOnly,
    isHardwareWallet: !!selected?.deviceId,
    selectedWallet: selected,
    walletNames,
    wallets,
  };
}
