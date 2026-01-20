import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { getPlatformClient } from '@/resources/platform/client';
import { PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { Address } from 'viem';
import { convertAmountToNativeDisplayWorklet, convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { ChainId } from '@/state/backendNetworks/types';

type RnbwRewardsStore = {
  getBalance: () => {
    tokenAmount: string;
    nativeCurrencyAmount: string;
  };
};

type RnbwRewardsData = {
  claimableRnbw: string;
  claimableValueInCurrency: string;
  decimals: number;
  hasPendingClaim: boolean;
};

type RnbwRewardsParams = {
  currency: NativeCurrencyKey;
  address: Address;
};

export const useRnbwRewardsStore = createQueryStore<RnbwRewardsData, RnbwRewardsParams, RnbwRewardsStore>(
  {
    fetcher: fetchRnbwRewards,
    cacheTime: time.days(1),
    params: {
      currency: $ => $(userAssetsStoreManager).currency,
      address: $ => $(useWalletsStore).accountAddress,
    },
  },

  (_, get) => ({
    getBalance: () => {
      const data = get().getData();
      const currency = userAssetsStoreManager.getState().currency;

      if (!data) {
        return {
          tokenAmount: '0',
          nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(0, currency, false),
        };
      }
      const isZero = Number(data.claimableValueInCurrency) === 0;
      console.log('claimableValueInCurrency', data.claimableValueInCurrency);
      return {
        tokenAmount: convertRawAmountToDecimalFormat(data.claimableRnbw, data.decimals),
        nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(data.claimableValueInCurrency, currency, !isZero),
      };
    },
  }),

  { storageKey: 'rnbwRewardsStore' }
);

type RnbwRewardsResponse = PlatformResponse<{
  claimableRnbw: string;
  claimableValueInCurrency: string;
  decimals: number;
  hasPendingClaim: boolean;
}>;

async function fetchRnbwRewards({ currency, address }: RnbwRewardsParams): Promise<RnbwRewardsData> {
  const response = await getPlatformClient().get<RnbwRewardsResponse>('/rewards/GetRewardsBalance', {
    params: {
      walletAddress: address,
      chainId: String(ChainId.base),
      currency,
    },
  });

  return response.data.result;
}
