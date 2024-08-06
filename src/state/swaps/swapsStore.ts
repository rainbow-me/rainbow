import { MIN_FLASHBOTS_PRIORITY_FEE } from '@/__swaps__/screens/Swap/constants';
import { getCustomGasSettings, setCustomMaxPriorityFee } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { getSelectedGasSpeed } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { GasSpeed } from '@/__swaps__/types/gas';
import { RecentSwap } from '@/__swaps__/types/swap';
import { getCachedGasSuggestions } from '@/__swaps__/utils/meteorology';
import { lessThan } from '@/__swaps__/utils/numbers';
import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { RainbowError, logger } from '@/logger';
import { getRemoteConfig } from '@/model/remoteConfig';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { CrosschainQuote, Quote, QuoteError, Source } from '@rainbow-me/swaps';

export interface SwapsState {
  isSwapsOpen: boolean;
  setIsSwapsOpen: (isSwapsOpen: boolean) => void;

  // assets
  inputAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
  outputAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;

  // quote
  quote: Quote | CrosschainQuote | QuoteError | null;

  selectedOutputChainId: ChainId;
  outputSearchQuery: string;

  // settings
  flashbots: boolean;
  setFlashbots: (flashbots: boolean) => void;
  slippage: string;
  setSlippage: (slippage: string) => void;
  source: Source | 'auto';
  setSource: (source: Source | 'auto') => void;
  degenMode: boolean;
  setDegenMode: (degenMode: boolean) => void;

  // recent swaps
  latestSwapAt: Map<ChainId, number>;
  recentSwaps: Map<ChainId, RecentSwap[]>;
  getRecentSwapsByChain: (chainId: ChainId) => RecentSwap[];
  addRecentSwap: (asset: ExtendedAnimatedAssetWithColors) => void;

  // degen mode preferences
  preferredNetwork: ChainId | undefined;
  setPreferredNetwork: (preferredNetwork: ChainId | undefined) => void;
}

type StateWithTransforms = Omit<Partial<SwapsState>, 'latestSwapAt' | 'recentSwaps'> & {
  latestSwapAt: Array<[ChainId, number]>;
  recentSwaps: Array<[ChainId, RecentSwap[]]>;
};

function serialize(state: Partial<SwapsState>, version?: number) {
  try {
    const transformedStateToPersist: StateWithTransforms = {
      ...state,
      latestSwapAt: state.latestSwapAt ? Array.from(state.latestSwapAt) : [],
      recentSwaps: state.recentSwaps ? Array.from(state.recentSwaps) : [],
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize state for swaps storage'), { error });
    throw error;
  }
}

function deserialize(serializedState: string) {
  let parsedState: { state: StateWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to parse serialized state from swaps storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let recentSwaps = new Map<ChainId, RecentSwap[]>();
  try {
    if (state.recentSwaps) {
      recentSwaps = new Map(state.recentSwaps);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert recentSwaps from swaps storage'), { error });
  }

  let latestSwapAt: Map<ChainId, number> = new Map();
  try {
    if (state.latestSwapAt) {
      latestSwapAt = new Map(state.latestSwapAt);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert latestSwapAt from swaps storage'), { error });
  }

  return {
    state: {
      ...state,
      latestSwapAt,
      recentSwaps,
    },
    version,
  };
}

const updateCustomGasSettingsForFlashbots = (flashbots: boolean, chainId: ChainId) => {
  const gasSpeed = getSelectedGasSpeed(chainId);
  if (gasSpeed !== GasSpeed.CUSTOM) return;

  const customGasSettings = getCustomGasSettings(chainId);
  if (!customGasSettings?.isEIP1559) return;

  const currentMaxPriorityFee = customGasSettings.maxPriorityFee;
  if (flashbots && lessThan(currentMaxPriorityFee, MIN_FLASHBOTS_PRIORITY_FEE)) {
    setCustomMaxPriorityFee(chainId, MIN_FLASHBOTS_PRIORITY_FEE);
    return;
  }

  if (!flashbots) {
    const suggestion = getCachedGasSuggestions(chainId, false)?.[GasSpeed.FAST];
    setCustomMaxPriorityFee(chainId, suggestion?.maxPriorityFee);
  }
};

export const swapsStore = createRainbowStore<SwapsState>(
  (set, get) => ({
    isSwapsOpen: false,
    setIsSwapsOpen: (isSwapsOpen: boolean) => set({ isSwapsOpen }),

    inputAsset: null,
    outputAsset: null,

    quote: null,

    selectedOutputChainId: ChainId.mainnet,
    outputSearchQuery: '',

    flashbots: false,
    setFlashbots: (flashbots: boolean) => {
      updateCustomGasSettingsForFlashbots(flashbots, get().inputAsset?.chainId || ChainId.mainnet);
      set({ flashbots });
    },
    slippage: getDefaultSlippage(ChainId.mainnet, getRemoteConfig()),
    setSlippage: (slippage: string) => set({ slippage }),
    source: 'auto',
    setSource: (source: Source | 'auto') => set({ source }),

    degenMode: false,
    setDegenMode: (degenMode: boolean) => set({ degenMode }),
    preferredNetwork: undefined,
    setPreferredNetwork: (preferredNetwork: ChainId | undefined) => set({ preferredNetwork }),

    latestSwapAt: new Map(),
    recentSwaps: new Map(),
    getRecentSwapsByChain: (chainId: ChainId) => {
      const { recentSwaps } = get();

      return recentSwaps.get(chainId) || [];
    },
    addRecentSwap(asset) {
      const { recentSwaps, latestSwapAt } = get();
      const now = Date.now();
      const chainId = asset.chainId;
      const chainSwaps = recentSwaps.get(chainId) || [];

      const [latestSwap] = chainSwaps;

      // Check if the most recent swap is the same as the incoming asset
      if (latestSwap && latestSwap.uniqueId === asset.uniqueId) {
        latestSwapAt.set(chainId, now);
        recentSwaps.set(chainId, [
          ...chainSwaps.slice(1),
          {
            ...latestSwap,
            swappedAt: now,
          },
        ]);

        set({ latestSwapAt: new Map(latestSwapAt), recentSwaps: new Map(recentSwaps) });
        return;
      }

      // Remove any existing entries of the same asset
      const filteredSwaps = chainSwaps.filter(swap => swap.uniqueId !== asset.uniqueId);

      const updatedSwaps = [...filteredSwaps, { ...asset, swappedAt: now }].slice(0, 3);
      recentSwaps.set(chainId, updatedSwaps);
      latestSwapAt.set(chainId, now);

      set({
        recentSwaps: new Map(recentSwaps),
        latestSwapAt: new Map(latestSwapAt),
      });
    },
  }),
  {
    storageKey: 'swapsStore',
    version: 2,
    deserializer: deserialize,
    serializer: serialize,
    // NOTE: Only persist the following
    partialize(state) {
      return {
        degenMode: state.degenMode,
        flashbots: state.flashbots,
        preferredNetwork: state.preferredNetwork,
        source: state.source,
        latestSwapAt: state.latestSwapAt,
        recentSwaps: state.recentSwaps,
      };
    },
  }
);

export const useSwapsStore = swapsStore;
