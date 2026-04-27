import { createDerivedStore } from '@storesjs/stores';

import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';

export const usePolymarketProxyAddress = createDerivedStore(
  $ => {
    return $(usePolymarketClients).proxyAddress;
  },
  { lockDependencies: true }
);
