import { Price } from '@/features/charts/candlestick/types';
import { arePricesEqual } from '@/features/charts/candlestick/utils';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { calculatePercentChange, getTokenId, useCandlestickStore } from '../candlestickStore';
import { useChartsStore } from '../chartsStore';

type CandlestickPrice = Pick<Price, 'percentChange' | 'price'>;

export const useCandlestickPrice = createDerivedStore<CandlestickPrice | undefined>(
  $ => {
    const token = $(useChartsStore).token;
    const candles = $(useCandlestickStore, state => state.getData()?.candles);
    const price = $(useCandlestickStore, state => (token ? state.prices[getTokenId(token)]?.price : undefined));

    if (!token || !price) return undefined;
    if (!candles) return useCandlestickStore.getState().prices[getTokenId(token)];

    return { percentChange: calculatePercentChange(candles), price };
  },

  { equalityFn: arePricesEqual, fastMode: true }
);
