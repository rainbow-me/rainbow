import { useSelector } from 'react-redux';
import WalletTypes from '../helpers/walletTypes';

export default function useWallets() {
  const {
    isCreatingAccount,
    selectedWallet,
    walletNames,
    wallets,
  } = useSelector(
    ({ wallets: { isCreatingAccount, selected, walletNames, wallets } }) => ({
      isCreatingAccount,
      selectedWallet: selected || {},
      walletNames,
      wallets,
    })
  );

  return {
    isCreatingAccount,
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    selectedWallet,
    walletNames,
    wallets,
  };
}
