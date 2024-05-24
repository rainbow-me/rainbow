import { ParsedSearchAsset, UserAssetFilter } from '@/__swaps__/types/assets';
import { CrosschainQuote, Quote, QuoteError, Source } from '@rainbow-me/swaps';
import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { DEFAULT_CONFIG } from '@/model/remoteConfig';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface SwapsState {
  // assets
  inputAsset: ParsedSearchAsset | null;
  outputAsset: ParsedSearchAsset | null;

  // token lists
  inputSearchQuery: string;
  outputSearchQuery: string;
  filter: UserAssetFilter;

  // quote
  quote: Quote | CrosschainQuote | QuoteError | null;

  selectedOutputChainId: ChainId;

  // settings
  flashbots: boolean;
  setFlashbots: (flashbots: boolean) => void;
  slippage: string;
  setSlippage: (slippage: string) => void;
  source: Source | 'auto';
  setSource: (source: Source | 'auto') => void;
}

export const swapsStore = createRainbowStore<SwapsState>(
  set => ({
    inputAsset: null, // TODO: Default to their largest balance asset (or ETH mainnet if user has no assets)
    outputAsset: null,

    inputSearchQuery: '',
    outputSearchQuery: '',
    filter: 'all',

    quote: null,
    selectedOutputChainId: ChainId.mainnet,

    flashbots: false,
    setFlashbots: (flashbots: boolean) => set({ flashbots }),
    slippage: getDefaultSlippage(ChainId.mainnet, DEFAULT_CONFIG),
    setSlippage: (slippage: string) => set({ slippage }),
    source: 'auto',
    setSource: (source: Source | 'auto') => set({ source }),
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

export const useSwapsStore = swapsStore;
