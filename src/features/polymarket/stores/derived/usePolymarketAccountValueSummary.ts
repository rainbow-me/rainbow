import { createDerivedStore } from '@storesjs/stores';

import { USD_DECIMALS } from '@/features/currency/constants';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { usePolymarketPositionsSummary } from '@/features/polymarket/stores/derived/usePolymarketPositionsSummary';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { truncateToDecimals } from '@/framework/core/safeMath';
import { add, isZero } from '@/helpers/utilities';

export type PolymarketAccountValueSummary = {
  balance: string;
  positionsValue: string;
  hasBalance: boolean;
  totalValueUsd: string;
  totalValueNative: string;
};

export const usePolymarketAccountValueSummary = createDerivedStore<PolymarketAccountValueSummary>($ => {
  const positionsValue = $(usePolymarketPositionsSummary, s => s.value);
  const balance = $(usePolymarketBalanceStore, s => truncateToDecimals(s.getBalance(), USD_DECIMALS));

  const totalValue = add(positionsValue, balance);
  const nativeCurrencyAccountValue = $(useCurrencyConversionStore, s => s.convertToNativeCurrency(totalValue));

  return {
    balance,
    positionsValue,
    hasBalance: !isZero(balance),
    totalValueUsd: totalValue,
    totalValueNative: nativeCurrencyAccountValue,
  };
});
