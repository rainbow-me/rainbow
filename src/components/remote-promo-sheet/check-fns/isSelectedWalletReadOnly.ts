import store from '@/redux/store';
import WalletTypes from '@/helpers/walletTypes';

export const isSelectedWalletReadOnly = (): boolean => {
  const { selected } = store.getState().wallets;

  // if no selected wallet, we will treat it as a read-only wallet
  if (!selected || selected.type === WalletTypes.readOnly) {
    return true;
  }

  return false;
};
