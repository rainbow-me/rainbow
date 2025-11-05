import { NativeCurrencyKey, NativeCurrencyKeys } from '@/entities/nativeCurrencyTypes';
import { multiply } from '@/helpers/utilities';
import { getPlatformClient } from '@/resources/platform/client';
import { PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';

type CurrencyConversionStore = {
  convertToNativeCurrency: {
    (usdValue: number): number;
    (usdValue: string): string;
  };
  getConversionRate: () => number;
};

type CurrencyConversionData = {
  usdToNativeCurrencyConversionRate: number;
};

type CurrencyConversionParams = {
  toCurrency: NativeCurrencyKey;
};

export const useCurrencyConversionStore = createQueryStore<CurrencyConversionData, CurrencyConversionParams, CurrencyConversionStore>(
  {
    fetcher: fetchCurrencyConversion,
    cacheTime: time.days(1),
    params: {
      toCurrency: $ => $(userAssetsStoreManager).currency,
    },
    staleTime: time.minutes(10),
  },

  (_, get) => ({
    convertToNativeCurrency: buildCurrencyConverter(() => get().getConversionRate()),
    getConversionRate: () => get().getData()?.usdToNativeCurrencyConversionRate || 1,
  }),

  { storageKey: 'currencyConversionStore' }
);

/**
 * Builds an overloaded currency converter that works equivalently with
 * strings and numbers, respecting the type of the input in its output.
 */
function buildCurrencyConverter(getConversionRate: () => number): CurrencyConversionStore['convertToNativeCurrency'] {
  function convertToNativeCurrency(usdValue: number): number;
  function convertToNativeCurrency(usdValue: string): string;
  function convertToNativeCurrency(usdValue: number | string): number | string {
    const conversionRate = getConversionRate();
    const skipConversion = conversionRate === 1;
    switch (typeof usdValue) {
      case 'number':
        return skipConversion ? usdValue : multiply(usdValue, conversionRate);
      case 'string':
        return skipConversion ? usdValue : multiply(stripNonDecimalNumbers(usdValue), conversionRate);
    }
  }
  return convertToNativeCurrency;
}

type CurrencyConversionResponse = PlatformResponse<{
  toCurrency: NativeCurrencyKey;
  fromCurrency: NativeCurrencyKey;
  conversionRate: string;
}>;

async function fetchCurrencyConversion({ toCurrency }: CurrencyConversionParams): Promise<CurrencyConversionData> {
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
