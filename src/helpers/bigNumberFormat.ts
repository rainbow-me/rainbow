import { memoFn } from '../utils/memoFn';
import { supportedNativeCurrencies } from '@rainbow-me/references';
import {
  convertAmountToNativeDisplay,
  divide,
  greaterThan,
} from '@rainbow-me/utilities';

export const bigNumberFormat = memoFn(
  (
    value: string | number,
    nativeCurrency: keyof typeof supportedNativeCurrencies,
    skipDecimals: boolean
  ) => {
    let ret;
    if (greaterThan(value, 1000000000)) {
      ret = `${convertAmountToNativeDisplay(
        divide(value, 1000000000),
        nativeCurrency
      )}b`;
    } else if (greaterThan(value, 1000000)) {
      ret = `${convertAmountToNativeDisplay(
        divide(value, 1000000),
        nativeCurrency
      )}m`;
    } else {
      ret = convertAmountToNativeDisplay(
        value,
        nativeCurrency,
        3,
        skipDecimals
      );
    }
    return ret;
  }
);
