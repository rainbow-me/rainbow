import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { getPlatformClient } from '@/resources/platform/client';
import { type PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { ChainId } from '@/state/backendNetworks/types';
import { decodeFunctionResult, encodeFunctionData, type Address, type Hex } from 'viem';
import type { Tier } from '@/features/rnbw-membership/types';
import { getProvider } from '@/handlers/web3';
import { DEFAULT_EXIT_FEE_PERCENTAGE, STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { logger, RainbowError } from '@/logger';

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
  exitFeePercentage: number | undefined;
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
  getExitFeePercentage: () => number;
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
    getExitFeePercentage: () => {
      return get().getData()?.exitFeePercentage ?? DEFAULT_EXIT_FEE_PERCENTAGE;
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

async function readExitFeePercentage(): Promise<number | undefined> {
  try {
    const provider = getProvider({ chainId: STAKING_CHAIN_ID });
    const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'exitFeeBps' });
    const result = await provider.call({ to: STAKING_CONTRACT_ADDRESS, data });
    const exitFeeBps = decodeFunctionResult({ abi: STAKING_ABI, functionName: 'exitFeeBps', data: result as Hex });
    return Number(exitFeeBps) / 100;
  } catch (e) {
    logger.error(new RainbowError('[readExitFeePercentage]: Failed to read exit fee percentage', e));
  }
}
