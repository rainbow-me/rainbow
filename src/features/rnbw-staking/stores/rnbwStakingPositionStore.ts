import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { getPlatformClient } from '@/resources/platform/client';
import { type PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { ChainId } from '@/state/backendNetworks/types';
import { type Address } from 'viem';

type StakingTierLevel = 'STAKING_TIER_LEVEL_UNSPECIFIED' | string;

type StakingTier = {
  cashbackBps: number;
  level: StakingTierLevel;
  minStakeAmount: string;
  name: string;
};

type StakingPnl = {
  netProfit: string;
  totalCashbackReceived: string;
  totalExitFeePaid: string;
  totalRnbwStaked: string;
  totalRnbwUnstaked: string;
};

type StakingPositionData = {
  allTiers: StakingTier[];
  decimals: number;
  hasPosition: boolean;
  lastUpdateTime: string;
  pnl: StakingPnl;
  sessionPnl: StakingPnl;
  poolShares: string;
  stakedRnbw: string;
  stakedValueInCurrency: string;
  stakingStartTime: string;
  tier: StakingTier;
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
