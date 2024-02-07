import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { findLatestBackUp } from '../model/backup';
import { addressSetSelected, walletsSetSelected } from '../redux/wallets';
import useInitializeWallet from './useInitializeWallet';
import { toChecksumAddress } from '@/handlers/web3';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowAccount, RainbowWallet } from '@/model/wallet';
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
    latestBackup: findLatestBackUp(wallets),
    selectedWallet,
    walletNames,
    wallets,
  })
);

export default function useWallets() {
  const initializeWallet = useInitializeWallet();
  const dispatch = useDispatch();
  const { isWalletLoading, latestBackup, selectedWallet, walletNames, wallets } = useSelector(walletSelector);

  const isDamaged = useMemo(() => {
    const bool = selectedWallet?.damaged;
    if (bool) {
      logger.sentry('Wallet is damaged. Check values below:');
      logger.sentry('selectedWallet: ', selectedWallet);
      logger.sentry('wallets: ', wallets);
    }
    return bool;
  }, [selectedWallet, wallets]);

  const switchToWalletWithAddress = async (address: string): Promise<string | null> => {
    const walletKey = Object.keys(wallets!).find(key => {
      // Addresses
      return wallets![key].addresses.find((account: RainbowAccount) => account.address.toLowerCase() === address.toLowerCase());
    });

    if (!walletKey) return null;
    const p1 = dispatch(walletsSetSelected(wallets![walletKey]));
    const p2 = dispatch(addressSetSelected(toChecksumAddress(address)!));
    await Promise.all([p1, p2]);
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 7.
    return initializeWallet(null, null, null, false, false, null, true);
  };

  return {
    isDamaged,
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isHardwareWallet: !!selectedWallet.deviceId,
    isWalletLoading,
    latestBackup,
    selectedWallet,
    switchToWalletWithAddress,
    walletNames,
    wallets,
  };
}
