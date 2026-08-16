import { useCallback } from 'react';

import { type ChainId } from '@/features/network/types/backendNetworks';
import { getMinimalTimeUnitStringForMs } from '@/helpers/time';
import { abs, lessThan, subtract } from '@/helpers/utilities';

import { type GasSpeed } from '../types/gasSpeed';
import { useMeteorology, type MeteorologyResult } from '../utils/meteorology';
import { isLegacyMeteorologyFeeData } from '../utils/meteorologyClassification';
import { type GasSettings } from './useCustomGas';
import { useGasSettings } from './useSelectedGas';

type EstimatedGasTimeQuery = ReturnType<typeof useMeteorology<string | undefined>>;

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

function selectEstimatedGasTime(result: MeteorologyResult, selectedGas: GasSettings | undefined): string | undefined {
  if (isLegacyMeteorologyFeeData(result) || !selectedGas?.isEIP1559) return undefined;

  const confirmationTimes = result.data.confirmationTimeByPriorityFee ?? {};
  const closestValue = findClosestValue(selectedGas.maxPriorityFee, Object.values(confirmationTimes));
  if (!closestValue) return undefined;

  const entry = Object.entries(confirmationTimes).find(([, value]) => value === closestValue);
  const time = entry?.[0];
  if (!time) return undefined;
  return `${+time >= 3600 ? '> ' : '~'}${getMinimalTimeUnitStringForMs(+time * 1000)}`;
}

/** Returns a query whose data is the estimated confirmation time for the selected gas setting. */
export function useEstimatedGasTime({ chainId, speed }: { chainId: ChainId; speed: GasSpeed }): EstimatedGasTimeQuery {
  const selectedGas = useGasSettings(chainId, speed);
  return useMeteorology(
    { chainId },
    {
      select: useCallback((data: MeteorologyResult) => selectEstimatedGasTime(data, selectedGas), [selectedGas]),
    }
  );
}
