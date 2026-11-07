import { createDerivedStore } from '@storesjs/stores';

import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { usePerpsPositionsInfo } from '@/features/perps/stores/derived/usePerpsPositionsInfo';

export const useHyperliquidBalance = createDerivedStore($ => {
  const perpsBalanceUsd = $(usePerpsPositionsInfo, s => s.value);
  return $(useCurrencyConversionStore, s => s.convertToNativeCurrency(perpsBalanceUsd));
});
