import { createStore } from '../internal/createStore';
import create from 'zustand';
import { Source } from '@rainbow-me/swaps';
import { DEFAULT_SLIPPAGE_BIPS } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';

export interface SwapSettingsState {
  flashbots: boolean;
  slippage_in_bips: number;
  source: Source | 'auto';

  setFlashbots: (flashbots: boolean) => void;
  setSlippageInBips: (slippage_in_bips: number) => void;
  setSource: (source: Source) => void;
}

export const swapSettingsStore = createStore<SwapSettingsState>(
  set => ({
    flashbots: false,
    slippage_in_bips: DEFAULT_SLIPPAGE_BIPS[ChainId.mainnet],
    source: 'auto',

    setFlashbots: (flashbots: boolean) => set({ flashbots }),
    setSlippageInBips: (slippage_in_bips: number) => set({ slippage_in_bips }),
    setSource: (source: Source) => set({ source }),
  }),
  {
    persist: {
      name: 'swapSettings',
      version: 1,
    },
  }
);

export const useSwapSettings = create(swapSettingsStore);
