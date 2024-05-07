import { create } from 'zustand';

import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { CrosschainQuote, Quote, QuoteError, Source } from '@rainbow-me/swaps';
import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { DEFAULT_CONFIG } from '@/model/remoteConfig';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface SwapsState {
  // assets
  inputAsset: ParsedSearchAsset | null;
  outputAsset: ParsedSearchAsset | null;

  // quote
  quote: Quote | CrosschainQuote | QuoteError | null;

  // settings
  flashbots: boolean;
  slippage: string;
  source: Source | 'auto';
}

export const swapsStore = createRainbowStore<SwapsState>(
  () => ({
    inputAsset: null, // TODO: Default to their largest balance asset (or ETH mainnet if user has no assets)
    outputAsset: null,

    quote: null,

    flashbots: false,
    slippage: getDefaultSlippage(ChainId.mainnet, DEFAULT_CONFIG),
    source: 'auto',
  }),
  {
    storageKey: 'swapsStore',
    version: 1,
    // NOTE: Only persist the settings
    partialize(state) {
      return {
        flashbots: state.flashbots,
        source: state.source,
        slippage: state.slippage,
      };
    },
  }
);

export const useSwapsStore = create(swapsStore);
