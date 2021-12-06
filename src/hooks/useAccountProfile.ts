import { useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/accountInf... Remove this comment to see the full error message
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
