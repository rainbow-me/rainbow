import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { PROFILES, useExperimentalFlag } from '@rainbow-me/config';
import { useWallets } from '@rainbow-me/hooks';
import { getWalletENSAvatars } from '@rainbow-me/redux/wallets';

export default function useWalletENSAvatar() {
  const dispatch = useDispatch();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const { wallets, walletNames, selectedWallet } = useWallets();

  const updateWalletENSAvatars = useCallback(async () => {
    if (!profilesEnabled) return;
    await getWalletENSAvatars(
      { selected: selectedWallet, walletNames, wallets },
      dispatch
    );
  }, [dispatch, profilesEnabled, selectedWallet, walletNames, wallets]);

  return { updateWalletENSAvatars };
}
