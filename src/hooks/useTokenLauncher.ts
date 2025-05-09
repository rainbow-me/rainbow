import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { TokenLauncher as TL, SDKConfig as TokenLauncherConfig } from '@rainbow-me/token-launcher';
import { useEffect } from 'react';
import { TOKEN_LAUNCHER_URL, TOKEN_LAUNCHER_API_KEY } from 'react-native-dotenv';

const config: TokenLauncherConfig = {
  SUPPORTED_NETWORKS: [],
  API_URL_PROD: TOKEN_LAUNCHER_URL,
  API_KEY_PROD: TOKEN_LAUNCHER_API_KEY,
  MODE: 'production',
};

TL.configure(config);

export function useTokenLauncher(): typeof TokenLauncherSDK {
  const launcherSupportedChains = useBackendNetworksStore(state => state.getTokenLauncherSupportedChainInfo());
  useEffect(() => {
    TL.configure({
      SUPPORTED_NETWORKS: launcherSupportedChains,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launcherSupportedChains]);

  return TL;
}

export const TokenLauncherSDK = TL;
