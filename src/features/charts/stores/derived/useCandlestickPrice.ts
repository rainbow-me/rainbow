import { createDerivedStore } from '@storesjs/stores';

import { type Price } from '@/features/charts/candlestick/types';
import { arePricesEqual } from '@/features/charts/candlestick/utils';
import { useViewedTokenStore } from '@/features/token/data/stores/viewedTokenStore';

import { calculatePercentChange, getTokenId, useCandlestickStore } from '../candlestickStore';

type CandlestickPrice = Pick<Price, 'percentChange' | 'price'>;

export const useCandlestickPrice = createDerivedStore<CandlestickPrice | undefined>(
  $ => {
    const token = $(useViewedTokenStore).token;
    const candles = $(useCandlestickStore, state => state.getData()?.candles);
    const price = $(useCandlestickStore, state => (token ? state.prices[getTokenId(token)]?.price : undefined));

    if (!token || !price) return undefined;
    if (!candles) return useCandlestickStore.getState().prices[getTokenId(token)];

    return { percentChange: calculatePercentChange(candles), price };
  },

  { equalityFn: arePricesEqual, lockDependencies: true }
);
