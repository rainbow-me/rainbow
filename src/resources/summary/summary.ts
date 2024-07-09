import { NativeCurrencyKey } from '@/entities';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { Address } from 'viem';

const addysHttp = new RainbowFetchClient({
  baseURL: 'https://addys.p.rainbow.me/v3',
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

export interface AddySummary {
  data: {
    addresses: {
      [key: Address]: {
        summary: {
          native_balance_by_symbol: {
            [key in 'ETH' | 'MATIC' | 'BNB' | 'AVAX']: {
              symbol: string;
              quantity: string;
              decimals: number;
            };
          };
          num_erc20s: number;
          last_activity: number;
          asset_value: number;
        };
      };
      summary_by_chain: {
        [key: number]: {
          native_balance: {
            symbol: string;
            quantity: string;
            decimals: number;
          };
          num_erc20s: number;
          last_activity: number;
          asset_value: number;
        };
      };
    };
  };
}

// ///////////////////////////////////////////////
// Query Types

export type AddysSummaryArgs = {
  addresses: Address[];
  currency: NativeCurrencyKey;
};

// ///////////////////////////////////////////////
// Query Key

const addysSummaryQueryKey = ({ addresses, currency }: AddysSummaryArgs) =>
  createQueryKey('addysSummary', { addresses, currency }, { persisterVersion: 1 });

type AddysSummaryQueryKey = ReturnType<typeof addysSummaryQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function addysSummaryQueryFunction({ queryKey: [{ addresses, currency }] }: QueryFunctionArgs<typeof addysSummaryQueryKey>) {
  const { data } = await addysHttp.post(
    `/summary`,
    JSON.stringify({
      currency,
      addresses,
    })
  );
  return data as AddySummary;
}

type AddysSumaryResult = QueryFunctionResult<typeof addysSummaryQueryFunction>;

// ///////////////////////////////////////////////
// Query Hook

export function useAddysSummary(
  { addresses, currency }: AddysSummaryArgs,
  config: QueryConfigWithSelect<AddysSumaryResult, Error, AddysSumaryResult, AddysSummaryQueryKey> = {}
) {
  return useQuery(addysSummaryQueryKey({ addresses, currency }), addysSummaryQueryFunction, {
    ...config,
    staleTime: 1000 * 60 * 2, // Set data to become stale after 2 minutes
    cacheTime: 1000 * 60 * 60 * 24, // Keep unused data in cache for 24 hours
    keepPreviousData: true, // Use previous data while new data is loading after it becomes stale
  });
}
