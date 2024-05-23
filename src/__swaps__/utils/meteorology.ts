import { useQuery } from '@tanstack/react-query';

import { ChainId } from '@/__swaps__/types/chains';
import { rainbowMeteorologyGetData } from '@/handlers/gasFees';
import { abs, lessThan, subtract } from '@/helpers/utilities';
import { QueryConfig, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { GasSpeed, getGasSettings } from '../screens/Swap/hooks/useSelectedGas';
import { getMinimalTimeUnitStringForMs } from './time';

// Query Types

export type MeteorologyResponse = {
  data: {
    baseFeeSuggestion: string;
    baseFeeTrend: number;
    blocksToConfirmationByBaseFee: {
      [baseFee: string]: string;
    };
    blocksToConfirmationByPriorityFee: {
      [priorityFee: string]: string;
    };
    confirmationTimeByPriorityFee: {
      [priorityFee: string]: string;
    };
    currentBaseFee: string;
    maxPriorityFeeSuggestions: {
      fast: string;
      normal: string;
      urgent: string;
    };
    secondsPerNewBlock: number;
    meta: {
      blockNumber: number;
      provider: string;
    };
  };
};

export type MeteorologyLegacyResponse = {
  data: {
    legacy: {
      fastGasPrice: string;
      proposeGasPrice: string;
      safeGasPrice: string;
    };
    meta: {
      blockNumber: number;
      provider: string;
    };
  };
};

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
  const network = getNetworkFromChainId(chainId);
  const parsedResponse = await rainbowMeteorologyGetData(network);
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
  { select, enabled }: { select?: (data: MeteorologyResult) => Selected; enabled?: boolean } = { select: data => data as Selected }
) {
  return useQuery(meteorologyQueryKey({ chainId }), meteorologyQueryFunction, {
    select,
    enabled,
    refetchInterval: 12_000, // 12 seconds
    staleTime: 12_000, // 12 seconds
    cacheTime: Infinity,
    notifyOnChangeProps: ['data'],
  });
}

function selectGasSuggestions({ data }: MeteorologyResult) {
  if ('legacy' in data) {
    const { fastGasPrice, proposeGasPrice, safeGasPrice } = data.legacy;
    return {
      urgent: {
        isEIP1559: false,
        gasPrice: fastGasPrice,
      },
      fast: {
        isEIP1559: false,
        gasPrice: proposeGasPrice,
      },
      normal: {
        isEIP1559: false,
        gasPrice: safeGasPrice,
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

function selectGasTrend({ data }: MeteorologyResult) {
  if ('legacy' in data) return 'notrend';

  const trend = data.baseFeeTrend;
  if (trend === -1) return 'falling';
  if (trend === 1) return 'rising';
  if (trend === 2) return 'surging';
  if (trend === 0) return 'stable';
  return 'notrend';
}

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

export function useEstimatedTime({ chainId, speed }: { chainId: ChainId; speed: GasSpeed }) {
  return useMeteorology(
    { chainId },
    {
      select: ({ data }) => {
        if ('legacy' in data) return undefined;
        const gasSettings = getGasSettings(speed, chainId);
        if (!gasSettings?.isEIP1559) return undefined;
        const value = findClosestValue(gasSettings.maxPriorityFee, Object.values(data.confirmationTimeByPriorityFee));
        const [time] = Object.entries(data.confirmationTimeByPriorityFee).find(([ms, v]) => v === value) || [];
        if (!time) return undefined;
        return `${+time >= 3600 ? '>' : '~'} ${getMinimalTimeUnitStringForMs(+time * 1000)}`;
      },
    }
  );
}

export const getCachedCurrentBaseFee = (chainId: ChainId) => {
  const data = getMeteorologyCachedData(chainId);
  if (!data) return undefined;
  return selectBaseFee(data);
};

export function useMeteorologySuggestions<Selected = ReturnType<typeof selectGasSuggestions>>({
  chainId,
  enabled,
  select = s => s as Selected,
}: {
  chainId: ChainId;
  enabled?: boolean;
  select?: (d: ReturnType<typeof selectGasSuggestions>) => Selected;
}) {
  return useMeteorology({ chainId }, { select: d => select(selectGasSuggestions(d)), enabled });
}

export const getCachedGasSuggestions = (chainId: ChainId) => {
  const data = getMeteorologyCachedData(chainId);
  if (!data) return undefined;
  return selectGasSuggestions(data);
};
