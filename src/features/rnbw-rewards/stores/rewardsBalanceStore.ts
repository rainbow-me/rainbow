import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { getPlatformClient } from '@/resources/platform/client';
import { PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { Address } from 'viem';
import { convertAmountToNativeDisplayWorklet, convertRawAmountToDecimalFormat, truncateToDecimalsWithThreshold } from '@/helpers/utilities';
import { ChainId } from '@/state/backendNetworks/types';

type RewardsBalanceStore = {
  getFormattedBalance: () => {
    tokenAmount: string;
    nativeCurrencyAmount: string;
  };
  hasClaimableRewards: () => boolean;
};

type RewardsBalanceData = {
  claimableRnbw: string;
  claimableValueInCurrency: string;
  decimals: number;
  hasPendingClaim: boolean;
};

type RewardsBalanceParams = {
  currency: NativeCurrencyKey;
  address: Address;
};

export const useRewardsBalanceStore = createQueryStore<RewardsBalanceData, RewardsBalanceParams, RewardsBalanceStore>(
  {
    fetcher: fetchRewardsBalance,
    params: {
      currency: $ => $(userAssetsStoreManager).currency,
      address: $ => $(useWalletsStore).accountAddress,
    },
  },
  (_, get) => ({
    getFormattedBalance: () => {
      const data = get().getData();
      const currency = userAssetsStoreManager.getState().currency;
      const rawTokenAmount = data?.claimableRnbw ?? '0';
      const nativeCurrencyAmount = data?.claimableValueInCurrency ?? '0';
      const decimals = data?.decimals ?? 18;
      const isZero = rawTokenAmount === '0';
      const tokenAmount = convertRawAmountToDecimalFormat(rawTokenAmount, decimals);
      const formattedTokenAmount = truncateToDecimalsWithThreshold({ value: tokenAmount, decimals: 1, threshold: '0.01' });

      return {
        tokenAmount: isZero ? '0' : formattedTokenAmount,
        nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(nativeCurrencyAmount, currency, !isZero),
      };
    },
    hasClaimableRewards: () => {
      const data = get().getData();
      return data?.claimableRnbw !== '0';
    },
  }),

  { storageKey: 'rnbwRewardsStore' }
);

type RewardsBalanceResponse = PlatformResponse<{
  claimableRnbw: string;
  claimableValueInCurrency: string;
  decimals: number;
  hasPendingClaim: boolean;
}>;

async function fetchRewardsBalance({ currency, address }: RewardsBalanceParams): Promise<RewardsBalanceData> {
  const response = await getPlatformClient().get<RewardsBalanceResponse>('/rewards/GetRewardsBalance', {
    params: {
      walletAddress: address,
      chainId: String(ChainId.base),
      currency,
    },
  });

  return response.data.result;
}
