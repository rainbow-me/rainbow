import { destroyStore } from '@storesjs/stores';

import { getRemoteConfig } from '@/features/config/stores/remoteConfig';
import { isPreparedCallsExecutionSponsored } from '@/features/delegation/calls';
import { createDepositPreparedCallsStore, getDepositPreparedCalls } from '@/systems/funding/execution/depositPreparedCallsStore';
import { type DepositRuntimeExtensions } from '@/systems/funding/types';

import { POLYMARKET_DEPOSIT_CONFIG } from '../depositConfig';

// ============ Runtime Extensions =========================================== //

export function createPolymarketDepositRuntimeExtensions(): DepositRuntimeExtensions {
  return {
    createSponsoredExecution: ({ useQuoteStore }) => {
      const preparedDepositStore = createDepositPreparedCallsStore({
        config: POLYMARKET_DEPOSIT_CONFIG,
        readCurrentQuote: () => useQuoteStore.getState().getData(),
      });

      return {
        cleanup: () => {
          destroyStore(preparedDepositStore, { clearQueryCache: true });
        },
        gas: {
          isSponsored: async params => {
            if (!getRemoteConfig().sponsored_polymarket_deposits_enabled) return false;
            const preparedCalls = await getDepositPreparedCalls(preparedDepositStore, params);
            return isPreparedCallsExecutionSponsored(preparedCalls);
          },
        },
        sponsoredExecution: {
          getPreparedCalls: params => {
            if (!getRemoteConfig().sponsored_polymarket_deposits_enabled) return Promise.resolve(null);
            return getDepositPreparedCalls(preparedDepositStore, params);
          },
        },
      };
    },
  };
}
