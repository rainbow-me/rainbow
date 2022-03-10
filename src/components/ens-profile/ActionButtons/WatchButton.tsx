import { toLower } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import GradientOutlineButton from '../GradientOutlineButton/GradientOutlineButton';
import { useTheme } from '@rainbow-me/context';
import { ColorModeProvider } from '@rainbow-me/design-system';
import { removeWalletData } from '@rainbow-me/handlers/localstorage/removeWallet';
import {
  useAccountProfile,
  useImportingWallet,
  useInitializeWallet,
  useWallets,
} from '@rainbow-me/hooks';
import {
  addressSetSelected,
  walletsSetSelected,
  walletsUpdate,
} from '@rainbow-me/redux/wallets';
import { logger } from '@rainbow-me/utils';

export default function WatchButton({
  address: primaryAddress,
  ensName,
}: {
  address?: string;
  ensName?: string;
}) {
  const { colors } = useTheme();

  const dispatch = useDispatch();

  const { wallets } = useWallets();

  const [watchingWalletId, watchingWallet] = useMemo(() => {
    return (
      Object.entries(wallets || {}).find(([_, wallet]: [string, any]) =>
        wallet.addresses.some(({ address }: any) => address === primaryAddress)
      ) || ['', '']
    );
  }, [primaryAddress, wallets]);
  const isWatching = useMemo(() => Boolean(watchingWallet), [watchingWallet]);

  const deleteWallet = useCallback(() => {
    const newWallets = {
      ...wallets,
      [watchingWalletId]: {
        ...wallets[watchingWalletId],
        addresses: wallets[
          watchingWalletId
        ].addresses.map((account: { address: string }) =>
          toLower(account.address) === toLower(primaryAddress)
            ? { ...account, visible: false }
            : account
        ),
      },
    };
    // If there are no visible wallets
    // then delete the wallet
    const visibleAddresses = newWallets[watchingWalletId].addresses.filter(
      (account: { visible: boolean }) => account.visible
    );
    if (visibleAddresses.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete newWallets[watchingWalletId];
      dispatch(walletsUpdate(newWallets));
    } else {
      dispatch(walletsUpdate(newWallets));
    }
    removeWalletData(primaryAddress);
  }, [dispatch, primaryAddress, wallets, watchingWalletId]);

  const initializeWallet = useInitializeWallet();
  const changeAccount = useCallback(
    async (walletId, address) => {
      const wallet = wallets[walletId];
      try {
        const p1 = dispatch(walletsSetSelected(wallet));
        const p2 = dispatch(addressSetSelected(address));
        await Promise.all([p1, p2]);

        initializeWallet(null, null, null, false, false, null, true);
      } catch (e) {
        logger.log('error while switching account', e);
      }
    },
    [dispatch, initializeWallet, wallets]
  );

  const { accountAddress } = useAccountProfile();
  const { handleSetSeedPhrase, handlePressImportButton } = useImportingWallet();
  const handlePressWatch = useCallback(async () => {
    if (!isWatching) {
      handleSetSeedPhrase(ensName);
      handlePressImportButton(null, ensName);
    } else {
      deleteWallet();
      // If we're deleting the selected wallet
      // we need to switch to another one
      if (primaryAddress === accountAddress) {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < Object.keys(wallets).length; i++) {
          const key = Object.keys(wallets)[i];
          const someWallet = wallets[key];
          const found = someWallet.addresses.find(
            (account: any) =>
              account.visible && account.address !== primaryAddress
          );

          if (found) {
            await changeAccount(key, found.address);
            break;
          }
        }
      }
    }
  }, [
    isWatching,
    handleSetSeedPhrase,
    ensName,
    handlePressImportButton,
    deleteWallet,
    primaryAddress,
    accountAddress,
    wallets,
    changeAccount,
  ]);

  return (
    <ColorModeProvider value="darkTinted">
      <GradientOutlineButton
        gradient={colors.gradients.blueToGreen}
        onPress={handlePressWatch}
      >
        􀨭 {isWatching ? 'Watching' : 'Watch'}
      </GradientOutlineButton>
    </ColorModeProvider>
  );
}
