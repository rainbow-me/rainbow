import { NativeCurrencyKey } from '@/entities';
import { getAddysHttpClient } from '@/resources/addys/client';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { getWalletAddresses, useWalletsStore } from '@/state/wallets/walletsStore';
import { time } from '@/utils';
import { Address } from 'viem';
import { createQueryStore } from '../internal/createQueryStore';

export type WalletSummaryArgs = {
  addresses: Address[];
  currency: NativeCurrencyKey;
};

async function fetchWalletSummary(
  { addresses, currency }: WalletSummaryArgs,
  abortController: AbortController | null
): Promise<WalletSummary> {
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

export const useWalletSummary = () => {
  return useWalletSummaryQueryStore(state => state.summary?.data);
};

export const getWalletSummary = () => {
  return useWalletSummaryQueryStore.getState().summary;
};

export const refetchWalletSummary = () => {
  return useWalletSummaryQueryStore.getState().fetch(undefined, { force: true });
};

type WalletSummaryState = {
  summary: WalletSummary | null;
};

const useWalletSummaryQueryStore = createQueryStore<WalletSummary, WalletSummaryArgs, WalletSummaryState>(
  {
    fetcher: fetchWalletSummary,
    setData: ({ data, set }) => set({ summary: data }),
    params: {
      addresses: $ => $(useWalletsStore, state => getWalletAddresses(state.wallets)),
      currency: $ => $(userAssetsStoreManager).currency,
    },
    cacheTime: time.zero,
    keepPreviousData: true,
    maxRetries: 10,
    staleTime: time.minutes(2),
  },

  () => ({ summary: null }),

  { storageKey: 'walletSummaryStore' }
);

interface WalletSummary {
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
