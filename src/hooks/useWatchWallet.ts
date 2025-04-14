import { useDeleteWallet, useImportingWallet, useInitializeWallet } from '@/hooks';
import { logger, RainbowError } from '@/logger';
import { cleanUpWalletKeys, RainbowWallet } from '@/model/wallet';
import Routes from '@/navigation/routesNames';
import { setSelectedAddress, setSelectedWallet, useAccountProfileInfo, useWalletsStore } from '@/state/wallets/walletsStore';
import { doesWalletsContainAddress } from '@/utils';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

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
  const { goBack, navigate } = useNavigation();
  const wallets = useWalletsStore(state => state.wallets);

  const watchingWallet = useMemo(() => {
    return Object.values<RainbowWallet>(wallets || {}).find(wallet =>
      (wallet.addresses || []).some(({ address }) => address === primaryAddress)
    );
  }, [primaryAddress, wallets]);
  const isWatching = useMemo(() => Boolean(watchingWallet), [watchingWallet]);

  const deleteWallet = useDeleteWallet({ address: primaryAddress });

  const initializeWallet = useInitializeWallet();
  const changeAccount = useCallback(
    async (walletId: string, address: string) => {
      const wallet = (wallets || {})[walletId];
      try {
        setSelectedWallet(wallet);
        setSelectedAddress(address);

        // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 7.
        initializeWallet(null, null, null, false, false, null, true);
      } catch (e) {
        logger.error(new RainbowError(`[useWatchWallet]: error while switching account`), {
          error: (e as Error)?.message || 'Unknown error',
        });
      }
    },
    [initializeWallet, wallets]
  );

  const { accountAddress } = useAccountProfileInfo();
  const { isImporting, handleSetSeedPhrase, handlePressImportButton } = useImportingWallet({
    showImportModal,
  });
  const watchWallet = useCallback(async () => {
    if (!isWatching) {
      handleSetSeedPhrase(ensName ?? '');
      handlePressImportButton({
        forceAddress: ensName,
        avatarUrl: avatarUrl ?? undefined,
      });
    } else {
      // If there's more than 1 account,
      // it's deletable
      const isLastAvailableWallet = Object.keys(wallets || {}).find(key => {
        const someWallet = (wallets || {})[key];
        const otherAccount = someWallet.addresses?.find(account => account.visible && account.address !== accountAddress);
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
              wallets: wallets || {},
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
