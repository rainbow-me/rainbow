import React, { createContext, type ReactNode, useContext } from 'react';
import { type ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { type GasSpeed } from '@/__swaps__/types/gas';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { createDepositAmountStore } from '../stores/createAmountStore';
import { computeMaxSwappableAmount, createDepositStore } from '../stores/createDepositStore';
import { createDepositQuoteStore } from '../stores/createDepositQuoteStore';
import { createDepositGasStores } from '../stores/createDepositGasStores';
import { createAmountToReceiveStore } from '../stores/derived/createAmountToReceiveStore';
import { useDepositController } from '../hooks/useDepositController';
import { useDepositHandler } from '../hooks/useDepositHandler';
import { type DepositConfig, type DepositContextType, type FundingScreenTheme } from '../types';

// ============ Context ======================================================= //

const DepositContext = createContext<DepositContextType | null>(null);

// ============ Provider ====================================================== //

type DepositProviderProps = {
  children: ReactNode;
  config: DepositConfig;
  initialAsset: ExtendedAnimatedAssetWithColors | null;
  initialGasSpeed: GasSpeed;
  theme: FundingScreenTheme;
};

export function DepositProvider({ children, config, initialAsset, initialGasSpeed, theme }: DepositProviderProps): React.ReactElement {
  const stores = useStableValue(() => {
    const useAmountStore = createDepositAmountStore(initialAsset);
    const useDepositStore = createDepositStore(config, initialAsset, initialGasSpeed);
    const useQuoteStore = createDepositQuoteStore(config, useAmountStore, useDepositStore);
    const gasStores = createDepositGasStores(config, useDepositStore, useQuoteStore);
    const useAmountToReceive = createAmountToReceiveStore(useAmountStore, useQuoteStore, config.to.token.displaySymbol);

    const depositActions = createStoreActions(useAmountStore, createStoreActions(useDepositStore));
    const quoteActions = createStoreActions(useQuoteStore);

    return {
      depositActions,
      gasStores,
      quoteActions,
      useAmountStore,
      useAmountToReceive,
      useDepositStore,
      useQuoteStore,
    };
  });

  const controller = useDepositController(computeMaxSwappableAmount, stores.gasStores, stores.useAmountStore, stores.useDepositStore);

  const handleDeposit = useDepositHandler({
    config,
    depositActions: stores.depositActions,
    gasStores: stores.gasStores,
    isSubmitting: controller.isSubmitting,
    quoteActions: stores.quoteActions,
  });

  const contextValue: DepositContextType = {
    ...stores,
    ...controller,
    config,
    handleDeposit,
    theme,
  };

  useCleanup(() => {
    stores.gasStores.useMeteorologyStore.getState().reset(true);
    stores.gasStores.useGasLimitStore.getState().reset(true);
    stores.useQuoteStore.getState().reset(true);
  });

  return <DepositContext.Provider value={contextValue}>{children}</DepositContext.Provider>;
}

// ============ Hook ========================================================== //

export function useDepositContext(): DepositContextType {
  const context = useContext(DepositContext);
  if (!context) {
    throw new Error('useDepositContext must be used within DepositProvider');
  }
  return context;
}
