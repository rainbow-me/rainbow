import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';
import { AppState } from '@/redux/store';

const walletSelector = createSelector(
  ({ wallets: { selected = {} as RainbowWallet, walletNames, wallets } }: AppState) => ({
    selectedWallet: selected,
    walletNames,
    wallets,
  }),
  ({ selectedWallet, walletNames, wallets }) => ({
    selectedWallet,
    walletNames,
    wallets,
  })
);

export default function useWallets() {
  const { selectedWallet, walletNames, wallets } = useSelector(walletSelector);

  return {
    isDamaged: selectedWallet?.damaged,
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isHardwareWallet: !!selectedWallet.deviceId,
    selectedWallet,
    walletNames,
    wallets,
  };
}
