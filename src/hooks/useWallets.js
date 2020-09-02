import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { findLatestBackUp } from '../model/backup';
import WalletTypes from '@rainbow-me/helpers/walletTypes';

const walletSelector = createSelector(
  ({ wallets: { isWalletLoading, selected = {}, walletNames, wallets } }) => ({
    isWalletLoading,
    selectedWallet: selected,
    walletNames,
    wallets,
  }),
  ({ isWalletLoading, selectedWallet, walletNames, wallets }) => ({
    isWalletLoading,
    latestBackup: findLatestBackUp(wallets) || false,
    selectedWallet,
    walletNames,
    wallets,
  })
);

export default function useWallets() {
  const {
    isWalletLoading,
    latestBackup,
    selectedWallet,
    walletNames,
    wallets,
  } = useSelector(walletSelector);

  return {
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isWalletLoading,
    latestBackup,
    selectedWallet,
    walletNames,
    wallets,
  };
}
