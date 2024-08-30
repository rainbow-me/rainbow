import { ChainId } from '@/__swaps__/types/chains';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type EIP1159GasSettings = {
  isEIP1559: true;
  maxBaseFee: string;
  maxPriorityFee: string;
};

export type LegacyGasSettings = {
  isEIP1559: false;
  gasPrice: string;
};

export type GasSettings = EIP1159GasSettings | LegacyGasSettings;

export type CustomGasStoreState = { [c in ChainId]?: GasSettings };
export const useCustomGasStore = createRainbowStore<CustomGasStoreState>(() => ({}));

export const useCustomGasSettings = (chainId: ChainId) => useCustomGasStore(s => s[chainId]);
export const getCustomGasSettings = (chainId: ChainId) => useCustomGasStore.getState()[chainId];

export const clearCustomGasSettings = (chainId?: ChainId) =>
  useCustomGasStore.setState(s => (chainId ? { ...s, [chainId]: undefined } : {}), true);

export const setCustomGasSettings = (chainId: ChainId, update: Partial<GasSettings>) => {
  useCustomGasStore.setState(s => {
    const state = s[chainId] || {
      isEIP1559: !('gasPrice' in update && !!update.gasPrice),
      maxBaseFee: '0',
      maxPriorityFee: '0',
      gasPrice: '0',
    };
    return { [chainId]: { ...state, ...update } as GasSettings };
  });
};

export const setCustomMaxBaseFee = (chainId: ChainId, maxBaseFee = '0') => setCustomGasSettings(chainId, { maxBaseFee });
export const setCustomMaxPriorityFee = (chainId: ChainId, maxPriorityFee = '0') => setCustomGasSettings(chainId, { maxPriorityFee });
export const setCustomGasPrice = (chainId: ChainId, gasPrice = '0') => setCustomGasSettings(chainId, { gasPrice });
