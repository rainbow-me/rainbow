import { ChainId } from '@/__swaps__/types/chains';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

type EIP1159GasSettings = {
  isEIP1559: true;
  maxBaseFee: string;
  maxPriorityFee: string;
};

type LegacyGasSettings = {
  isEIP1559: false;
  gasPrice: string;
};

export type GasSettings = EIP1159GasSettings | LegacyGasSettings;

export type CustomGasStoreState = { [c in ChainId]?: GasSettings };
export const useCustomGasStore = createRainbowStore<CustomGasStoreState>(() => ({}));

export const useCustomGasSettings = (chainId: ChainId) => useCustomGasStore(s => s[chainId]);
export const getCustomGasSettings = (chainId: ChainId) => useCustomGasStore.getState()[chainId];

const setCustomGasSettings = (chainId: ChainId, update: Partial<EIP1159GasSettings>) =>
  useCustomGasStore.setState(s => {
    const state = s[chainId] || { isEIP1559: true, maxBaseFee: '0', maxPriorityFee: '0' };
    if (!state.isEIP1559) return s;
    return { [chainId]: { ...state, ...update } };
  });

const setCustomLegacyGasSettings = (chainId: ChainId, update: Partial<LegacyGasSettings>) =>
  useCustomGasStore.setState(s => {
    const state = s[chainId] || { isEIP1559: false, gasPrice: '0' };
    if (state.isEIP1559) return s;
    return { [chainId]: { ...state, ...update } };
  });

export const setCustomMaxBaseFee = (chainId: ChainId, maxBaseFee = '0') => setCustomGasSettings(chainId, { maxBaseFee });
export const setCustomMaxPriorityFee = (chainId: ChainId, maxPriorityFee = '0') => setCustomGasSettings(chainId, { maxPriorityFee });
export const setCustomGasPrice = (chainId: ChainId, gasPrice = '0') => setCustomLegacyGasSettings(chainId, { gasPrice });
