import { USD_DECIMALS } from '@/features/perps/constants';
import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { usePolymarketPositionsSummary } from '@/features/polymarket/stores/derived/usePolymarketPositionsSummary';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { truncateToDecimals } from '@/framework/core/safeMath';
import { add, isZero } from '@/helpers/utilities';
import { createDerivedStore } from '@/state/internal/createDerivedStore';

export type PolymarketAccountValueSummary = {
  balance: string;
  positionsValue: string;
  hasBalance: boolean;
  totalValueUsd: string;
  totalValueNative: string;
};

export const usePolymarketAccountValueSummary = createDerivedStore<PolymarketAccountValueSummary>(
  $ => {
    const positionsValue = $(usePolymarketPositionsSummary, state => state.value);
    const balance = $(usePolymarketBalanceStore, state => truncateToDecimals(state.getBalance(), USD_DECIMALS));
    const totalValue = add(positionsValue, balance);
    const nativeCurrencyAccountValue = $(useCurrencyConversionStore, state => state.convertToNativeCurrency(totalValue));
    return {
      balance,
      positionsValue,
      hasBalance: !isZero(balance),
      totalValueUsd: totalValue,
      totalValueNative: nativeCurrencyAccountValue,
    };
  },
  { fastMode: true }
);
