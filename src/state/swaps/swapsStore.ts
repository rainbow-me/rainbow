import { MIN_FLASHBOTS_PRIORITY_FEE } from '@/__swaps__/screens/Swap/constants';
import { getCustomGasSettings, setCustomMaxPriorityFee } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { getSelectedGasSpeed } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { GasSpeed } from '@/__swaps__/types/gas';
import { getCachedGasSuggestions } from '@/__swaps__/utils/meteorology';
import { lessThan } from '@/__swaps__/utils/numbers';
import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
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
  }),
  {
    storageKey: 'swapsStore',
    version: 1,
    // NOTE: Only persist the settings
    partialize(state) {
      return {
        flashbots: state.flashbots,
        source: state.source,
      };
    },
  }
);

export const useSwapsStore = swapsStore;
