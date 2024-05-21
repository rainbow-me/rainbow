import { ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';
import { CrosschainQuote, Quote, QuoteError, Source } from '@rainbow-me/swaps';
import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { DEFAULT_CONFIG } from '@/model/remoteConfig';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { verifiedAssetsStore } from '../assets/verifiedAssets';
import { userAssetsStore } from '../assets/userAssets';
import { isLowerCaseMatch } from '@/__swaps__/utils/strings';

export interface SwapsState {
  // assets
  inputAsset: ParsedSearchAsset | null;
  outputAsset: ParsedSearchAsset | null;

  outputAssets: Map<UniqueId, ParsedSearchAsset>;
  outputAssetsIds: Map<string, UniqueId[]>;
  outputSearchQuery: string;
  outputChainFilter: 'all' | ChainId;

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

    outputAssets: new Map(),
    outputAssetsIds: new Map(),
    outputSearchQuery: '',
    outputChainFilter: 'all',

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
  state => ({
    outputSearchQuery: state.outputSearchQuery,
    inputAsset: state.inputAsset,
    outputChainFilter: state.outputChainFilter,
  }),
  async (
    { outputSearchQuery, inputAsset, outputChainFilter },
    { outputSearchQuery: prevOutputSearchQuery, outputChainFilter: prevOutputChainFilter, inputAsset: prevInputAsset }
  ) => {
    const assetToSellAddress = inputAsset?.[inputAsset.chainId === ChainId.mainnet ? 'address' : 'mainnetAddress'];
    const verifiedAssets = verifiedAssetsStore.getState().verifiedAssets;
    const unverifiedSearchAssets: ParsedSearchAsset[] = []; // pull from zustand or fetch if changed
    const verifiedSearchAssets: ParsedSearchAsset[] = []; // pull from zustand or fetch if changed
    const outputAssetIds = swapsStore.getState().outputAssetsIds;
    const inputChainId = inputAsset?.chainId ?? ChainId.mainnet;
    const outputChainId = outputChainFilter === 'all' ? ChainId.mainnet : outputChainFilter;
    const verifiedAssetsForChain = verifiedAssets.filter(asset => asset.chainId === outputChainId);
    const favorites = userAssetsStore.getState().favorites;

    const newMap: Map<string, UniqueId[]> = new Map();

    // BRIDGE
    let bridgeAsset: ParsedSearchAsset | null = null;
    if (inputAsset === prevInputAsset && outputChainFilter === prevOutputChainFilter) {
      // NEED TO GET BRIDGE ASSET BY UNIQUE ID
      bridgeAsset = outputAssetIds.get('bridge')?.[0] ?? null;
      newMap.set('bridge', bridgeAsset ? [bridgeAsset.uniqueId] : []);
    } else {
      const bridgeAsset =
        inputChainId === outputChainId
          ? null
          : verifiedAssetsForChain.find(asset => isLowerCaseMatch(asset.mainnetAddress, assetToSellAddress));
      if (bridgeAsset) {
        newMap.set('bridge', [bridgeAsset.uniqueId]);
      }
    }

    // FAVORITES
    if (outputChainFilter === prevOutputChainFilter && inputAsset === prevInputAsset) {
      newMap.set('favorites', outputAssetIds.get('favorites') ?? []);
    } else {
      newMap.set(
        'favorites',
        Array.from(favorites).filter(
          favAddress => !isLowerCaseMatch(favAddress, bridgeAsset?.address) && !isLowerCaseMatch(favAddress, assetToSellAddress)
        )
      );
    }

    // VERIFIED
    if (outputSearchQuery) {
      if (outputChainFilter === prevOutputChainFilter && inputAsset === prevInputAsset && outputSearchQuery === prevOutputSearchQuery) {
        newMap.set('verified', outputAssetIds.get('verified') ?? []);
      } else {
        // Filter out the input asset, bridge asset, crosschains and favorites
        const filteredAssets = verifiedSearchAssets.filter(asset => {
          asset.chainId === outputChainId &&
            !favorites.has(asset.address.toLowerCase() as `0x${string}`) &&
            !isLowerCaseMatch(asset.address, bridgeAsset?.address) &&
            !isLowerCaseMatch(asset.address, assetToSellAddress);
        });
        newMap.set(
          'verified',
          filteredAssets.map(asset => asset.uniqueId)
        );
      }
    } else {
      if (outputChainFilter === prevOutputChainFilter && inputAsset === prevInputAsset) {
        newMap.set('verified', outputAssetIds.get('verified') ?? []);
      } else {
        // Filter out the input asset, bridge asset, and favorites
        const filteredAssets = verifiedAssetsForChain.filter(asset => {
          !favorites.has(asset.address.toLowerCase() as `0x${string}`) &&
            !isLowerCaseMatch(asset.address, bridgeAsset?.address) &&
            !isLowerCaseMatch(asset.address, assetToSellAddress);
        });
        newMap.set(
          'verified',
          filteredAssets.map(asset => asset.uniqueId)
        );
      }
    }

    // UNVERIFIED
    if (inputAsset === prevInputAsset && outputSearchQuery === prevOutputSearchQuery) {
      newMap.set('unverified', outputAssetIds.get('unverified') ?? []);
    } else if (outputSearchQuery && outputSearchQuery.length > 2) {
      // Filter out the input asset, bridge asset, and favorites
      const filteredAssets = unverifiedSearchAssets.filter(asset => {
        asset.chainId === outputChainId &&
          !favorites.has(asset.address.toLowerCase() as `0x${string}`) &&
          !isLowerCaseMatch(asset.address, bridgeAsset?.address) &&
          !isLowerCaseMatch(asset.address, assetToSellAddress);
      });
      newMap.set(
        'unverified',
        filteredAssets.map(asset => asset.uniqueId)
      );
    }

    // OTHER NETWORKS
    if (outputSearchQuery === prevOutputSearchQuery && !newMap.size) {
      newMap.set('other_networks', outputAssetIds.get('other_networks') ?? []);
    } else if (outputSearchQuery) {
      const filteredAssets = verifiedAssets.filter(asset => {
        const symbolMatch = isLowerCaseMatch(asset.symbol, outputSearchQuery);
        const nameMatch = isLowerCaseMatch(asset.name, outputSearchQuery);
        return symbolMatch || nameMatch;
      });
      if (filteredAssets) {
        newMap.set(
          'other_networks',
          filteredAssets.map(asset => asset.uniqueId)
        );
      }
    }
  }
);
