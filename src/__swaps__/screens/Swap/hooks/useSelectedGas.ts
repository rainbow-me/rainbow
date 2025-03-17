import { useMemo } from 'react';
import { ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { GasSpeed } from '@/__swaps__/types/gas';
import { MeteorologyGasSuggestions, getCachedGasSuggestions, useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { EIP1159GasSettings, GasSettings, LegacyGasSettings, getCustomGasSettings, useCustomGasSettings } from './useCustomGas';
import { NotifyOnChangeProps } from '@tanstack/react-query';

type CustomGasType = { custom: GasSettings | undefined };
type GasSpeedsObject<T> = { fast: T; normal: T; urgent: T };

export type SwapsGasFeeParamsBySpeed =
  | CustomGasType
  | (CustomGasType & GasSpeedsObject<LegacyGasSettings>)
  | (CustomGasType & GasSpeedsObject<EIP1159GasSettings>);

const useSelectedGasSpeedStore = createRainbowStore<{ [c in ChainId]?: GasSpeed }>(() => ({}), {
  version: 0,
  storageKey: 'preferred gas speed',
});

const selectSelectedGasSpeed = (chainId: ChainId) => (state: { [c in ChainId]?: GasSpeed }) => {
  const speed = state[chainId] || GasSpeed.FAST;
  if (speed === GasSpeed.CUSTOM && getCustomGasSettings(chainId) === undefined) return GasSpeed.FAST;
  return speed;
};

export const useSelectedGasSpeed = (chainId: ChainId) => useSelectedGasSpeedStore(selectSelectedGasSpeed(chainId));
export const setSelectedGasSpeed = (chainId: ChainId, speed: GasSpeed) => useSelectedGasSpeedStore.setState({ [chainId]: speed });
export const getSelectedGasSpeed = (chainId: ChainId) => selectSelectedGasSpeed(chainId)(useSelectedGasSpeedStore.getState());

export function useGasSettings(
  chainId: ChainId,
  speed: GasSpeed,
  options?: {
    keepPreviousData?: boolean;
    notifyOnChangeProps?: NotifyOnChangeProps;
    onSuccess?: (gasSettings: MeteorologyGasSuggestions) => void;
    staleTime?: number;
  }
): GasSettings | undefined {
  const userCustomGasSettings = useCustomGasSettings(chainId);
  const { data: metereologySuggestions } = useMeteorologySuggestions({
    chainId,
    enabled: speed !== GasSpeed.CUSTOM,
    keepPreviousData: options?.keepPreviousData,
    notifyOnChangeProps: options?.notifyOnChangeProps,
    onSuccess: options?.onSuccess,
    staleTime: options?.staleTime,
  });

  return useMemo(() => {
    if (speed === GasSpeed.CUSTOM) return userCustomGasSettings;
    return metereologySuggestions?.[speed];
  }, [speed, userCustomGasSettings, metereologySuggestions]);
}

export function useSelectedGas(chainId: ChainId): GasSettings | undefined {
  const selectedGasSpeed = useSelectedGasSpeed(chainId);
  return useGasSettings(chainId, selectedGasSpeed);
}

export function getGasSettingsBySpeed(chainId: ChainId): SwapsGasFeeParamsBySpeed {
  const suggestions = getCachedGasSuggestions(chainId);
  return {
    ...suggestions,
    custom: getCustomGasSettings(chainId),
  };
}

export function getGasSettings(speed: GasSpeed, chainId: ChainId): GasSettings | undefined {
  if (speed === GasSpeed.CUSTOM) {
    const customGasSettings = getCustomGasSettings(chainId);
    if (!customGasSettings) return getCachedGasSuggestions(chainId)?.[GasSpeed.FAST];
    return customGasSettings;
  }
  return getCachedGasSuggestions(chainId)?.[speed];
}

export function getSelectedGas(chainId: ChainId): GasSettings | undefined {
  const selectedGasSpeed = getSelectedGasSpeed(chainId);
  return getGasSettings(selectedGasSpeed, chainId);
}
