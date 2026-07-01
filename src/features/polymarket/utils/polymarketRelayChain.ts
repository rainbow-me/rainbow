import { type Chain } from 'viem';

import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { RainbowError } from '@/logger';

export function getPolymarketRelayChain(): Chain {
  const chain = useBackendNetworksStore.getState().getDefaultChains()[ChainId.polygon];
  if (!chain) throw new RainbowError('[Polymarket] Polygon chain config is unavailable');
  return chain;
}
