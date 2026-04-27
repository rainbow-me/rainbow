import { createQueryStore } from '@storesjs/stores';
import { decodeFunctionResult, encodeFunctionData, type Address, type Hex } from 'viem';

import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { rnbwMembershipAnalyticsActions } from '@/features/rnbw-membership/stores/rnbwMembershipAnalyticsStore';
import type { Tier } from '@/features/rnbw-membership/types';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { type PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';

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
  exitFeePercentage: number;
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
  getExitFeePercentage: () => number | undefined;
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
    getExitFeePercentage: () => {
      return get().getData()?.exitFeePercentage;
    },
    hasPosition: () => {
      const data = get().getData();
      return data?.hasPosition ?? false;
    },
  }),
  { storageKey: 'rnbwStakingPosition' }
);

type StakingPositionResponse = PlatformResponse<Omit<StakingPositionData, 'exitFeePercentage'>>;

async function fetchStakingPosition({ currency, address }: StakingPositionParams): Promise<StakingPositionData> {
  const [response, exitFeePercentage] = await Promise.all([
    getPlatformClient().get<StakingPositionResponse>('/staking/GetStakingPosition', {
      params: {
        walletAddress: address,
        chainId: String(ChainId.base),
        currency,
        includeTiers: String(true),
      },
    }),
    readExitFeePercentage(),
  ]);

  return { ...response.data.result, exitFeePercentage };
}

async function readExitFeePercentage(): Promise<number> {
  try {
    const provider = getProvider({ chainId: STAKING_CHAIN_ID });
    const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'exitFeeBps' });
    const result = await provider.call({ to: STAKING_CONTRACT_ADDRESS, data });
    const exitFeeBps = decodeFunctionResult({ abi: STAKING_ABI, functionName: 'exitFeeBps', data: result as Hex });
    return Number(exitFeeBps) / 100;
  } catch (e) {
    logger.error(new RainbowError('[readExitFeePercentage]: Failed to read exit fee percentage', e));
    throw e;
  }
}
