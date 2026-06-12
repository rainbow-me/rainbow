import { useEffect } from 'react';

import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { TokenLauncher, type SDKConfig } from '@rainbow-me/token-launcher';

const config: SDKConfig = {
  chains: [],
};

TokenLauncher.configure(config);

export function useTokenLauncher() {
  const launcherSupportedChainIds = useBackendNetworksStore(state => state.getTokenLauncherSupportedChainIds());

  useEffect(() => {
    TokenLauncher.configure({
      chains: launcherSupportedChainIds,
    });
  }, [launcherSupportedChainIds]);

  return TokenLauncher;
}

export const TokenLauncherSDK = TokenLauncher;
