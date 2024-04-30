import { createStore } from '../internal/createStore';
import { create } from 'zustand';
import { CrosschainQuote, Quote, QuoteError, QuoteParams, SwapType, getCrosschainQuote, getQuote } from '@rainbow-me/swaps';
import { RainbowError, logger } from '@/logger';

export const QUOTE_POLL_INTERVAL = 5_000;

export interface SwapQuoteStore {
  quote: Quote | CrosschainQuote | QuoteError | null;
  pollRef: NodeJS.Timer | null;
  setPollRef: (pollRef: NodeJS.Timer | null) => void;
  getQuote: (quoteParams: QuoteParams) => Promise<void>;
  setQuote: (quote: Quote | CrosschainQuote | QuoteError | null) => void;
  clearQuote: () => void;
}

export const swapQuoteStore = createStore<SwapQuoteStore>(set => ({
  quote: null,
  pollRef: null,
  setPollRef: (pollRef: NodeJS.Timer | null) => set({ pollRef }),
  getQuote: async (quoteParams: QuoteParams) => {
    try {
      const quote = (quoteParams.swapType === SwapType.crossChain ? await getCrosschainQuote(quoteParams) : await getQuote(quoteParams)) as
        | Quote
        | CrosschainQuote
        | QuoteError;

      set({ quote });
    } catch (error) {
      if (error instanceof Error) {
        logger.error(new RainbowError(error.message), {
          extra: {
            quoteParams,
          },
        });
      } else {
        logger.error(new RainbowError('Failed to fetch quote'), {
          extra: {
            quoteParams,
          },
        });
      }
    }
  },
  setQuote: quote => set({ quote }),
  clearQuote: () => set({ quote: null }),
}));

export const useSwapQuoteStore = create(swapQuoteStore);

export const pollSwapQuote = (quoteParams: QuoteParams) => {
  const { getQuote, pollRef, setPollRef } = swapQuoteStore.getState();
  if (pollRef) {
    clearInterval(pollRef);
  }

  const poll = setInterval(() => {
    getQuote(quoteParams);
  }, QUOTE_POLL_INTERVAL);

  setPollRef(poll);
};
