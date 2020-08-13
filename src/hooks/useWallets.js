import { useSelector } from 'react-redux';
import WalletTypes from '../helpers/walletTypes';
import { findLatestBackUp } from '../model/wallet';

export default function useWallets() {
  const { isWalletLoading, selectedWallet, walletNames, wallets } = useSelector(
    ({ wallets: { isWalletLoading, selected, walletNames, wallets } }) => ({
      isWalletLoading,
      selectedWallet: selected || {},
      walletNames,
      wallets,
    })
  );

  const latestBackup = findLatestBackUp(wallets) || false;

  return {
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isWalletLoading,
    latestBackup,
    selectedWallet,
    walletNames,
    wallets,
  };
}
