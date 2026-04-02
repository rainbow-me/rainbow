import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { TokenLauncher, type SDKConfig } from '@rainbow-me/token-launcher';
import { useEffect } from 'react';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launcherSupportedChainIds]);

  return TokenLauncher;
}

export const TokenLauncherSDK = TokenLauncher;
