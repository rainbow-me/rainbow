import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';

export const usePolymarketBalance = createDerivedStore(
  $ => {
    const polymarketBalanceUsd = $(usePolymarketBalanceStore, state => state.getBalance());
    const convertedBalance = $(useCurrencyConversionStore, state => state.convertToNativeCurrency(polymarketBalanceUsd));
    return convertedBalance;
  },
  { fastMode: true }
);
