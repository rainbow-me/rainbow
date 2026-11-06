import { type ChainId } from '@/features/network/types/backendNetworks';

import { resolveSelectedGasSpeed, useCustomGasStore, useSelectedGasSpeedStore } from '../data/gasSettingsStore';
import { useMeteorologyStore } from '../data/meteorologyStore';
import { type GasSettings } from '../types/gas';
import { GasSpeed } from '../types/gasSpeed';
import { useCustomGasSettings } from './useCustomGas';

export function useSelectedGasSpeed(chainId: ChainId): GasSpeed {
  const preference = useSelectedGasSpeedStore(s => s[chainId]);
  const custom = useCustomGasStore(s => (preference === GasSpeed.CUSTOM ? s[chainId] : undefined));
  return resolveSelectedGasSpeed(preference, custom);
}

export function useGasSettings(chainId: ChainId, speed: GasSpeed): GasSettings | undefined {
  const customSettings = useCustomGasSettings(chainId);
  const suggestion = useMeteorologyStore(s => (speed === GasSpeed.CUSTOM ? undefined : s.get(chainId)?.suggestions[speed]));
  return speed === GasSpeed.CUSTOM ? customSettings : suggestion;
}

export function useSelectedGas(chainId: ChainId): GasSettings | undefined {
  const selectedGasSpeed = useSelectedGasSpeed(chainId);
  return useGasSettings(chainId, selectedGasSpeed);
}
