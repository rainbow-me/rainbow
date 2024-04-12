import { createStore } from '@/state/internal/createStore';
import { Source } from '@rainbow-me/swaps';
import { useStore } from 'zustand';
import { ChainId, ChainName } from '@/__swaps__/types/chains';
import { chainNameFromChainId } from '@/__swaps__/utils/chains';
import { RainbowConfig } from '@/model/remoteConfig';

export interface SwapSettingsState {
  aggregator: Source | 'auto';
  slippage: string;
  flashbots: boolean;
}

interface SettingsStoreProps {
  chainId: ChainId;
  config: RainbowConfig;
}

export const swapSettingsStore = ({ chainId, config }: SettingsStoreProps) =>
  createStore<SwapSettingsState>(
    set => ({
      aggregator: 'auto',
      slippage: getDefaultSlippage(chainId, config),
      flashbots: false,
      setSlippage: (slippage: string) => {
        const slippageValue = parseInt(slippage, 10);
        if (slippageValue >= 1 && slippageValue <= 99) {
          set({ slippage });
        } else {
          console.error('Slippage value must be between 1 and 99');
        }
      },
      toggleFlashbots: () => {
        set(state => ({ flashbots: !state.flashbots }));
      },
      setAggregator: (aggregator: Source | 'auto') => {
        set({ aggregator });
      },
    }),
    {
      persist: {
        name: 'SwapSettings',
        version: 1,
      },
    }
  );

export const useSwapSettingsStore = ({ chainId, config }: SettingsStoreProps) =>
  useStore(
    swapSettingsStore({
      chainId,
      config,
    })
  );

export const DEFAULT_SLIPPAGE_BIPS = {
  [ChainId.mainnet]: 100,
  [ChainId.polygon]: 200,
  [ChainId.bsc]: 200,
  [ChainId.optimism]: 200,
  [ChainId.base]: 200,
  [ChainId.zora]: 200,
  [ChainId.arbitrum]: 200,
  [ChainId.avalanche]: 200,
};

export const DEFAULT_SLIPPAGE = {
  [ChainId.mainnet]: '1',
  [ChainId.polygon]: '2',
  [ChainId.bsc]: '2',
  [ChainId.optimism]: '2',
  [ChainId.base]: '2',
  [ChainId.zora]: '2',
  [ChainId.arbitrum]: '2',
  [ChainId.avalanche]: '2',
};

const slippageInBipsToString = (slippageInBips: number) => (slippageInBips / 100).toString();

export const getDefaultSlippage = (chainId: ChainId, config: RainbowConfig) => {
  const chainName = chainNameFromChainId(chainId) as
    | ChainName.mainnet
    | ChainName.optimism
    | ChainName.polygon
    | ChainName.arbitrum
    | ChainName.base
    | ChainName.zora
    | ChainName.bsc
    | ChainName.avalanche;
  return slippageInBipsToString(
    // NOTE: JSON.parse doesn't type the result as a Record<ChainName, number>
    (config.default_slippage_bips as unknown as Record<ChainName, number>)[chainName] || DEFAULT_SLIPPAGE_BIPS[chainId]
  );
};
