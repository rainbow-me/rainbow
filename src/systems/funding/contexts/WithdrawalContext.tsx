import React, { createContext, type ReactNode, useContext } from 'react';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { createAmountStore } from '../stores/createAmountStore';
import { createWithdrawalQuoteStore } from '../stores/createWithdrawalQuoteStore';
import { createWithdrawalStore } from '../stores/createWithdrawalStore';
import { createTokenNetworksStore } from '../stores/createWithdrawalTokenStore';
import { type BalanceQueryStore, type FundingScreenTheme, type WithdrawalConfig, type WithdrawalContextType } from '../types';

// ============ Types ========================================================== //

type WithdrawalProviderProps<T extends BalanceQueryStore> = {
  children: ReactNode;
  config: WithdrawalConfig<T>;
  theme: FundingScreenTheme;
};

// ============ Context ======================================================== //

const WithdrawalContext = createContext<WithdrawalContextType<BalanceQueryStore> | null>(null);

// ============ Provider ======================================================= //

export function WithdrawalProvider<T extends BalanceQueryStore>({
  children,
  config,
  theme,
}: WithdrawalProviderProps<T>): React.ReactElement {
  const value = useStableValue((): WithdrawalContextType<T> => {
    const useWithdrawalStore = createWithdrawalStore(config);
    const useAmountStore = createAmountStore('0');
    const withdrawalActions = createStoreActions(useWithdrawalStore);
    const amountActions = createStoreActions(useAmountStore);

    const hasRoute = Boolean(config.route);
    const base = { amountActions, config, hasRoute, theme, useAmountStore, useWithdrawalStore, withdrawalActions };

    if (!config.route) return base;

    const token = config.route.to.token;
    const useTokenStore = createTokenNetworksStore(token);
    const useQuoteStore = createWithdrawalQuoteStore(config, useAmountStore, useTokenStore, useWithdrawalStore);

    return Object.assign(base, { useQuoteStore, useTokenStore });
  });

  useCleanup(() => {
    value.useTokenStore?.getState().reset(true);
    value.useQuoteStore?.getState().reset(true);
  });

  return <WithdrawalContext.Provider value={value}>{children}</WithdrawalContext.Provider>;
}

// ============ Hook =========================================================== //

export function useWithdrawalContext(): WithdrawalContextType<BalanceQueryStore> {
  const context = useContext(WithdrawalContext);
  if (!context) throw new Error('useWithdrawalContext must be used within WithdrawalProvider');
  return context;
}
