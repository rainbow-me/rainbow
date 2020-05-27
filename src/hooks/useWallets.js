import { useSelector } from 'react-redux';
import WalletTypes from '../helpers/walletTypes';

export default function useWallets() {
  const { selectedWallet, walletNames, wallets } = useSelector(
    ({ wallets: { selected, walletNames, wallets } }) => ({
      selectedWallet: selected || {},
      walletNames,
      wallets,
    })
  );

  return {
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    selectedWallet,
    walletNames,
    wallets,
  };
}
