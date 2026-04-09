import type { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { convertAmountToNativeDisplay, divide, greaterThan } from '@/helpers/utilities';
import { memoFn } from '@/utils/memoFn';

export const bigNumberFormat = memoFn((value: string | number, nativeCurrency: NativeCurrencyKey, skipDecimals: boolean) => {
  'worklet';
  let ret;
  if (greaterThan(value, 1000000000)) {
    ret = `${convertAmountToNativeDisplay(divide(value, 1000000000), nativeCurrency)}b`;
  } else if (greaterThan(value, 1000000)) {
    ret = `${convertAmountToNativeDisplay(divide(value, 1000000), nativeCurrency)}m`;
  } else {
    ret = convertAmountToNativeDisplay(value, nativeCurrency, 3, skipDecimals);
  }
  return ret;
});
