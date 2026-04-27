import { createBaseStore, type PersistConfig } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';
import { type ChainId } from '@/state/backendNetworks/types';

import { type BalanceQueryStore, type WithdrawalConfig, type WithdrawalStoreState, type WithdrawalStoreType } from '../types';

// ============ Store Factory ================================================== //

export function createWithdrawalStore(config: WithdrawalConfig<BalanceQueryStore>): WithdrawalStoreType {
  return createBaseStore<WithdrawalStoreState>(
    set => ({
      isSubmitting: false,
      selectedChainId: resolveDefaultChain(config),

      setIsSubmitting: (isSubmitting: boolean) =>
        set(state => {
          if (state.isSubmitting === isSubmitting) return state;
          return { isSubmitting };
        }),

      setSelectedChainId: (chainId: ChainId) =>
        set(state => {
          if (state.selectedChainId === chainId) return state;
          return { selectedChainId: chainId };
        }),
    }),

    buildPersistConfig(config)
  );
}

// ============ Helpers ======================================================== //

function buildPersistConfig(config: WithdrawalConfig<BalanceQueryStore>): PersistConfig<WithdrawalStoreState> | undefined {
  if (!config.route?.to.persistSelectedChain) return undefined;
  return {
    partialize: state => ({ selectedChainId: state.selectedChainId }),
    persistThrottleMs: time.seconds(1),
    storageKey: `${config.id}-withdrawalStore`,
  };
}

function resolveDefaultChain(config: WithdrawalConfig<BalanceQueryStore>): ChainId | undefined {
  const defaultChain = config.route?.to.defaultChain;
  return typeof defaultChain === 'function' ? defaultChain() : defaultChain;
}
