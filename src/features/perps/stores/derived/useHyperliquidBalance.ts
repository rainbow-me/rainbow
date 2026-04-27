import { createDerivedStore } from '@storesjs/stores';

import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { usePerpsPositionsInfo } from '@/features/perps/stores/derived/usePerpsPositionsInfo';

export const useHyperliquidBalance = createDerivedStore(
  $ => {
    const perpsBalanceUsd = $(usePerpsPositionsInfo, state => state.value);
    const convertedBalance = $(useCurrencyConversionStore, state => state.convertToNativeCurrency(perpsBalanceUsd));
    return convertedBalance;
  },
  { lockDependencies: true }
);
