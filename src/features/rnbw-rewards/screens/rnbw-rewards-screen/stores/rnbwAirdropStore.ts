import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { getPlatformClient } from '@/resources/platform/client';
import { PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { Address } from 'viem';
import { convertAmountToNativeDisplayWorklet, handleSignificantDecimalsWithThreshold } from '@/helpers/utilities';

type AirdropStore = {
  getFormattedBalance: () => {
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
};

type AirdropResponse = PlatformResponse<AirdropResponseData>;

export const useRnbwAirdropStore = createQueryStore<AirdropResponseData, AirdropParams, AirdropStore>(
  {
    fetcher: fetchAirdrop,
    params: {
      currency: $ => $(userAssetsStoreManager).currency,
      address: $ => $(useWalletsStore).accountAddress,
    },
  },
  (_, get) => ({
    getFormattedBalance: () => {
      const data = get().getData();
      const currency = userAssetsStoreManager.getState().currency;
      const tokenAmount = data?.available.amountInDecimal ?? '0';
      const nativeCurrencyAmount = data?.available.value ?? '0';
      const isZero = tokenAmount === '0';

      return {
        tokenAmount: isZero ? '0' : handleSignificantDecimalsWithThreshold(tokenAmount, 2, 3, '0.01'),
        nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(nativeCurrencyAmount, currency, !isZero),
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
  { storageKey: 'airdropStore' }
);

async function fetchAirdrop({ address, currency }: AirdropParams): Promise<AirdropResponseData> {
  const response = await getPlatformClient().get<AirdropResponse>('/rewards/GetAirdropBalance', {
    params: {
      walletAddress: address,
      currency,
    },
  });

  return response.data.result;
}
