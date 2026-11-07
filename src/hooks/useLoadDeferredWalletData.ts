import { useEffect } from 'react';
import { InteractionManager } from 'react-native';

import { prefetchRnbwStakingPosition } from '@/features/rnbw-staking/utils/prefetchRnbwStakingPosition';
import useLoadGlobalLateData from '@/hooks/useLoadGlobalLateData';

import { getIsReadOnlyWallet, useAccountAddress, useWalletsStore } from '../state/wallets/walletsStore';

export const useLoadDeferredWalletData = () => {
  const accountAddress = useAccountAddress();
  const loadGlobalLateData = useLoadGlobalLateData();
  const walletReady = useWalletsStore(state => state.walletReady);

  useEffect(() => {
    if (walletReady) {
      requestIdleCallback(() => {
        InteractionManager.runAfterInteractions(() => {
          if (!getIsReadOnlyWallet()) void prefetchRnbwStakingPosition();
          loadGlobalLateData();
        });
      });
    }
  }, [accountAddress, loadGlobalLateData, walletReady]);
};
