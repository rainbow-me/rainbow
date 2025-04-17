import { RainbowError, logger } from '@/logger';
import { getRemoteConfig } from '@/model/remoteConfig';
import { CrosschainQuote, Quote, QuoteError, Source } from '@rainbow-me/swaps';
import { ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { INITIAL_SLIDER_POSITION } from '@/__swaps__/screens/Swap/constants';
import { ExtendedAnimatedAssetWithColors, UniqueId } from '@/__swaps__/types/assets';
import { RecentSwap } from '@/__swaps__/types/swap';
import { clamp, getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { time } from '@/utils';

export interface SwapsState {
  // assets
  inputAsset: ExtendedAnimatedAssetWithColors | null;
  outputAsset: ExtendedAnimatedAssetWithColors | null;

  // core swaps state
  isSwapsOpen: boolean;
  setIsSwapsOpen: (isSwapsOpen: boolean) => void;
  percentageToSell: number; // Value between 0 and 1, e.g., 0.5, 0.1, 0.25
  setPercentageToSell: (percentageToSell: number) => void; // Accepts values from 0 to 1
  quote: Quote | CrosschainQuote | QuoteError | null;
  selectedOutputChainId: ChainId;

  // settings
  slippage: string;
  setSlippage: (slippage: string) => void;
  source: Source | 'auto';
  setSource: (source: Source | 'auto') => void;

  // recent swaps
  addRecentSwap: (asset: ExtendedAnimatedAssetWithColors) => void;
  getRecentSwapsByChain: (chainId?: ChainId) => RecentSwap[];
  latestSwapAt: Map<ChainId, number>;
  recentSwaps: Map<ChainId, RecentSwap[]>;

  // degen mode
  degenMode: boolean;
  setDegenMode: (degenMode: boolean) => void;

  // preferred network
  preferredNetwork: ChainId | undefined;
  setPreferredNetwork: (preferredNetwork: ChainId | undefined) => void;

  // analytics
  lastNavigatedTrendingToken: UniqueId | undefined;
}

type SwapsStateToPersist = Pick<
  SwapsState,
  'degenMode' | 'latestSwapAt' | 'preferredNetwork' | 'recentSwaps' | 'selectedOutputChainId' | 'source'
>;

type PersistedSwapsState = Omit<SwapsStateToPersist, 'latestSwapAt' | 'recentSwaps'> & {
  latestSwapAt: Array<[ChainId, number]>;
  recentSwaps: Array<[ChainId, RecentSwap[]]>;
};

function serialize(state: SwapsStateToPersist, version?: number) {
  try {
    const transformedStateToPersist: PersistedSwapsState = {
      ...state,
      latestSwapAt: state.latestSwapAt ? Array.from(state.latestSwapAt) : [],
      recentSwaps: state.recentSwaps ? Array.from(state.recentSwaps) : [],
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError(`[swapsStore]: Failed to serialize state for swaps storage`), { error });
    throw error;
  }
}

function deserialize(serializedState: string) {
  let parsedState: { state: PersistedSwapsState; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError(`[swapsStore]: Failed to parse serialized state from swaps storage`), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let recentSwaps = new Map<ChainId, RecentSwap[]>();
  try {
    if (state.recentSwaps) {
      recentSwaps = new Map(state.recentSwaps);
    }
  } catch (error) {
    logger.error(new RainbowError(`[swapsStore]: Failed to convert recentSwaps from swaps storage`), { error });
  }

  let latestSwapAt: Map<ChainId, number> = new Map();
  try {
    if (state.latestSwapAt) {
      latestSwapAt = new Map(state.latestSwapAt);
    }
  } catch (error) {
    logger.error(new RainbowError(`[swapsStore]: Failed to convert latestSwapAt from swaps storage`), { error });
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

export const swapsStore = createRainbowStore<SwapsState, SwapsStateToPersist>(
  (set, get) => ({
    isSwapsOpen: false,
    setIsSwapsOpen: (isSwapsOpen: boolean) => set(state => (state.isSwapsOpen !== isSwapsOpen ? { isSwapsOpen } : state)),

    inputAsset: null,
    outputAsset: null,

    quote: null,

    selectedOutputChainId: ChainId.mainnet,

    percentageToSell: INITIAL_SLIDER_POSITION,
    setPercentageToSell: (percentageToSell: number) =>
      set(state => (state.percentageToSell !== percentageToSell ? { percentageToSell: clamp(percentageToSell, 0, 1) } : state)),
    slippage: getDefaultSlippage(ChainId.mainnet, getRemoteConfig().default_slippage_bips_chainId),
    setSlippage: (slippage: string) => set(state => (state.slippage !== slippage ? { slippage } : state)),
    source: 'auto',
    setSource: (source: Source | 'auto') => set(state => (state.source !== source ? { source } : state)),

    degenMode: true,
    setDegenMode: (degenMode: boolean) => set({ degenMode }),
    preferredNetwork: undefined,
    setPreferredNetwork: (preferredNetwork: ChainId | undefined) => set({ preferredNetwork }),

    latestSwapAt: new Map(),
    recentSwaps: new Map(),
    getRecentSwapsByChain: (chainId?: ChainId) => get().recentSwaps.get(chainId ?? get().selectedOutputChainId) || [],

    addRecentSwap(asset) {
      const { recentSwaps, latestSwapAt } = get();
      const now = Date.now();
      const chainId = asset.chainId;
      const chainSwaps = recentSwaps.get(chainId) || [];

      // Remove any existing entries of the same asset
      const filteredSwaps = chainSwaps.filter(swap => swap.uniqueId !== asset.uniqueId);

      const updatedSwaps = [{ ...asset, swappedAt: now }, ...filteredSwaps].slice(0, 3);
      recentSwaps.set(chainId, updatedSwaps);
      latestSwapAt.set(chainId, now);

      set({
        recentSwaps: new Map(recentSwaps),
        latestSwapAt: new Map(latestSwapAt),
      });
    },

    lastNavigatedTrendingToken: undefined,
  }),
  {
    deserializer: deserialize,
    partialize(state) {
      return {
        degenMode: state.degenMode,
        preferredNetwork: state.preferredNetwork,
        selectedOutputChainId: state.selectedOutputChainId,
        source: state.source,
        latestSwapAt: state.latestSwapAt,
        recentSwaps: state.recentSwaps,
      } satisfies SwapsStateToPersist;
    },
    serializer: serialize,
    persistThrottleMs: time.seconds(5),
    storageKey: 'swapsStore',
    version: 2,
  }
);

export const useSwapsStore = swapsStore;
