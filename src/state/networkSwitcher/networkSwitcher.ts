import { ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '../internal/createRainbowStore';
import { analyticsV2 } from '@/analytics';
import { nonceStore } from '@/state/nonces';

function getMostUsedChains() {
  const noncesByAddress = nonceStore.getState().nonces;
  const summedNoncesByChainId: Record<string, number> = {};
  for (const addressNonces of Object.values(noncesByAddress)) {
    for (const [chainId, { currentNonce }] of Object.entries(addressNonces)) {
      summedNoncesByChainId[chainId] ??= 0;
      summedNoncesByChainId[chainId] += currentNonce || 0;
    }
  }

  return Object.entries(summedNoncesByChainId)
    .sort((a, b) => b[1] - a[1])
    .map(([chainId]) => parseInt(chainId));
}

export const networkSwitcherStore = createRainbowStore<{
  pinnedNetworks: ChainId[];
}>(() => ({ pinnedNetworks: getMostUsedChains().slice(0, 5) }), {
  storageKey: 'network-switcher',
  version: 0,
  onRehydrateStorage(state) {
    // if we are missing pinned networks, use the user most used chains
    if (state.pinnedNetworks.length === 0) {
      const mostUsedNetworks = getMostUsedChains();
      state.pinnedNetworks = mostUsedNetworks.slice(0, 5);
      analyticsV2.identify({ mostUsedNetworks: mostUsedNetworks.filter(Boolean) });
    }
  },
});

export const customizeNetworksBannerStore = createRainbowStore<{
  dismissedAt: number; // timestamp
}>(() => ({ dismissedAt: 0 }), {
  storageKey: 'CustomizeNetworksBanner',
  version: 0,
});

const twoWeeks = 1000 * 60 * 60 * 24 * 7 * 2;
export const shouldShowCustomizeNetworksBanner = (dismissedAt: number) => Date.now() - dismissedAt > twoWeeks;
export const dismissCustomizeNetworksBanner = () => {
  customizeNetworksBannerStore.setState({ dismissedAt: Date.now() });
};
export const showCustomizeNetworksBanner = shouldShowCustomizeNetworksBanner(customizeNetworksBannerStore.getState().dismissedAt);
