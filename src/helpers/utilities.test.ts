import BigNumber from 'bignumber.js';
import {
  abs,
  abbreviateBigNumber,
  abbreviateNumber,
  add,
  addBuffer,
  addDisplay,
  convertAmountFromNativeValue,
  convertAmountToRawAmount,
  convertBipsToPercentage,
  convertHexToString,
  convertNumberToString,
  convertRawAmountToDecimalFormat,
  convertStringToHex,
  convertStringToNumber,
  countDecimalPlaces,
  divide,
  flattenDeep,
  floorDivide,
  formatFixedDecimals,
  formatNumber,
  fraction,
  fromWei,
  getFormattedTimeQuantity,
  greaterThan,
  greaterThanOrEqualTo,
  handleSignificantDecimals,
  handleSignificantDecimalsWithThreshold,
  isEqual,
  isPositive,
  isZero,
  lessThan,
  mod,
  multiply,
  omitBy,
  omitFlatten,
  pickBy,
  pickShallow,
  roundToSignificant1or5,
  subtract,
  times,
  toFixedDecimals,
  toSignificantDigits,
  updatePrecisionToDisplay,
} from './utilities';

it('convertAmountFromNativeValue', () => {
  const result = convertAmountFromNativeValue('1', '40.00505', 5);
  expect(result).toBe('0.02499');
});

it('convertAmountFromNativeValue with trailing zeros', () => {
  const result = convertAmountFromNativeValue('1', '1', 5);
  expect(result).toBe('1');
});

it('handleSignificantDecimals greater than 1, decimals 2', () => {
  const result = handleSignificantDecimals('5.123', 2);
  expect(result).toBe('5.12');
});

it('handleSignificantDecimals greater than 1, decimals 18', () => {
  const result = handleSignificantDecimals('5.1234', 18);
  expect(result).toBe('5.123');
});

it('handleSignificantDecimals greater than 1, decimals 18, long trail', () => {
  const result = handleSignificantDecimals('5.00001234', 18);
  expect(result).toBe('5.00');
});

it('handleSignificantDecimals less than 1 and few decimals', () => {
  const result = handleSignificantDecimals('0.012344', 2);
  expect(result).toBe('0.0123');
});

it('handleSignificantDecimals less than 1 and many decimals', () => {
  const result = handleSignificantDecimals('0.00000000123', 18);
  expect(result).toBe('0.00');
});

it('convertBipsToPercentage, 2 decimal places', () => {
  const result = convertBipsToPercentage('1', 2);
  expect(result).toBe('0.01');
});

it('convertBipsToPercentage, 1 decimal place', () => {
  const result = convertBipsToPercentage('1', 1);
  expect(result).toBe('0.0');
});

it('convertBipsToPercentage, 10 bips to 1 decimal', () => {
  const result = convertBipsToPercentage('10', 1);
  expect(result).toBe('0.1');
});

it('convertBipsToPercentage, returns 0 when given nullish value', () => {
  const result = convertBipsToPercentage(null, 1);
  expect(result).toBe('0');
});

it('convertBipsToPercentage', () => {
  const result = convertBipsToPercentage('12.34567', 2);
  expect(result).toBe('0.12');
});

it('updatePrecisionToDisplay1', () => {
  const result = updatePrecisionToDisplay('0.00000000123', '0.1234987234');
  expect(result).toBe('0.000000001');
});

it('updatePrecisionToDisplay1RoundUp', () => {
  const result = updatePrecisionToDisplay('0.00000000123', '0.1234987234', true);
  expect(result).toBe('0.000000002');
});

it('updatePrecisionToDisplay2', () => {
  const result = updatePrecisionToDisplay('0.17987196800000002', '0.1234987234');
  expect(result).toBe('0.179');
});

it('updatePrecisionToDisplay2RoundUp', () => {
  const result = updatePrecisionToDisplay('0.17987196800000002', '0.1234987234', true);
  expect(result).toBe('0.18');
});

it('updatePrecisionToDisplay3', () => {
  const result = updatePrecisionToDisplay('0.123456789', '3.001');
  expect(result).toBe('0.123');
});

it('updatePrecisionToDisplay3RoundUp', () => {
  const result = updatePrecisionToDisplay('0.123456789', '3.001', true);
  expect(result).toBe('0.124');
});

it('updatePrecisionToDisplay4', () => {
  const result = updatePrecisionToDisplay('0.123456789', '32.0412');
  expect(result).toBe('0.1234');
});

it('updatePrecisionToDisplay4RoundUp', () => {
  const result = updatePrecisionToDisplay('0.123456789', '32.0412', true);
  expect(result).toBe('0.1235');
});

it('updatePrecisionToDisplay5', () => {
  const result = updatePrecisionToDisplay('0.123456789', '132.0051');
  expect(result).toBe('0.12345');
});

it('updatePrecisionToDisplay5RoundUp', () => {
  const result = updatePrecisionToDisplay('0.123456789', '132.0051', true);
  expect(result).toBe('0.12346');
});

it('updatePrecisionToDisplay6', () => {
  const result = updatePrecisionToDisplay('0.123456789', '1320.0112');
  expect(result).toBe('0.123456');
});

it('updatePrecisionToDisplay6RoundUp', () => {
  const result = updatePrecisionToDisplay('0.123456789', '1320.0112', true);
  expect(result).toBe('0.123457');
});

it('addDisplay', () => {
  const result = addDisplay('$150.50', '$912.21');
  expect(result).toBe('$1,062.71');
});

it('addDisplay with large numbers', () => {
  const result = addDisplay('$1,002,000.50', '$13,912.21');
  expect(result).toBe('$1,015,912.71');
});

it('addDisplay with left-aligned currency', () => {
  const result = addDisplay('A$150.50', 'A$912.21');
  expect(result).toBe('A$1,062.71');
});

it('addDisplay with right-aligned currency', () => {
  const result = addDisplay('150.50₽', '912.21₽');
  expect(result).toBe('1,062.71₽');
});

// --- abs ---

it('abs returns absolute value of positive', () => {
  expect(abs('5')).toBe('5');
});

it('abs returns absolute value of negative', () => {
  expect(abs('-5.5')).toBe('5.5');
});

it('abs returns 0 for zero', () => {
  expect(abs('0')).toBe('0');
});

// --- isPositive / isZero ---

it('isPositive returns true for positive number', () => {
  expect(isPositive('1')).toBe(true);
});

it('isPositive returns true for zero (BigNumber considers 0 positive)', () => {
  expect(isPositive('0')).toBe(true);
});

it('isPositive returns false for negative', () => {
  expect(isPositive('-0.001')).toBe(false);
});

it('isZero returns true for zero string', () => {
  expect(isZero('0')).toBe(true);
});

it('isZero returns false for non-zero', () => {
  expect(isZero('0.001')).toBe(false);
});

// --- add / subtract / multiply / divide / mod / floorDivide ---

it('add returns sum as string', () => {
  expect(add('1.5', '2.5')).toBe('4');
});

it('subtract returns difference as string', () => {
  expect(subtract('10', '3.5')).toBe('6.5');
});

it('multiply returns product as string', () => {
  expect(multiply('3', '4')).toBe('12');
});

it('divide returns quotient as string', () => {
  expect(divide('10', '4')).toBe('2.5');
});

it('divide returns 0 when both args are falsy', () => {
  expect(divide('0', '0')).toBe('0');
});

it('mod returns remainder as string', () => {
  expect(mod('10', '3')).toBe('1');
});

it('floorDivide returns integer quotient', () => {
  expect(floorDivide('10', '3')).toBe('3');
});

it('addBuffer multiplies by default 1.2 buffer and floors', () => {
  expect(addBuffer('100')).toBe('120');
});

it('addBuffer uses custom buffer', () => {
  expect(addBuffer('100', '1.5')).toBe('150');
});

// --- greaterThan / greaterThanOrEqualTo / lessThan / isEqual ---

it('greaterThan returns true when first > second', () => {
  expect(greaterThan('2', '1')).toBe(true);
});

it('greaterThan returns false when equal', () => {
  expect(greaterThan('1', '1')).toBe(false);
});

it('greaterThanOrEqualTo returns true when equal', () => {
  expect(greaterThanOrEqualTo('1', '1')).toBe(true);
});

it('greaterThanOrEqualTo returns false when less', () => {
  expect(greaterThanOrEqualTo('0.9', '1')).toBe(false);
});

it('lessThan returns true when first < second', () => {
  expect(lessThan('1', '2')).toBe(true);
});

it('lessThan returns false when equal', () => {
  expect(lessThan('1', '1')).toBe(false);
});

it('isEqual returns true for equal values', () => {
  expect(isEqual('1.0', '1')).toBe(true);
});

it('isEqual returns false for different values', () => {
  expect(isEqual('1', '2')).toBe(false);
});

// --- fraction ---

it('fraction computes target * numerator / denominator', () => {
  expect(fraction('100', '1', '4')).toBe('25');
});

it('fraction returns 0 when target is empty string (falsy guard)', () => {
  expect(fraction('', '1', '4')).toBe('0');
});

// --- type conversions ---

it('convertNumberToString converts number to string', () => {
  expect(convertNumberToString(1.5)).toBe('1.5');
});

it('convertStringToNumber converts string to number', () => {
  expect(convertStringToNumber('3.14')).toBe(3.14);
});

it('convertHexToString converts hex to decimal string', () => {
  expect(convertHexToString('0xff')).toBe('255');
});

it('convertStringToHex converts decimal string to hex', () => {
  expect(convertStringToHex('255')).toBe('ff');
});

it('toFixedDecimals rounds to given decimal places', () => {
  expect(toFixedDecimals('1.23456', 3)).toBe('1.235');
});

it('formatFixedDecimals strips trailing zeros after rounding', () => {
  expect(formatFixedDecimals('1.50000', 2)).toBe('1.5');
});

// --- token amount conversions ---

it('convertAmountToRawAmount shifts by decimals', () => {
  expect(convertAmountToRawAmount('1', 18)).toBe('1000000000000000000');
});

it('convertAmountToRawAmount handles 6 decimals (USDC)', () => {
  expect(convertAmountToRawAmount('1', 6)).toBe('1000000');
});

it('convertRawAmountToDecimalFormat shifts back', () => {
  expect(convertRawAmountToDecimalFormat('1000000000000000000', 18)).toBe('1');
});

it('fromWei converts 1 ether in wei to 1', () => {
  expect(fromWei('1000000000000000000')).toBe('1');
});

it('fromWei converts 0.5 ether in wei', () => {
  expect(fromWei('500000000000000000')).toBe('0.5');
});

// --- countDecimalPlaces ---

it('countDecimalPlaces returns 0 for integer', () => {
  expect(countDecimalPlaces('100')).toBe(0);
});

it('countDecimalPlaces counts decimal places', () => {
  expect(countDecimalPlaces('1.2345')).toBe(4);
});

// --- handleSignificantDecimalsWithThreshold ---

it('handleSignificantDecimalsWithThreshold returns threshold prefix for small values', () => {
  const result = handleSignificantDecimalsWithThreshold('0.00001', 6);
  expect(result).toBe('< 0.0001');
});

it('handleSignificantDecimalsWithThreshold returns formatted value above threshold', () => {
  const result = handleSignificantDecimalsWithThreshold('0.5', 6);
  expect(result).toBe('0.50');
});

// --- abbreviateNumber ---

it('abbreviateNumber below 1000 returns plain number', () => {
  expect(abbreviateNumber(999)).toBe('999');
});

it('abbreviateNumber at 1000 returns k suffix', () => {
  expect(abbreviateNumber(1000)).toBe('1k');
});

it('abbreviateNumber at 1500 returns 1.5k', () => {
  expect(abbreviateNumber(1500)).toBe('1.5k');
});

it('abbreviateNumber at 1M returns m suffix', () => {
  expect(abbreviateNumber(1_000_000)).toBe('1m');
});

it('abbreviateNumber at 1B returns b suffix', () => {
  expect(abbreviateNumber(1_000_000_000)).toBe('1b');
});

it('abbreviateNumber at 1T returns t suffix', () => {
  expect(abbreviateNumber(1_000_000_000_000)).toBe('1t');
});

it('abbreviateNumber long style returns word suffix', () => {
  expect(abbreviateNumber(2_500_000, 1, 'long')).toBe('2.5 million');
});

it('abbreviateNumber onlyShowDecimalsIfNeeded skips decimals for integers', () => {
  expect(abbreviateNumber(2000, 1, 'short', true)).toBe('2k');
});

// --- abbreviateBigNumber ---

it('abbreviateBigNumber returns zero string for 0', () => {
  expect(abbreviateBigNumber(new BigNumber(0), 3)).toBe('0');
});

it('abbreviateBigNumber abbreviates billions', () => {
  expect(abbreviateBigNumber(new BigNumber(3_100_000_000), 3)).toBe('3.1b');
});

it('abbreviateBigNumber abbreviates millions', () => {
  expect(abbreviateBigNumber(new BigNumber(2_000_000), 3)).toBe('2m');
});

it('abbreviateBigNumber abbreviates thousands', () => {
  expect(abbreviateBigNumber(new BigNumber(5500), 3)).toBe('5.5k');
});

it('abbreviateBigNumber shows < threshold for tiny values', () => {
  expect(abbreviateBigNumber(new BigNumber(0.00001), 4)).toBe('< 0.0001');
});

// --- formatNumber ---

it('formatNumber returns 0.0 for zero', () => {
  expect(formatNumber('0')).toBe('0.0');
});

it('formatNumber returns < 0.0001 for tiny values', () => {
  expect(formatNumber('0.00001')).toBe('<0.0001');
});

it('formatNumber formats value above 1 to 2 decimal places', () => {
  expect(formatNumber('5.6789')).toBe('5.67');
});

it('formatNumber formats small decimal to 4 places', () => {
  expect(formatNumber('0.12345')).toBe('0.1234');
});

it('formatNumber respects decimals option', () => {
  expect(formatNumber('1.23456', { decimals: 3 })).toBe('1.234');
});

it('formatNumber with decimals 0 returns whole number', () => {
  expect(formatNumber('1.9', { decimals: 0 })).toBe('1');
});

// --- toSignificantDigits ---

it('toSignificantDigits returns zero with min decimal places', () => {
  expect(toSignificantDigits({ value: '0' })).toBe('0.00');
});

it('toSignificantDigits returns < threshold for tiny value', () => {
  expect(toSignificantDigits({ value: '0.0001' })).toBe('< 0.001');
});

it('toSignificantDigits formats to 3 sig digits by default', () => {
  expect(toSignificantDigits({ value: '1.23456' })).toBe('1.23');
});

it('toSignificantDigits handles negative values', () => {
  expect(toSignificantDigits({ value: '-1.23456' })).toBe('-1.23');
});

it('toSignificantDigits respects custom significantDigits', () => {
  expect(toSignificantDigits({ value: '1.23456', significantDigits: 5 })).toBe('1.2346');
});

// --- getFormattedTimeQuantity ---

it('getFormattedTimeQuantity formats minutes only', () => {
  expect(getFormattedTimeQuantity(5 * 60 * 1000)).toBe('5m');
});

it('getFormattedTimeQuantity formats hours and minutes', () => {
  expect(getFormattedTimeQuantity(90 * 60 * 1000)).toBe('1h 30m');
});

it('getFormattedTimeQuantity formats days, hours, and minutes', () => {
  expect(getFormattedTimeQuantity(25 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe('1d 1h 30m');
});

it('getFormattedTimeQuantity respects maxUnits', () => {
  expect(getFormattedTimeQuantity(25 * 60 * 60 * 1000 + 30 * 60 * 1000, 2)).toBe('1d 1h');
});

it('getFormattedTimeQuantity shows 0m when less than a minute', () => {
  expect(getFormattedTimeQuantity(30 * 1000)).toBe('1m');
});

// --- roundToSignificant1or5 ---

it('roundToSignificant1or5 returns 0 for 0', () => {
  expect(roundToSignificant1or5(0)).toBe(0);
});

it('roundToSignificant1or5 rounds 1300 down to 1000', () => {
  expect(roundToSignificant1or5(1300)).toBe(1000);
});

it('roundToSignificant1or5 rounds 3000 to 5000', () => {
  expect(roundToSignificant1or5(3000)).toBe(5000);
});

it('roundToSignificant1or5 rounds 8000 up to 10000', () => {
  expect(roundToSignificant1or5(8000)).toBe(10000);
});

it('roundToSignificant1or5 rounds 500 to 500', () => {
  expect(roundToSignificant1or5(500)).toBe(500);
});

// --- flattenDeep / times ---

it('flattenDeep flattens nested arrays', () => {
  expect(flattenDeep([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
});

it('flattenDeep returns empty array for empty input', () => {
  expect(flattenDeep([])).toEqual([]);
});

it('times creates array by calling fn n times', () => {
  expect(times(3, i => i * 2)).toEqual([0, 2, 4]);
});

// --- omitBy / omitFlatten / pickShallow / pickBy ---

it('omitBy removes entries matching predicate', () => {
  const obj = { a: 1, b: 2, c: 3 };
  expect(omitBy(obj, v => v > 1)).toEqual({ a: 1 });
});

it('omitFlatten removes specified keys', () => {
  const obj = { a: 1, b: 2, c: 3 };
  expect(omitFlatten(obj, ['b', 'c'])).toEqual({ a: 1 });
});

it('omitFlatten handles null/undefined obj gracefully', () => {
  expect(omitFlatten(null, ['a'])).toEqual({});
});

it('pickShallow returns only specified keys', () => {
  const obj = { a: 1, b: 2, c: 3 };
  expect(pickShallow(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
});

it('pickBy returns entries matching predicate', () => {
  const obj = { a: 1, b: 2, c: 3 };
  expect(pickBy(obj, v => v > 1)).toEqual({ b: 2, c: 3 });
});
