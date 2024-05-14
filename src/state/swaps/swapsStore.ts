import { ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';
import { CrosschainQuote, Quote, QuoteError, Source } from '@rainbow-me/swaps';
import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { DEFAULT_CONFIG } from '@/model/remoteConfig';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { fetchTokenSearch } from '@/__swaps__/screens/Swap/resources/search';

export interface SwapsState {
  // assets
  inputAsset: ParsedSearchAsset | null;
  outputAsset: ParsedSearchAsset | null;

  // token to buy list
  assetsToBuy: Map<UniqueId, ParsedSearchAsset>;
  assetsToBuyIds: UniqueId[];
  searchQuery: string;

  // quote
  quote: Quote | CrosschainQuote | QuoteError | null;

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
    assetsToBuy: new Map(),
    assetsToBuyIds: [],
    searchQuery: '',
    quote: null,

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

swapsStore.subscribe(
  state => state.searchQuery, // this function specifies which part of the state to watch
  async searchQuery => {
    const [targetVerifiedAssets, targetUnverifiedAssets] = await Promise.all([
      fetchTokenSearch({
        chainId: toChainId,
        keys,
        list: 'verifiedAssets',
        threshold,
        query,
        fromChainId,
      }),
      fetchTokenSearch({
        chainId: toChainId,
        keys,
        list: 'highLiquidityAssets',
        threshold,
        query,
        fromChainId,
      }),
    ]);
  }
);
