import { memoFn } from '../utils/memoFn';
import { convertAmountToNativeDisplay } from '@rainbow-me/utilities';

export const bigNumberFormat = memoFn((num, nativeCurrency, skipDecimals) => {
  let ret;
  // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  if (num > 1000000000) {
    ret = `${convertAmountToNativeDisplay(
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      (num / 1000000000).toString(),
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
      nativeCurrency
    )}b`;
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  } else if (num > 1000000) {
    ret = `${convertAmountToNativeDisplay(
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      (num / 1000000).toString(),
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
      nativeCurrency
    )}m`;
  } else {
    ret = convertAmountToNativeDisplay(
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      num.toString(),
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
      nativeCurrency,
      3,
      skipDecimals
    );
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    num.toFixed(2);
  }

  return ret;
});
