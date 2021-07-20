import { useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';

export default function useAccountProfile() {
  const wallets = useWallets();
  const { selectedWallet, walletNames } = wallets;
  const { accountAddress, network } = useAccountSettings();
  return useMemo(() => {
    return getAccountProfileInfo(
      selectedWallet,
      walletNames,
      network,
      accountAddress
    );
  }, [accountAddress, network, walletNames, selectedWallet]);
}
