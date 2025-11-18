import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { usePolymarketAccountInfo } from '@/features/polymarket/stores/derived/usePolymarketAccountInfo';

export const usePolymarketAccountValue = createDerivedStore(
  $ => {
    const polymarketAccountValueUsd = $(usePolymarketAccountInfo, state => state.value);
    const convertedBalance = $(useCurrencyConversionStore, state => state.convertToNativeCurrency(polymarketAccountValueUsd));
    return convertedBalance;
  },
  { fastMode: true }
);
