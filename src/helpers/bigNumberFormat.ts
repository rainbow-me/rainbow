// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { convertAmountToNativeDisplay } from '@rainbow-me/utilities';

export const bigNumberFormat = (
  num: any,
  nativeCurrency: any,
  skipDecimals: any
) => {
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
