import { PROFILES, useExperimentalFlag } from '@/config';
import { refreshWalletENSAvatars } from '@/redux/wallets';
import { useCallback } from 'react';

export default function useWalletENSAvatar() {
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const updateWalletENSAvatars = useCallback(async () => {
    if (!profilesEnabled) return;
    await refreshWalletENSAvatars();
  }, [profilesEnabled]);

  return { updateWalletENSAvatars };
}
