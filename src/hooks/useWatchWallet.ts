import { useDeleteWallet, useImportingWallet } from '@/hooks';
import { logger, RainbowError } from '@/logger';
import { cleanUpWalletKeys, RainbowWallet } from '@/model/wallet';
import Routes from '@/navigation/routesNames';
import { setSelectedWallet, useAccountAddress, useWallets } from '@/state/wallets/walletsStore';
import { doesWalletsContainAddress } from '@/utils';
import { Navigation } from '@/navigation';
import { useCallback, useMemo } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { initializeWallet } from '@/state/wallets/initializeWallet';

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
  const wallets = useWallets();

  const watchingWallet = useMemo(() => {
    return Object.values<RainbowWallet>(wallets || {}).find(wallet =>
      (wallet.addresses || []).some(({ address }) => address === primaryAddress)
    );
  }, [primaryAddress, wallets]);
  const isWatching = useMemo(() => Boolean(watchingWallet), [watchingWallet]);

  const deleteWallet = useDeleteWallet({ address: primaryAddress });

  const changeAccount = useCallback(
    async (walletId: string, address: string) => {
      const wallet = (wallets || {})[walletId];
      try {
        await setSelectedWallet(wallet, address);
        await initializeWallet({
          shouldRunMigrations: false,
          overwrite: false,
          switching: true,
        });
      } catch (e) {
        logger.error(new RainbowError(`[useWatchWallet]: error while switching account`, e), {
          error: (e as Error)?.message || 'Unknown error',
        });
      }
    },
    [wallets]
  );

  const accountAddress = useAccountAddress();
  const { isImporting, handleSetSeedPhrase, handlePressImportButton } = useImportingWallet({
    showImportModal,
  });
  const watchWallet = useCallback(async () => {
    if (!isWatching) {
      handleSetSeedPhrase(ensName ?? '');
      await handlePressImportButton({
        forceAddress: ensName,
        avatarUrl: avatarUrl ?? undefined,
      });

      // NOTE: Make sure this is cleaned up due to the ProfileSheet calling this function directly
      if (walletLoadingStore.getState().loadingState) {
        walletLoadingStore.setState({
          loadingState: null,
        });
      }
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
        Navigation.goBack();
        Navigation.handleAction(Routes.WELCOME_SCREEN);
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
    primaryAddress,
    accountAddress,
    changeAccount,
  ]);

  return { isImporting, isWatching, watchWallet };
}
