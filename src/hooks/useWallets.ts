import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';
import { AppState } from '@/redux/store';

const walletSelector = createSelector(
  ({ wallets: { isWalletLoading, selected = {} as RainbowWallet, walletNames, wallets } }: AppState) => ({
    isWalletLoading,
    selectedWallet: selected,
    walletNames,
    wallets,
  }),
  ({ isWalletLoading, selectedWallet, walletNames, wallets }) => ({
    isWalletLoading,
    selectedWallet,
    walletNames,
    wallets,
  })
);

export default function useWallets() {
  const { isWalletLoading, selectedWallet, walletNames, wallets } = useSelector(walletSelector);

  return {
    isDamaged: selectedWallet?.damaged,
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isHardwareWallet: !!selectedWallet.deviceId,
    isWalletLoading,
    selectedWallet,
    walletNames,
    // TODO: Revert this before merge:
    // wallets,
    wallets: Object.fromEntries(Object.entries(wallets || {}).map(([key, wallet]) => [key, { ...wallet, damaged: true }])),
  };
}
