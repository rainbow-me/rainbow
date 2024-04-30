import { createStore } from '../internal/createStore';
import create from 'zustand';
import { Source } from '@rainbow-me/swaps';
import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { DEFAULT_CONFIG } from '@/model/remoteConfig';

export interface SwapSettingsState {
  flashbots: boolean;
  slippage: string;
  source: Source | 'auto';

  setFlashbots: (flashbots: boolean) => void;
  setSlippage: (slippage: string) => void;
  setSource: (source: Source) => void;
}

export const swapSettingsStore = createStore<SwapSettingsState>(
  set => ({
    flashbots: false,
    slippage: getDefaultSlippage(ChainId.mainnet, DEFAULT_CONFIG),
    source: 'auto',

    setFlashbots: (flashbots: boolean) => set({ flashbots }),
    setSlippage: (slippage: string) => set({ slippage }),
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
