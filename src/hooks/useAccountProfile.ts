import { useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';

export default function useAccountProfile() {
  const wallets = useWallets();
  const { selectedWallet, walletNames } = wallets;
  const {
    accountAddress: accountsettingsAddress,
    network,
  } = useAccountSettings();

  const {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  } = useMemo(
    () =>
      getAccountProfileInfo(
        selectedWallet,
        walletNames,
        network,
        accountsettingsAddress
      ),
    [accountsettingsAddress, network, selectedWallet, walletNames]
  );

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
}
