import { useCallback, useMemo } from 'react';

import { triggerHaptics } from 'react-native-turbo-haptics';

import { type RainbowWallet } from '@/features/wallet/types';
import { ensureValidHex } from '@/handlers/web3';
import useImportingWallet from '@/hooks/useImportingWallet';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { useWallets, useWalletsStore } from '@/state/wallets/walletsStore';

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
}): { isImporting: boolean; isWatching: boolean; watchWallet: () => Promise<void> } {
  const { goBack, navigate } = useNavigation();
  const wallets = useWallets();

  const watchingWallet = useMemo(() => {
    return Object.values<RainbowWallet>(wallets || {}).find(wallet =>
      (wallet.addresses || []).some(({ address }) => address === primaryAddress)
    );
  }, [primaryAddress, wallets]);
  const isWatching = useMemo(() => Boolean(watchingWallet), [watchingWallet]);

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
      if (!watchingWallet || !primaryAddress) return;
      const previous = useWalletsStore.getState();
      await previous.removeAccount(watchingWallet.id, ensureValidHex(primaryAddress));
      const current = useWalletsStore.getState();
      triggerHaptics('notificationSuccess');
      if (!current.getSelectedWallet()) {
        goBack();
        navigate(Routes.WELCOME_SCREEN);
      }
    }
  }, [isWatching, handleSetSeedPhrase, ensName, handlePressImportButton, avatarUrl, goBack, navigate, primaryAddress, watchingWallet]);

  return { isImporting, isWatching, watchWallet };
}
