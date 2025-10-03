import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';

export const useHyperliquidBalance = createDerivedStore(
  $ => {
    const perpsBalanceUsd = $(useHyperliquidAccountStore, state => state.getValue());
    const convertedBalance = $(useCurrencyConversionStore, state => state.convertToNativeCurrency(perpsBalanceUsd));
    return convertedBalance;
  },
  { fastMode: true }
);
