import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { getPlatformClient } from '@/resources/platform/client';
import { type PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { ChainId } from '@/state/backendNetworks/types';
import { type Address } from 'viem';
import type { Tier } from '@/features/rnbw-membership/types';

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
