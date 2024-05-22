import { ChainId } from '@/__swaps__/types/chains';
import { useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { useMemo } from 'react';
import { useCustomGasSettings } from './useCustomGas';

export type GasSpeed = 'custom' | 'urgent' | 'fast' | 'normal';
const useSelectedGasSpeedStore = createRainbowStore<{ [c in ChainId]?: GasSpeed }>(() => ({}), {
  version: 0,
  storageKey: 'preferred gas speed',
});
export const useSelectedGasSpeed = (chainId: ChainId) => useSelectedGasSpeedStore(s => s[chainId] || 'fast');
export const setSelectedGasSpeed = (chainId: ChainId, speed: GasSpeed) => useSelectedGasSpeedStore.setState({ [chainId]: speed });

export function useSelectedGas(chainId: ChainId) {
  const selectedGasSpeed = useSelectedGasSpeed(chainId);

  const userCustomGasSettings = useCustomGasSettings(chainId);
  const { data: metereologySuggestions } = useMeteorologySuggestions({
    chainId,
    enabled: selectedGasSpeed !== 'custom',
  });

  return useMemo(() => {
    if (selectedGasSpeed === 'custom') return userCustomGasSettings;
    if (!metereologySuggestions) return undefined;
    return metereologySuggestions[selectedGasSpeed];
  }, [selectedGasSpeed, userCustomGasSettings, metereologySuggestions]);
}
