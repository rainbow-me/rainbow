import { createBaseStore } from '@storesjs/stores';

import { type ChainId } from '@/features/network/types/backendNetworks';

import { useMeteorologyStore } from '../data/meteorologyStore';
import { type GasSettings, type GasSuggestions } from '../types/gas';
import { GasSpeed } from '../types/gasSpeed';
import { getCustomGasSettings, useCustomGasSettings } from './useCustomGas';

type CustomGasType = { custom: GasSettings | undefined };
export type SwapsGasFeeParamsBySpeed = CustomGasType | (CustomGasType & GasSuggestions);

const useSelectedGasSpeedStore = createBaseStore<{ [c in ChainId]?: GasSpeed }>(() => ({}), {
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

export function useGasSettings(chainId: ChainId, speed: GasSpeed): GasSettings | undefined {
  const customSettings = useCustomGasSettings(chainId);
  const suggestion = useMeteorologyStore(s => (speed === GasSpeed.CUSTOM ? undefined : s.get(chainId)?.suggestions[speed]));
  return speed === GasSpeed.CUSTOM ? customSettings : suggestion;
}

export function useSelectedGas(chainId: ChainId): GasSettings | undefined {
  const selectedGasSpeed = useSelectedGasSpeed(chainId);
  return useGasSettings(chainId, selectedGasSpeed);
}

export function getGasSettingsBySpeed(chainId: ChainId): SwapsGasFeeParamsBySpeed {
  const suggestions = useMeteorologyStore.getState().get(chainId)?.suggestions;
  return {
    ...suggestions,
    custom: getCustomGasSettings(chainId),
  };
}

export function getGasSettings(speed: GasSpeed, chainId: ChainId): GasSettings | undefined {
  if (speed === GasSpeed.CUSTOM) {
    const customGasSettings = getCustomGasSettings(chainId);
    if (!customGasSettings) return useMeteorologyStore.getState().get(chainId)?.suggestions[GasSpeed.FAST];
    return customGasSettings;
  }
  return useMeteorologyStore.getState().get(chainId)?.suggestions[speed];
}

export function getSelectedGas(chainId: ChainId): GasSettings | undefined {
  const selectedGasSpeed = getSelectedGasSpeed(chainId);
  return getGasSettings(selectedGasSpeed, chainId);
}

export function getSelectedSpeedSuggestion(chainId: ChainId): GasSettings | undefined {
  const speed = getSelectedGasSpeed(chainId);
  if (speed === GasSpeed.CUSTOM) return undefined;
  return useMeteorologyStore.getState().get(chainId)?.suggestions[speed];
}
