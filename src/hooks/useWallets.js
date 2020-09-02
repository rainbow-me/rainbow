import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { findLatestBackUp } from '../model/backup';
import WalletTypes from '@rainbow-me/helpers/walletTypes';

export default function useWallets() {
  const { isWalletLoading, selectedWallet, walletNames, wallets } = useSelector(
    ({ wallets: { isWalletLoading, selected, walletNames, wallets } }) => ({
      isWalletLoading,
      selectedWallet: selected || {},
      walletNames,
      wallets,
    })
  );

  const latestBackup = useMemo(() => {
    return findLatestBackUp(wallets) || false;
  }, [wallets]);

  return {
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isWalletLoading,
    latestBackup,
    selectedWallet,
    walletNames,
    wallets,
  };
}
