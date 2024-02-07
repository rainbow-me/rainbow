import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useDispatch } from 'react-redux';
import { useAccountProfile, useDeleteWallet, useImportingWallet, useInitializeWallet, useWallets } from '@/hooks';
import { cleanUpWalletKeys, RainbowWallet } from '@/model/wallet';
import { addressSetSelected, walletsSetSelected } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import { doesWalletsContainAddress, logger } from '@/utils';

export default function useWatchWallet({
  address: primaryAddress,
  ensName,
  avatarUrl,
  showImportModal = true,
}: {
  address?: string;
  ensName?: string;
  avatarUrl?: string | null;
  showImportModal?: boolean;
}) {
  const dispatch = useDispatch();
  const { goBack, navigate } = useNavigation();
  const { wallets } = useWallets();

  const watchingWallet = useMemo(() => {
    return Object.values<RainbowWallet>(wallets || {}).find(wallet => wallet.addresses.some(({ address }) => address === primaryAddress));
  }, [primaryAddress, wallets]);
  const isWatching = useMemo(() => Boolean(watchingWallet), [watchingWallet]);

  const deleteWallet = useDeleteWallet({ address: primaryAddress });

  const initializeWallet = useInitializeWallet();
  const changeAccount = useCallback(
    async (walletId: string, address: string) => {
      const wallet = wallets![walletId];
      try {
        const p1 = dispatch(walletsSetSelected(wallet));
        const p2 = dispatch(addressSetSelected(address));
        await Promise.all([p1, p2]);

        // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 7.
        initializeWallet(null, null, null, false, false, null, true);
      } catch (e) {
        logger.log('error while switching account', e);
      }
    },
    [dispatch, initializeWallet, wallets]
  );

  const { accountAddress } = useAccountProfile();
  const { isImporting, handleSetSeedPhrase, handlePressImportButton } = useImportingWallet({
    showImportModal,
  });
  const watchWallet = useCallback(async () => {
    if (!isWatching) {
      handleSetSeedPhrase(ensName ?? '');
      handlePressImportButton(null, ensName, null, avatarUrl);
    } else {
      // If there's more than 1 account,
      // it's deletable
      const isLastAvailableWallet = Object.keys(wallets!).find(key => {
        const someWallet = wallets![key];
        const otherAccount = someWallet.addresses.find((account: any) => account.visible && account.address !== accountAddress);
        if (otherAccount) {
          return true;
        }
        return false;
      });
      await deleteWallet();
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      if (!isLastAvailableWallet) {
        await cleanUpWalletKeys();
        goBack();
        navigate(Routes.WELCOME_SCREEN);
      } else {
        // If we're deleting the selected wallet,
        // we need to switch to another one
        if (primaryAddress && primaryAddress === accountAddress) {
          const { wallet: foundWallet, key } =
            doesWalletsContainAddress({
              address: primaryAddress,
              wallets: wallets!,
            }) || {};
          if (foundWallet && key) {
            await changeAccount(key, foundWallet.address);
          }
        }
      }
    }
  }, [
    isWatching,
    handleSetSeedPhrase,
    ensName,
    handlePressImportButton,
    avatarUrl,
    deleteWallet,
    wallets,
    goBack,
    navigate,
    primaryAddress,
    accountAddress,
    changeAccount,
  ]);

  return { isImporting, isWatching, watchWallet };
}
