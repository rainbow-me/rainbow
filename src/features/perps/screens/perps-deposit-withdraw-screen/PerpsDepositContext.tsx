import React, { ReactNode, createContext, useContext } from 'react';
import { usePerpsDepositController } from '@/features/perps/screens/perps-deposit-withdraw-screen/hooks/usePerpsDepositController';
import { usePerpsDepositHandler } from '@/features/perps/screens/perps-deposit-withdraw-screen/hooks/usePerpsDepositHandler';
import { createAmountToReceiveStore } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/derived/createAmountToReceiveStore';
import { PerpsDepositContextType } from '@/features/perps/screens/perps-deposit-withdraw-screen/types';
import { useCleanup } from '@/hooks';
import { useStableValue } from '@/hooks/useStableValue';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { GasSpeed } from '@/__swaps__/types/gas';
import { createPerpsDepositStore } from './stores/createPerpsDepositStore';
import { createPerpsDepositAmountStore } from './stores/createPerpsDepositAmountStore';
import { createPerpsDepositGasStores } from './stores/createPerpsDepositGasStore';
import { createPerpsDepositQuoteStore } from './stores/createPerpsDepositQuoteStore';

const PerpsDepositContext = createContext<PerpsDepositContextType | null>(null);

export function PerpsDepositProvider({
  children,
  initialAsset,
  initialGasSpeed,
}: {
  children: ReactNode;
  initialAsset: ExtendedAnimatedAssetWithColors | null;
  initialGasSpeed: GasSpeed;
}) {
  const stores = useStableValue(() => {
    const useAmountStore = createPerpsDepositAmountStore(initialAsset);
    const useDepositStore = createPerpsDepositStore(initialAsset, initialGasSpeed);
    const useQuoteStore = createPerpsDepositQuoteStore(useAmountStore, useDepositStore);
    const gasStores = createPerpsDepositGasStores(useDepositStore, useQuoteStore);
    const useAmountToReceive = createAmountToReceiveStore(useAmountStore, useQuoteStore);

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

  const controller = usePerpsDepositController(stores.useAmountStore, stores.useDepositStore, stores.gasStores);

  const handleDeposit = usePerpsDepositHandler({
    depositActions: stores.depositActions,
    gasStores: stores.gasStores,
    isSubmitting: controller.isSubmitting,
    quoteActions: stores.quoteActions,
  });

  const contextValue = Object.assign(stores, controller, { handleDeposit });

  useCleanup(() => {
    stores.gasStores.useMeteorologyStore.getState().reset();
    stores.gasStores.useGasLimitStore.getState().reset();
    stores.useQuoteStore.getState().reset();
  });

  return <PerpsDepositContext.Provider value={contextValue}>{children}</PerpsDepositContext.Provider>;
}

export function usePerpsDepositContext(): PerpsDepositContextType {
  const context = useContext(PerpsDepositContext);
  if (!context) throw new Error('usePerpsDepositContext must be used within PerpsDepositProvider');
  return context;
}
