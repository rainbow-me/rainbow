import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { createDerivedStore } from '@/state/internal/createDerivedStore';

export const usePolymarketProxyAddress = createDerivedStore(
  $ => {
    return $(usePolymarketClients).proxyAddress;
  },
  { fastMode: true }
);
