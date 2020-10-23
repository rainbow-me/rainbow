import { isEmpty } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { findLatestBackUp } from '../model/backup';
import { setIsWalletLoading as rawSetIsWalletLoading } from '../redux/wallets';
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
  const dispatch = useDispatch();
  const {
    isWalletLoading,
    latestBackup,
    selectedWallet,
    walletNames,
    wallets,
  } = useSelector(walletSelector);

  const setIsWalletLoading = useCallback(
    isLoading => dispatch(rawSetIsWalletLoading(isLoading)),
    [dispatch]
  );

  const isDamaged = useMemo(() => {
    return isEmpty(selectedWallet) || !wallets || selectedWallet?.damaged;
  }, [selectedWallet, wallets]);

  return {
    isDamaged,
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isWalletLoading,
    latestBackup,
    selectedWallet,
    setIsWalletLoading,
    walletNames,
    wallets,
  };
}
