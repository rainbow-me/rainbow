import { PROFILES, useExperimentalFlag } from '@/config';
import { useWalletsStore } from '@/redux/wallets';
import { useCallback } from 'react';

export default function useWalletENSAvatar() {
  const walletsStore = useWalletsStore();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const updateWalletENSAvatars = useCallback(async () => {
    if (!profilesEnabled) return;
    await walletsStore.refreshWalletENSAvatars();
  }, [profilesEnabled, walletsStore]);

  return { updateWalletENSAvatars };
}
