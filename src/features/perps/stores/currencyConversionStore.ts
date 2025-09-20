import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { NativeCurrencyKey, NativeCurrencyKeys } from '@/entities/nativeCurrencyTypes';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { getPlatformClient } from '@/resources/platform/client';
import { PlatformResponse } from '@/resources/platform/types';

type CurrencyConversionParams = {
  toCurrency: NativeCurrencyKey;
};

type CurrencyConversionStore = {
  usdToNativeCurrencyConversionRate: number;
};

type CurrencyConversionResponse = PlatformResponse<{
  toCurrency: NativeCurrencyKey;
  fromCurrency: NativeCurrencyKey;
  conversionRate: string;
}>;

async function fetchCurrencyConversion({ toCurrency }: CurrencyConversionParams): Promise<CurrencyConversionStore> {
  if (toCurrency === NativeCurrencyKeys.USD) {
    return {
      usdToNativeCurrencyConversionRate: 1,
    };
  }

  const response = await getPlatformClient().get<CurrencyConversionResponse>('/rates/GetConversionRate', {
    params: {
      fromCurrency: NativeCurrencyKeys.USD.toLowerCase(),
      toCurrency: toCurrency.toLowerCase(),
    },
  });

  const { result } = response.data;

  return {
    usdToNativeCurrencyConversionRate: Number(result.conversionRate),
  };
}

export const useCurrencyConversionStore = createQueryStore<CurrencyConversionStore, CurrencyConversionParams, CurrencyConversionStore>({
  fetcher: fetchCurrencyConversion,
  cacheTime: time.days(1),
  params: {
    toCurrency: $ => $(userAssetsStoreManager).currency,
  },
  staleTime: time.minutes(10),
});
