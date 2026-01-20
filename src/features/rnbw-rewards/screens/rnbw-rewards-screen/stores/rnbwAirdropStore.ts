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
  hasClaimed: () => boolean;
  hasClaimableAirdrop: () => boolean;
};

type AirdropParams = {
  address: Address;
  currency: NativeCurrencyKey;
};

type AirdropResponseData = {
  airdropped: {
    amountInDecimal: string;
    amountInWei: string;
    value: string;
  };
  available: {
    amountInDecimal: string;
    amountInWei: string;
    value: string;
  };
  rnbwPrice: string;
  message?: string;
  // TODO: why is this structured differently than other responses?
  // "errors": [
  //   "string"
  // ],
  // "message": "string",
  // "metadata": {
  //   "currency": "string",
  //   "pagination": {
  //     "next": "string"
  //   },
  //   "requestId": "string",
  //   "requestTime": "2026-01-20T15:18:17.712Z",
  //   "responseTime": "2026-01-20T15:18:17.712Z",
  //   "success": true,
  //   "version": "string"
  // };
};

type AirdropResponse = PlatformResponse<AirdropResponseData>;

export const useRnbwAirdropStore = createQueryStore<AirdropResponseData, AirdropParams, AirdropStore>(
  {
    fetcher: fetchAirdrop,
    cacheTime: time.days(0),
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
      if (!data) {
        return {
          tokenAmount: '0',
          nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(0, currency, false),
        };
      }
      return {
        tokenAmount: convertRawAmountToDecimalFormat(data.airdropped.amountInDecimal, 18),
        nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(data.airdropped.value, currency, false),
        // nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(data.claimableValueInCurrency, currency, !isZero),
      };
    },
    hasClaimed: () => {
      const data = get().getData();
      return data?.available.amountInDecimal !== data?.airdropped.amountInDecimal;
    },
    hasClaimableAirdrop: () => {
      const data = get().getData();
      return data?.available.amountInDecimal !== '0';
    },
  }),
  { storageKey: 'airdropStore', version: 1 }
);

async function fetchAirdrop({ address, currency }: AirdropParams): Promise<AirdropResponseData> {
  const response = await getPlatformClient().get<AirdropResponse>('/rewards/GetAirdropBalance', {
    params: {
      walletAddress: address,
      currency,
    },
  });

  // @ts-ignore - backend response shape needs to be fixed
  const data = response.data as AirdropResponseData;

  return {
    airdropped: {
      amountInDecimal: data.airdropped.amountInDecimal,
      amountInWei: data.airdropped.amountInWei,
      value: data.airdropped.value,
    },
    available: {
      amountInDecimal: data.available.amountInDecimal,
      amountInWei: data.available.amountInWei,
      value: data.available.value,
    },
    rnbwPrice: data.rnbwPrice,
    message: data.message,
  };
}
