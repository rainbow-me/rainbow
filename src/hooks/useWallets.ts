import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';
import { AppState } from '@/redux/store';
import logger from '@/utils/logger';

const walletSelector = createSelector(
  ({ wallets: { isWalletLoading, selected = {} as RainbowWallet, walletNames, wallets } }: AppState) => ({
    isWalletLoading,
    selectedWallet: selected as any,
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

  const isDamaged = selectedWallet?.damaged;

  useEffect(() => {
    if (isDamaged) {
      logger.sentry('Wallet is damaged. Check values below:');
      logger.sentry('selectedWallet: ', selectedWallet);
      logger.sentry('wallets: ', wallets);
    }
  }, [isDamaged, selectedWallet, wallets]);

  return {
    isDamaged,
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isHardwareWallet: !!selectedWallet.deviceId,
    isWalletLoading,
    selectedWallet,
    walletNames,
    wallets,
  };
}
