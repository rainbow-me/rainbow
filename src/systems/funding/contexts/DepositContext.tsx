import React, { createContext, useContext, type ReactNode } from 'react';

import { createStoreActions } from '@storesjs/stores';

import { type ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { type GasSpeed } from '@/features/gas/types/gasSpeed';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';

import { useDepositController } from '../hooks/useDepositController';
import { useDepositHandler } from '../hooks/useDepositHandler';
import { createDepositAmountStore } from '../stores/createAmountStore';
import { createDepositGasStores } from '../stores/createDepositGasStores';
import { createDepositQuoteStore } from '../stores/createDepositQuoteStore';
import { computeMaxSwappableAmount, createDepositStore } from '../stores/createDepositStore';
import { createAmountToReceiveStore } from '../stores/derived/createAmountToReceiveStore';
import {
  type DepositConfig,
  type DepositContextType,
  type DepositRuntimeExtensions,
  type DepositRuntimeStores,
  type FundingScreenTheme,
} from '../types';

// ============ Context ======================================================= //

const DepositContext = createContext<DepositContextType | null>(null);

// ============ Provider ====================================================== //

type DepositProviderProps = {
  children: ReactNode;
  config: DepositConfig;
  initialAsset: ExtendedAnimatedAssetWithColors | null;
  initialGasSpeed: GasSpeed;
  runtimeExtensions?: DepositRuntimeExtensions;
  theme: FundingScreenTheme;
};

export function DepositProvider({
  children,
  config,
  initialAsset,
  initialGasSpeed,
  runtimeExtensions,
  theme,
}: DepositProviderProps): React.ReactElement {
  const stores = useStableValue(() => {
    const useAmountStore = createDepositAmountStore(initialAsset, config.initialSliderProgress);
    const useDepositStore = createDepositStore(config, initialAsset, initialGasSpeed);
    const useQuoteStore = createDepositQuoteStore(config, useAmountStore, useDepositStore);
    const { cleanup: cleanupSponsoredExecution, config: runtimeConfig } = createRuntimeSponsoredExecutionConfig(config, runtimeExtensions, {
      useQuoteStore,
    });
    const gasStores = createDepositGasStores(runtimeConfig, useAmountStore, useDepositStore, useQuoteStore);
    const useAmountToReceive = createAmountToReceiveStore(useAmountStore, useQuoteStore, runtimeConfig.to.token.displaySymbol);

    const depositActions = createStoreActions(useAmountStore, createStoreActions(useDepositStore));
    const quoteActions = createStoreActions(useQuoteStore);

    return {
      cleanupSponsoredExecution,
      config: runtimeConfig,
      depositActions,
      gasStores,
      quoteActions,
      useAmountStore,
      useAmountToReceive,
      useDepositStore,
      useQuoteStore,
    };
  });

  const controller = useDepositController(
    stores.config,
    computeMaxSwappableAmount,
    stores.gasStores,
    stores.useAmountStore,
    stores.useDepositStore
  );

  const handleDeposit = useDepositHandler({
    config: stores.config,
    depositActions: stores.depositActions,
    gasStores: stores.gasStores,
    isSubmitting: controller.isSubmitting,
    quoteActions: stores.quoteActions,
    useAmountStore: stores.useAmountStore,
  });

  const contextValue: DepositContextType = {
    depositActions: stores.depositActions,
    gasStores: stores.gasStores,
    quoteActions: stores.quoteActions,
    useAmountStore: stores.useAmountStore,
    useAmountToReceive: stores.useAmountToReceive,
    useDepositStore: stores.useDepositStore,
    useQuoteStore: stores.useQuoteStore,
    ...controller,
    config: stores.config,
    handleDeposit,
    theme,
  };

  useCleanup(() => {
    stores.gasStores.reset();
    stores.useQuoteStore.getState().reset(true);
    stores.cleanupSponsoredExecution?.();
  });

  return <DepositContext.Provider value={contextValue}>{children}</DepositContext.Provider>;
}

function createRuntimeSponsoredExecutionConfig(
  config: DepositConfig,
  runtimeExtensions: DepositRuntimeExtensions | undefined,
  stores: DepositRuntimeStores
): { cleanup?: () => void; config: DepositConfig } {
  const sponsoredExecution = runtimeExtensions?.createSponsoredExecution?.(stores);
  if (!sponsoredExecution) return { config };

  return {
    cleanup: sponsoredExecution.cleanup,
    config: {
      ...config,
      gas: sponsoredExecution.gas ? { ...config.gas, ...sponsoredExecution.gas } : config.gas,
      sponsoredExecution: sponsoredExecution.sponsoredExecution,
    },
  };
}

// ============ Hook ========================================================== //

export function useDepositContext(): DepositContextType {
  const context = useContext(DepositContext);
  if (!context) {
    throw new Error('useDepositContext must be used within DepositProvider');
  }
  return context;
}
