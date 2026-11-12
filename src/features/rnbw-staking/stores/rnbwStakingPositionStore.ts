import { createQueryStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { type NativeCurrencyKey } from '@/features/currency/types';
import { ChainId } from '@/features/network/types/backendNetworks';
import { rnbwMembershipAnalyticsActions } from '@/features/rnbw-membership/stores/rnbwMembershipAnalyticsStore';
import type { Tier } from '@/features/rnbw-membership/types';
import { getPlatformClient } from '@/resources/platform/client';
import { type PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletsStore } from '@/state/wallets/walletsStore';

type StakingPnl = {
  netProfit: string;
  totalCashbackReceived: string;
  totalExitFeePaid: string;
  totalRnbwStaked: string;
  totalRnbwUnstaked: string;
  exchangeRateGain: string;
};

export type StakingPositionData = {
  allTiers: Tier[];
  decimals: number;
  hasPosition: boolean;
  lastUpdateTime: string;
  pnl: StakingPnl;
  sessionPnl: StakingPnl;
  poolShares: string;
  stakedRnbw: string;
  stakedValueInCurrency: string;
  stakingStartTime: string;
  tier: Tier;
};

type StakingPositionParams = {
  currency: NativeCurrencyKey;
  address: Address;
};

type StakingPositionStore = {
  hasPosition: () => boolean;
};

export const useStakingPositionStore = createQueryStore<StakingPositionData, StakingPositionParams, StakingPositionStore>(
  {
    fetcher: fetchStakingPosition,
    onFetched: ({ data, params }) => {
      requestIdleCallback(() => {
        rnbwMembershipAnalyticsActions.recordPosition({
          address: params.address,
          position: {
            stakedRnbwRaw: data.stakedRnbw,
            tier: data.tier.level,
          },
          allTiers: data.allTiers,
        });
      });
    },
    params: {
      currency: $ => $(userAssetsStoreManager).currency,
      address: $ => $(useWalletsStore).accountAddress,
    },
  },
  (_, get) => ({
    hasPosition: () => {
      const data = get().getData();
      return data?.hasPosition ?? false;
    },
  }),
  { storageKey: 'rnbwStakingPosition' }
);

type StakingPositionResponse = PlatformResponse<StakingPositionData>;

async function fetchStakingPosition({ currency, address }: StakingPositionParams): Promise<StakingPositionData> {
  const response = await getPlatformClient().get<StakingPositionResponse>('/staking/GetStakingPosition', {
    params: {
      walletAddress: address,
      chainId: String(ChainId.base),
      currency,
      includeTiers: String(true),
    },
  });

  return response.data.result;
}
