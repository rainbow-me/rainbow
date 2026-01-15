import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { getPlatformClient } from '@/resources/platform/client';
import { PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { Address } from 'viem';
import { convertAmountToNativeDisplayWorklet, convertRawAmountToDecimalFormat } from '@/helpers/utilities';

type AirdropStore = {
  getBalance: () => {
    tokenAmount: string;
    nativeCurrencyAmount: string;
  };
};

type AirdropData = {
  claimableRnbw: string;
  claimableValueInCurrency: string;
  decimals: number;
  hasPendingClaim: boolean;
  hasClaimed: boolean;
};

type AirdropParams = {
  currency: NativeCurrencyKey;
  address: Address;
};

export const useAirdropStore = createQueryStore<AirdropData, AirdropParams, AirdropStore>(
  {
    fetcher: fetchAirdrop,
    cacheTime: time.days(1),
    params: {
      currency: $ => $(userAssetsStoreManager).currency,
      address: $ => $(useWalletsStore).accountAddress,
    },
    staleTime: time.minutes(10),
  },

  (_, get) => ({
    getBalance: () => {
      const data = get().getData();
      const currency = userAssetsStoreManager.getState().currency;
      if (!data)
        return {
          tokenAmount: '0',
          nativeCurrencyAmount: '0',
        };
      return {
        tokenAmount: convertRawAmountToDecimalFormat(data.claimableRnbw, data.decimals),
        nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(data.claimableValueInCurrency, currency),
      };
    },
  }),

  { storageKey: 'airdropStore' }
);

async function fetchAirdrop({ currency, address }: AirdropParams): Promise<AirdropData> {
  // TODO: blocked by backend

  return {
    claimableRnbw: '1253371.2345',
    claimableValueInCurrency: '1234.56',
    decimals: 18,
    hasPendingClaim: false,
    hasClaimed: false,
  };
}
