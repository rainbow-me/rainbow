import { convertAmountToNativeDisplay } from '@rainbow-me/utilities';

export const bigNumberFormat = (num, nativeCurrency, skipDecimals) => {
  let ret;
  if (num > 1000000000) {
    ret = `${convertAmountToNativeDisplay(
      (num / 1000000000).toString(),
      nativeCurrency
    )}b`;
  } else if (num > 1000000) {
    ret = `${convertAmountToNativeDisplay(
      (num / 1000000).toString(),
      nativeCurrency
    )}m`;
  } else {
    ret = convertAmountToNativeDisplay(
      num.toString(),
      nativeCurrency,
      3,
      skipDecimals
    );
    num.toFixed(2);
  }

  return ret;
};
