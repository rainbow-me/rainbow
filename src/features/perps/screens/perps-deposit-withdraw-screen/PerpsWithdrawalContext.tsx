import React, { createContext, ReactNode, useContext } from 'react';
import { useStableValue } from '@/hooks/useStableValue';
import { StoreActions, createStoreActions } from '@/state/internal/utils/createStoreActions';
import { createPerpsWithdrawalStore, PerpsWithdrawalStoreType } from './stores/createPerpsWithdrawalStore';

type PerpsWithdrawalStores = {
  useWithdrawalStore: PerpsWithdrawalStoreType;
  withdrawalActions: StoreActions<PerpsWithdrawalStoreType>;
};

const PerpsWithdrawalContext = createContext<PerpsWithdrawalStores | null>(null);

export function PerpsWithdrawalProvider({ children }: { children: ReactNode }) {
  const store = useStableValue(() => {
    const useWithdrawalStore = createPerpsWithdrawalStore();
    const withdrawalActions = createStoreActions(useWithdrawalStore);
    return { useWithdrawalStore, withdrawalActions };
  });

  return <PerpsWithdrawalContext.Provider value={store}>{children}</PerpsWithdrawalContext.Provider>;
}

export function usePerpsWithdrawalContext(): PerpsWithdrawalStores {
  const context = useContext(PerpsWithdrawalContext);
  if (!context) throw new Error('usePerpsWithdrawalContext must be used within PerpsWithdrawalProvider');
  return context;
}
