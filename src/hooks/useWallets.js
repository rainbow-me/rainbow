import { useSelector } from 'react-redux';
import WalletTypes from '../helpers/walletTypes';

export default function useWallets() {
  const { selectedWallet, wallets } = useSelector(
    ({ wallets: { selected, wallets } }) => ({
      selectedWallet: selected || {},
      wallets,
    })
  );

  return {
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    selectedWallet,
    wallets,
  };
}
