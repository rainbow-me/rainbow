import { ChainId } from '@/__swaps__/types/chains';
import { getCachedGasSuggestions, useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { useMemo } from 'react';
import { getCustomGasSettings, useCustomGasSettings } from './useCustomGas';

export type GasSpeed = 'custom' | 'urgent' | 'fast' | 'normal';
const useSelectedGasSpeedStore = createRainbowStore<{ [c in ChainId]?: GasSpeed }>(() => ({}), {
  version: 0,
  storageKey: 'preferred gas speed',
});
export const useSelectedGasSpeed = (chainId: ChainId) =>
  useSelectedGasSpeedStore(s => {
    const speed = s[chainId] || 'fast';
    if (speed === 'custom' && getCustomGasSettings(chainId) === undefined) return 'fast';
    return speed;
  });
export const setSelectedGasSpeed = (chainId: ChainId, speed: GasSpeed) => useSelectedGasSpeedStore.setState({ [chainId]: speed });
export const getSelectedGasSpeed = (chainId: ChainId) => useSelectedGasSpeedStore.getState()[chainId] || 'fast';

export function useSelectedGas(chainId: ChainId) {
  const selectedGasSpeed = useSelectedGasSpeed(chainId);

  const userCustomGasSettings = useCustomGasSettings(chainId);
  const { data: metereologySuggestions } = useMeteorologySuggestions({
    chainId,
    enabled: selectedGasSpeed !== 'custom',
  });

  return useMemo(() => {
    if (selectedGasSpeed === 'custom') return userCustomGasSettings;
    return metereologySuggestions?.[selectedGasSpeed];
  }, [selectedGasSpeed, userCustomGasSettings, metereologySuggestions]);
}

export function getGasSettings(speed: GasSpeed, chainId: ChainId) {
  if (speed === 'custom') return getCustomGasSettings(chainId);
  return getCachedGasSuggestions(chainId)?.[speed];
}

export function getSelectedGas(chainId: ChainId) {
  const selectedGasSpeed = useSelectedGasSpeedStore.getState()[chainId] || 'fast';
  return getGasSettings(selectedGasSpeed, chainId);
}
