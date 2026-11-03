import { type ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { getMinimalTimeUnitStringForMs } from '@/helpers/time';
import { abs, lessThan, subtract } from '@/helpers/utilities';

import { useMeteorologyStore, type Meteorology } from '../data/meteorologyStore';
import { type GasSpeed } from '../types/gasSpeed';
import { type GasSettings } from './useCustomGas';
import { useGasSettings } from './useSelectedGas';

function difference(a: string, b: string): string {
  return abs(subtract(a, b));
}

function findClosestValue(target: string, values: string[]): string | undefined {
  return values.find((value, index) => {
    const nextValue = values[index + 1];
    if (!nextValue) return true;
    return lessThan(difference(value, target), difference(nextValue, target));
  });
}

function selectEstimatedGasTime(result: Meteorology | undefined, selectedGas: GasSettings | undefined): string | undefined {
  if (!result || !selectedGas?.isEIP1559) return undefined;

  const confirmationTimes = result.confirmationTimeByPriorityFee ?? {};
  const closestValue = findClosestValue(selectedGas.maxPriorityFee, Object.values(confirmationTimes));
  if (!closestValue) return undefined;

  const entry = Object.entries(confirmationTimes).find(([, value]) => value === closestValue);
  if (!entry) return undefined;
  const milliseconds = time.seconds(Number(entry[0]));
  return `${milliseconds >= time.hours(1) ? '> ' : '~'}${getMinimalTimeUnitStringForMs(milliseconds)}`;
}

/**
 * Estimates the confirmation time for the selected gas setting.
 */
export function useEstimatedGasTime({ chainId, speed }: { chainId: ChainId; speed: GasSpeed }): string | undefined {
  const selectedGas = useGasSettings(chainId, speed);
  return useMeteorologyStore(s => selectEstimatedGasTime(s.get(chainId), selectedGas));
}
