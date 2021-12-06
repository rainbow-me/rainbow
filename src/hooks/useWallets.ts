import { toLower } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { findLatestBackUp } from '../model/backup';
import {
  addressSetSelected,
  setIsWalletLoading as rawSetIsWalletLoading,
  walletsSetSelected,
} from '../redux/wallets';
import useInitializeWallet from './useInitializeWallet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { toChecksumAddress } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletType... Remove this comment to see the full error message
import WalletTypes from '@rainbow-me/helpers/walletTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

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
  const initializeWallet = useInitializeWallet();
  const dispatch = useDispatch();
  const {
    isWalletLoading,
    latestBackup,
    selectedWallet,
    walletNames,
    wallets,
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'OutputParametricSelector<{ walle... Remove this comment to see the full error message
  } = useSelector(walletSelector);

  const setIsWalletLoading = useCallback(
    isLoading => dispatch(rawSetIsWalletLoading(isLoading)),
    [dispatch]
  );

  const isDamaged = useMemo(() => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'damaged' does not exist on type '{}'.
    const bool = selectedWallet?.damaged;
    if (bool) {
      logger.sentry('Wallet is damaged. Check values below:');
      logger.sentry('selectedWallet: ', selectedWallet);
      logger.sentry('wallets: ', wallets);
    }
    return bool;
  }, [selectedWallet, wallets]);

  const switchToWalletWithAddress = async (address: any) => {
    const walletKey = Object.keys(wallets).find(key => {
      // Addresses
      return wallets[key].addresses.find(
        (account: any) => toLower(account.address) === toLower(address)
      );
    });

    if (!walletKey) return;
    const p1 = dispatch(walletsSetSelected(wallets[walletKey]));
    const p2 = dispatch(addressSetSelected(toChecksumAddress(address)));
    await Promise.all([p1, p2]);
    return initializeWallet(null, null, null, false, false, null, true);
  };

  return {
    isDamaged,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
    isReadOnlyWallet: selectedWallet.type === WalletTypes.readOnly,
    isWalletLoading,
    latestBackup,
    selectedWallet,
    setIsWalletLoading,
    switchToWalletWithAddress,
    walletNames,
    wallets,
  };
}
