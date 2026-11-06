import { createBaseStore, type DeriveGetter } from '@storesjs/stores';

import { type ChainId } from '@/features/network/types/backendNetworks';

import { type GasSettings, type GasSuggestions } from '../types/gas';
import { GasSpeed } from '../types/gasSpeed';
import { useMeteorologyStore } from './meteorologyStore';

type CustomGasType = { custom: GasSettings | undefined };
export type SwapsGasFeeParamsBySpeed = CustomGasType | (CustomGasType & GasSuggestions);
export type CustomGasStoreState = { [c in ChainId]?: GasSettings };

export const useCustomGasStore = createBaseStore<CustomGasStoreState>(() => ({}));

export function setCustomGasSettings(chainId: ChainId, settings: GasSettings): void {
  useCustomGasStore.setState({ [chainId]: settings });
}

export const clearCustomGasSettings = (chainId?: ChainId) =>
  useCustomGasStore.setState(s => (chainId ? { ...s, [chainId]: undefined } : {}), true);

export const useSelectedGasSpeedStore = createBaseStore<{ [c in ChainId]?: GasSpeed }>(() => ({}), {
  version: 0,
  storageKey: 'preferred gas speed',
});

/**
 * Reads the preferred gas settings and tracks their source stores in a derivation.
 * A custom preference falls back to FAST when no custom settings remain.
 */
export function readSelectedGasSettings($: DeriveGetter, chainId: ChainId): GasSettings | undefined {
  const preference = $(useSelectedGasSpeedStore, s => s[chainId]);
  const custom = preference === GasSpeed.CUSTOM ? $(useCustomGasStore, s => s[chainId]) : undefined;
  const speed = resolveSelectedGasSpeed(preference, custom);

  if (speed === GasSpeed.CUSTOM) return custom;
  return $(useMeteorologyStore, s => s.get(chainId)?.suggestions[speed]);
}

export function resolveSelectedGasSpeed(preference: GasSpeed | undefined, custom: GasSettings | undefined): GasSpeed {
  if (!preference || (preference === GasSpeed.CUSTOM && custom === undefined)) return GasSpeed.FAST;
  return preference;
}

export const setSelectedGasSpeed = (chainId: ChainId, speed: GasSpeed) => useSelectedGasSpeedStore.setState({ [chainId]: speed });

export function getSelectedGasSpeed(chainId: ChainId): GasSpeed {
  return resolveSelectedGasSpeed(useSelectedGasSpeedStore.getState()[chainId], useCustomGasStore.getState()[chainId]);
}

export function getGasSettingsBySpeed(chainId: ChainId): SwapsGasFeeParamsBySpeed {
  const suggestions = useMeteorologyStore.getState().get(chainId)?.suggestions;
  return { ...suggestions, custom: useCustomGasStore.getState()[chainId] };
}

export function getGasSettings(speed: GasSpeed, chainId: ChainId): GasSettings | undefined {
  if (speed === GasSpeed.CUSTOM) {
    const custom = useCustomGasStore.getState()[chainId];
    return custom ?? useMeteorologyStore.getState().get(chainId)?.suggestions[GasSpeed.FAST];
  }
  return useMeteorologyStore.getState().get(chainId)?.suggestions[speed];
}

export function getSelectedGas(chainId: ChainId): GasSettings | undefined {
  return getGasSettings(getSelectedGasSpeed(chainId), chainId);
}

export function getSelectedSpeedSuggestion(chainId: ChainId): GasSettings | undefined {
  const speed = getSelectedGasSpeed(chainId);
  if (speed === GasSpeed.CUSTOM) return undefined;
  return useMeteorologyStore.getState().get(chainId)?.suggestions[speed];
}
