import type { PerpAnnotationResponse } from '@nktkas/hyperliquid';

import { infoClient } from '@/features/perps/services/hyperliquid-info-client';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type PerpAnnotationParams = {
  symbol: string;
};

type PerpAnnotationState = {
  currentSymbol: string;
  setSymbol: (symbol: string) => void;
  getAnnotation: () => PerpAnnotationResponse | null;
};

export const usePerpAnnotationsStore = createQueryStore<PerpAnnotationResponse | null, PerpAnnotationParams, PerpAnnotationState>(
  {
    fetcher: async ({ symbol }) => {
      if (!symbol) return null;
      return infoClient.perpAnnotation({ coin: symbol });
    },
    params: { symbol: ($, store) => $(store).currentSymbol },
    staleTime: time.minutes(30),
  },
  (set, get) => ({
    currentSymbol: '',
    setSymbol: (symbol: string) => {
      if (get().currentSymbol !== symbol) set({ currentSymbol: symbol });
    },
    getAnnotation: () => get().getData(),
  })
);
