import { memoFn } from '../utils/memoFn';
/**
 * @desc subtracts two numbers
 * @param  {String}   str
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const containsEmoji = memoFn(str => {
  const ranges = ['(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])'];
  // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  return !!str.match(ranges.join('|'));
});

/*
 * Return the given number as a formatted string.  The default format is a plain
 * integer with thousands-separator commas.  The optional parameters facilitate
 * other formats:
 *   - decimals = the number of decimals places to round to and show
 *   - valueIfNaN = the value to show for non-numeric input
 *   - style
 *     - '%': multiplies by 100 and appends a percent symbol
 *     - '$': prepends a dollar sign
 *   - useOrderSuffix = whether to use suffixes like k for 1,000, etc.
 *   - orderSuffixes = the list of suffixes to use
 *   - minOrder and maxOrder allow the order to be constrained.  Examples:
 *     - minOrder = 1 means the k suffix should be used for numbers < 1,000
 *     - maxOrder = 1 means the k suffix should be used for numbers >= 1,000,000
 */
export function formatNumber(
  number: string | number,
  {
    decimals = 0,
    valueIfNaN = '',
    style = '',
    useOrderSuffix = false,
    orderSuffixes = ['', 'K', 'M', 'B', 'T'],
    minOrder = 0,
    maxOrder = Infinity,
  } = {}
) {
  let x = parseFloat(`${number}`);

  if (isNaN(x)) return valueIfNaN;

  if (style === '%') x *= 100.0;

  let order;
  if (!isFinite(x) || !useOrderSuffix) order = 0;
  else if (minOrder === maxOrder) order = minOrder;
  else {
    const unboundedOrder = Math.floor(Math.log10(Math.abs(x)) / 3);
    order = Math.max(0, minOrder, Math.min(unboundedOrder, maxOrder, orderSuffixes.length - 1));
  }

  const orderSuffix = orderSuffixes[order];
  if (order !== 0) x /= Math.pow(10, order * 3);

  return (
    (style === '$' ? '$' : '') +
    x.toLocaleString('en-US', {
      style: 'decimal',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    orderSuffix +
    (style === '%' ? '%' : '')
  );
}
