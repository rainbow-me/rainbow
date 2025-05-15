import { NativeCurrencyKey } from '@/entities';
import { createQueryKey } from '@/react-query';
import { Address } from 'viem';
import { getAddysHttpClient } from '@/resources/addys/client';
import { createQueryStore } from '../../state/internal/createQueryStore';
import { time } from '../../utils';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

export type AddysSummaryArgs = {
  addresses: Address[];
  currency: NativeCurrencyKey;
};

export const addysSummaryQueryKey = ({ addresses, currency }: AddysSummaryArgs) =>
  createQueryKey('addysSummary', { addresses, currency }, { persisterVersion: 2 });

export async function getAddysSummary(
  { addresses, currency }: AddysSummaryArgs,
  abortController: AbortController | null
): Promise<AddysSummary> {
  const { data } = await getAddysHttpClient({ abortController }).post(
    `/summary`,
    JSON.stringify({
      currency,
      addresses,
      enableThirdParty: true,
    })
  );
  return data;
}

export const useAddysSummary = () => {
  return useAddysQueryStore(state => [state.getData(), state.getStatus()] as const);
};

export const refetchAddysSummary = () => {
  return useAddysQueryStore.getState().fetch();
};

const useAddysQueryStore = createQueryStore<AddysSummary, AddysSummaryArgs>(
  {
    fetcher: getAddysSummary,
    params: {
      addresses: $ => $(useWalletsStore).walletsAddresses,
      currency: $ => $(userAssetsStoreManager).currency,
    },
    staleTime: time.minutes(1),
    cacheTime: time.hours(24),
    retryDelay: time.minutes(2),
  },
  () => ({
    data: null,
  }),
  {
    storageKey: 'addysSummary',
  }
);

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
