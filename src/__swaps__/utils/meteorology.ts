import { useQuery } from '@tanstack/react-query';

import { ChainId } from '@/state/backendNetworks/types';
import { rainbowMeteorologyGetData } from '@/handlers/gasFees';
import { abs, lessThan, subtract } from '@/helpers/utilities';
import { gweiToWei } from '@/parsers';
import { QueryConfig, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { useCallback } from 'react';
import { GasSettings } from '../screens/Swap/hooks/useCustomGas';
import { getSelectedGasSpeed, useGasSettings } from '../screens/Swap/hooks/useSelectedGas';
import { GasSpeed } from '../types/gas';
import { MeteorologyLegacyResponse, MeteorologyResponse } from '@/entities/gas';
import { getMinimalTimeUnitStringForMs } from '@/helpers/time';

// Query Types

export type MeteorologyArgs = {
  chainId: ChainId;
};

// ///////////////////////////////////////////////
// Query Key

const meteorologyQueryKey = ({ chainId }: MeteorologyArgs) => createQueryKey('meteorology', { chainId }, { persisterVersion: 1 });

type MeteorologyQueryKey = ReturnType<typeof meteorologyQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function meteorologyQueryFunction({ queryKey: [{ chainId }] }: QueryFunctionArgs<typeof meteorologyQueryKey>) {
  const parsedResponse = await rainbowMeteorologyGetData(chainId);
  const meteorologyData = parsedResponse.data as MeteorologyResponse | MeteorologyLegacyResponse;
  return meteorologyData;
}

export type MeteorologyResult = QueryFunctionResult<typeof meteorologyQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchMeteorology(
  { chainId }: MeteorologyArgs,
  config: QueryConfig<MeteorologyResult, Error, MeteorologyQueryKey> = {}
) {
  return await queryClient.fetchQuery(meteorologyQueryKey({ chainId }), meteorologyQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function useMeteorology<Selected = MeteorologyResult>(
  { chainId }: MeteorologyArgs,
  { select, enabled }: { select?: (data: MeteorologyResult) => Selected; enabled?: boolean }
) {
  return useQuery(meteorologyQueryKey({ chainId }), meteorologyQueryFunction, {
    select,
    enabled,
    refetchInterval: 12_000, // 12 seconds
    staleTime: 12_000, // 12 seconds
    cacheTime: 36_000, // 36 seconds
  });
}

function selectGasSuggestions({ data }: MeteorologyResult) {
  if ('legacy' in data) {
    const { fastGasPrice, proposeGasPrice, safeGasPrice } = data.legacy;
    return {
      urgent: {
        isEIP1559: false,
        gasPrice: gweiToWei(fastGasPrice),
      },
      fast: {
        isEIP1559: false,
        gasPrice: gweiToWei(proposeGasPrice),
      },
      normal: {
        isEIP1559: false,
        gasPrice: gweiToWei(safeGasPrice),
      },
    } as const;
  }

  const { baseFeeSuggestion, maxPriorityFeeSuggestions } = data;
  return {
    urgent: {
      isEIP1559: true,
      maxBaseFee: baseFeeSuggestion,
      maxPriorityFee: maxPriorityFeeSuggestions.urgent,
    },
    fast: {
      isEIP1559: true,
      maxBaseFee: baseFeeSuggestion,
      maxPriorityFee: maxPriorityFeeSuggestions.fast,
    },
    normal: {
      isEIP1559: true,
      maxBaseFee: baseFeeSuggestion,
      maxPriorityFee: maxPriorityFeeSuggestions.normal,
    },
  } as const;
}

export const getMeteorologyCachedData = (chainId: ChainId) => {
  return queryClient.getQueryData<MeteorologyResult>(meteorologyQueryKey({ chainId }));
};

function selectBaseFee({ data }: MeteorologyResult) {
  if ('legacy' in data) return undefined;
  return data.currentBaseFee;
}

export function useBaseFee<Selected = string>({
  chainId,
  enabled,
  select = s => s as Selected,
}: {
  chainId: ChainId;
  enabled?: boolean;
  select?: (c: string | undefined) => Selected;
}) {
  return useMeteorology({ chainId }, { select: d => select(selectBaseFee(d)), enabled });
}

export const getCachedCurrentBaseFee = (chainId: ChainId) => {
  const data = getMeteorologyCachedData(chainId);
  if (!data) return undefined;
  return selectBaseFee(data);
};

function selectGasTrend({ data }: MeteorologyResult) {
  if ('legacy' in data) return 'notrend';

  const trend = data.baseFeeTrend;
  if (trend === -1) return 'falling';
  if (trend === 1) return 'rising';
  if (trend === 2) return 'surging';
  if (trend === 0) return 'stable';
  return 'notrend';
}
export type GasTrend = ReturnType<typeof selectGasTrend>;

export function useGasTrend({ chainId }: { chainId: ChainId }) {
  return useMeteorology({ chainId }, { select: selectGasTrend });
}

const diff = (a: string, b: string) => abs(subtract(a, b));
function findClosestValue(target: string, array: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return array.find((value, index) => {
    const nextValue = array[index + 1];
    if (!nextValue) return true;
    return lessThan(diff(value, target), diff(nextValue, target));
  })!;
}

function selectEstimatedTime({ data }: MeteorologyResult, selectedGas: GasSettings | undefined) {
  if ('legacy' in data) return undefined;
  if (!selectedGas?.isEIP1559) return undefined;
  const value = findClosestValue(selectedGas.maxPriorityFee, Object.values(data?.confirmationTimeByPriorityFee || {}));
  const [time] = Object.entries(data?.confirmationTimeByPriorityFee || {}).find(([, v]) => v === value) || [];
  if (!time) return undefined;
  return `${+time >= 3600 ? '> ' : '~'}${getMinimalTimeUnitStringForMs(+time * 1000)}`;
}

export function useEstimatedTime({ chainId, speed }: { chainId: ChainId; speed: GasSpeed }) {
  const selectedGas = useGasSettings(chainId, speed);
  return useMeteorology(
    { chainId },
    {
      select: useCallback((data: MeteorologyResult) => selectEstimatedTime(data, selectedGas), [selectedGas]),
    }
  );
}

type GasSuggestions = ReturnType<typeof selectGasSuggestions>;
export type GasSuggestion = GasSuggestions[keyof GasSuggestions];
export function useMeteorologySuggestions({ chainId, enabled }: { chainId: ChainId; enabled?: boolean }) {
  return useMeteorology(
    { chainId },
    {
      select: useCallback((data: MeteorologyResult) => selectGasSuggestions(data), []),
      enabled,
    }
  );
}

export function useMeteorologySuggestion<Selected = GasSuggestion>({
  chainId,
  speed,
  enabled,
  select = s => s as Selected,
}: {
  chainId: ChainId;
  speed: GasSpeed;
  enabled?: boolean;
  select?: (d: GasSuggestion | undefined) => Selected;
}) {
  return useMeteorology(
    { chainId },
    {
      select: useCallback(
        (d: MeteorologyResult) => select(speed === GasSpeed.CUSTOM ? undefined : selectGasSuggestions(d)[speed]),
        [select, speed]
      ),
      enabled: enabled && speed !== 'custom',
    }
  );
}

const selectIsEIP1559 = ({ data }: MeteorologyResult) => !('legacy' in data);
export const useIsChainEIP1559 = (chainId: ChainId) => {
  const { data } = useMeteorology({ chainId }, { select: selectIsEIP1559 });
  if (data === undefined) return true;
  return data;
};

export const getCachedGasSuggestions = (chainId: ChainId) => {
  const data = getMeteorologyCachedData(chainId);
  if (!data) return undefined;
  return selectGasSuggestions(data);
};

export const getSelectedSpeedSuggestion = (chainId: ChainId) => {
  const suggestions = getCachedGasSuggestions(chainId);
  const speed = getSelectedGasSpeed(chainId);
  if (speed === 'custom') return;
  return suggestions?.[speed];
};
