import { createQueryStore } from '@storesjs/stores';

import { stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { time } from '@/framework/core/utils/time';
import { multiply } from '@/helpers/utilities';
import { getPlatformClient } from '@/resources/platform/client';
import { type PlatformResponse } from '@/resources/platform/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { NativeCurrencyKeys, type NativeCurrencyKey } from '../types';

type CurrencyConverter = {
  (value: number): number;
  (value: string): string;
};

type CurrencyConversionStore = {
  convertToNativeCurrency: CurrencyConverter;
  convertToUsd: CurrencyConverter;
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
    convertToUsd: buildCurrencyConverter(() => 1 / get().getConversionRate()),
    getConversionRate: () => get().getData()?.usdToNativeCurrencyConversionRate || 1,
  }),

  { storageKey: 'currencyConversionStore' }
);

/**
 * Builds an overloaded currency converter that works equivalently with
 * strings and numbers, respecting the type of the input in its output.
 */
function buildCurrencyConverter(getRate: () => number): CurrencyConverter {
  function convert(value: number): number;
  function convert(value: string): string;
  function convert(value: number | string): number | string {
    const rate = getRate();
    const skipConversion = rate === 1;
    switch (typeof value) {
      case 'number':
        return skipConversion ? value : multiply(value, rate);
      case 'string':
        return skipConversion ? value : multiply(stripNonDecimalNumbers(value), rate);
    }
  }
  return convert;
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
