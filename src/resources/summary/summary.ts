import { NativeCurrencyKey } from '@/entities';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';
import { getAddysHttpClient } from '@/resources/addys/client';

interface AddysSummary {
  data: {
    addresses: {
      [key: Address]: {
        meta: {
          rainbow: {
            transactions: number;
          };
          farcaster?: {
            object: string;
            fid: number;
            username: string;
            display_name: string;
            pfp_url: string;
            custody_address: string;
            profile: {
              Bio: {
                text: string;
              };
            };
            follower_count: number;
            following_count: number;
            verifications: string[];
            verified_addresses: {
              eth_addresses: string[];
              sol_addresses: string[];
            };
            verified_accounts: string[];
            power_badge: boolean;
          };
        };
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
          asset_value: number | null;
          claimables_value: number | null;
          positions_value: number | null;
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
            asset_value: number | null;
            claimables_value: number | null;
            positions_value: number | null;
          };
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

export const addysSummaryQueryKey = ({ addresses, currency }: AddysSummaryArgs) =>
  createQueryKey('addysSummary', { addresses, currency }, { persisterVersion: 2 });

type AddysSummaryQueryKey = ReturnType<typeof addysSummaryQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function addysSummaryQueryFunction({ queryKey: [{ addresses, currency }] }: QueryFunctionArgs<typeof addysSummaryQueryKey>) {
  const { data } = await getAddysHttpClient().post(
    `/summary`,
    JSON.stringify({
      currency,
      addresses,
      enableThirdParty: true,
    })
  );
  return data as AddysSummary;
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
  });
}
