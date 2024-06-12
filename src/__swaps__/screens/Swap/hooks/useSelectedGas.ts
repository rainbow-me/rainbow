import { ChainId } from '@/__swaps__/types/chains';
import { GasSpeed } from '@/__swaps__/types/gas';
import { getCachedGasSuggestions, useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { useMemo } from 'react';
import { getCustomGasSettings, useCustomGasSettings } from './useCustomGas';

const useSelectedGasSpeedStore = createRainbowStore<{ [c in ChainId]?: GasSpeed }>(() => ({}), {
  version: 0,
  storageKey: 'preferred gas speed',
});
export const useSelectedGasSpeed = (chainId: ChainId) =>
  useSelectedGasSpeedStore(s => {
    const speed = s[chainId] || GasSpeed.FAST;
    if (speed === GasSpeed.CUSTOM && getCustomGasSettings(chainId) === undefined) return GasSpeed.FAST;
    return speed;
  });
export const setSelectedGasSpeed = (chainId: ChainId, speed: GasSpeed) => useSelectedGasSpeedStore.setState({ [chainId]: speed });
export const getSelectedGasSpeed = (chainId: ChainId) => useSelectedGasSpeedStore.getState()[chainId] || GasSpeed.FAST;

export function useGasSettings(chainId: ChainId, speed: GasSpeed) {
  const userCustomGasSettings = useCustomGasSettings(chainId);
  const { data: metereologySuggestions } = useMeteorologySuggestions({
    chainId,
    enabled: speed !== GasSpeed.CUSTOM,
  });

  return useMemo(() => {
    if (speed === GasSpeed.CUSTOM) return userCustomGasSettings;
    return metereologySuggestions?.[speed];
  }, [speed, userCustomGasSettings, metereologySuggestions]);
}

export function useSelectedGas(chainId: ChainId) {
  const selectedGasSpeed = useSelectedGasSpeed(chainId);
  return useGasSettings(chainId, selectedGasSpeed);
}

export function getGasSettingsBySpeed(chainId: ChainId) {
  const suggestions = getCachedGasSuggestions(chainId);
  return {
    ...suggestions,
    custom: getCustomGasSettings(chainId),
  };
}

export function getGasSettings(speed: GasSpeed, chainId: ChainId) {
  if (speed === GasSpeed.CUSTOM) {
    const customGasSettings = getCustomGasSettings(chainId);
    if (!customGasSettings) return getCachedGasSuggestions(chainId)?.[GasSpeed.FAST];
    return customGasSettings;
  }
  return getCachedGasSuggestions(chainId)?.[speed];
}

export function getSelectedGas(chainId: ChainId) {
  const selectedGasSpeed = useSelectedGasSpeedStore.getState()[chainId] || GasSpeed.FAST;
  return getGasSettings(selectedGasSpeed, chainId);
}
