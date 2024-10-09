import { valueBasedDecimalFormatter } from '../decimalFormatter';

// amounts
const VERY_SMALL_AMOUNT = '0.0000000123456789';
const SMALL_AMOUNT = '0.123456789';
const REGULAR_AMOUNT = '1.123456789';
const REGULAR_AMOUNT_1_WITH_SIGS = '1.000000123';
const REGULAR_AMOUNT_10 = '12.123456789';
const REGULAR_AMOUNT_100 = '123.123456789';
const REGULAR_AMOUNT_100_WITH_SIGS = '123.000000123456789';
const REGULAR_AMOUNT_1000 = '1234.123456789';
const LARGE_AMOUNT = '12345.123456789';
const VERY_LARGE_AMOUNT = '123456.123456789';
const VERY_LARGE_AMOUNT_WITH_SIGS = '123456.00000001234';
const VERY_VERY_LARGE_AMOUNT = '1234567.123456789';

// nativePrices
const NO_PRICE = 0;
const VERY_SMALL_PRICE = 0.00000002;
const REGULAR_PRICE_1 = 1.12345;
const REGULAR_PRICE_10 = 12.12345;
const REGULAR_PRICE_1000 = 1234.12345;
const LARGE_PRICE = 12345.12345;
const VERY_LARGE_PRICE = 123456.12345;

const testCases = [
  // very large price: ~$100k
  { amount: VERY_SMALL_AMOUNT, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '0.000000013' },
  { amount: SMALL_AMOUNT, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '0.1234568' },
  { amount: REGULAR_AMOUNT, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '1.1234568' },
  { amount: REGULAR_AMOUNT_1_WITH_SIGS, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '1.00000013' },
  { amount: REGULAR_AMOUNT_10, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '12.123457' },
  { amount: REGULAR_AMOUNT_100, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '123.12346' },
  { amount: REGULAR_AMOUNT_100_WITH_SIGS, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '123.00001' },
  { amount: REGULAR_AMOUNT_1000, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '1234.1235' },
  { amount: LARGE_AMOUNT, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '12345.124' },
  { amount: VERY_LARGE_AMOUNT, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '123456.13' },
  { amount: VERY_LARGE_AMOUNT_WITH_SIGS, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '123456.01' },
  { amount: VERY_VERY_LARGE_AMOUNT, nativePrice: VERY_LARGE_PRICE, isStablecoin: false, expected: '1234567.2' },

  // large price: ~$10k
  { amount: VERY_SMALL_AMOUNT, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '0.000000013' },
  { amount: SMALL_AMOUNT, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '0.123457' },
  { amount: REGULAR_AMOUNT, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '1.123457' },
  { amount: REGULAR_AMOUNT_1_WITH_SIGS, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '1.00000013' },
  { amount: REGULAR_AMOUNT_10, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '12.12346' },
  { amount: REGULAR_AMOUNT_100, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '123.1235' },
  { amount: REGULAR_AMOUNT_100_WITH_SIGS, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '123.0001' },
  { amount: REGULAR_AMOUNT_1000, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '1234.124' },
  { amount: LARGE_AMOUNT, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '12345.13' },
  { amount: VERY_LARGE_AMOUNT, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '123456.2' },
  { amount: VERY_LARGE_AMOUNT_WITH_SIGS, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '123456.1' },
  { amount: VERY_VERY_LARGE_AMOUNT, nativePrice: LARGE_PRICE, isStablecoin: false, expected: '1234568' },

  // regular price: ~$1000
  { amount: VERY_SMALL_AMOUNT, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '0.000000013' },
  { amount: SMALL_AMOUNT, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '0.12346' },
  { amount: REGULAR_AMOUNT, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '1.12346' },
  { amount: REGULAR_AMOUNT_1_WITH_SIGS, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '1.00000013' },
  { amount: REGULAR_AMOUNT_10, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '12.1235' },
  { amount: REGULAR_AMOUNT_100, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '123.124' },
  { amount: REGULAR_AMOUNT_100_WITH_SIGS, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '123.001' },
  { amount: REGULAR_AMOUNT_1000, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '1234.13' },
  { amount: LARGE_AMOUNT, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '12345.2' },
  { amount: VERY_LARGE_AMOUNT, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '123457' },
  { amount: VERY_LARGE_AMOUNT_WITH_SIGS, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '123457' },
  { amount: VERY_VERY_LARGE_AMOUNT, nativePrice: REGULAR_PRICE_1000, isStablecoin: false, expected: '1234568' },

  // regular price: ~$10
  { amount: VERY_SMALL_AMOUNT, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '0.000000013' },
  { amount: SMALL_AMOUNT, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '0.124' },
  { amount: REGULAR_AMOUNT, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '1.124' },
  { amount: REGULAR_AMOUNT_1_WITH_SIGS, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '1.00000013' },
  { amount: REGULAR_AMOUNT_10, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '12.13' },
  { amount: REGULAR_AMOUNT_100, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '123.13' },
  { amount: REGULAR_AMOUNT_100_WITH_SIGS, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '123.01' },
  { amount: REGULAR_AMOUNT_1000, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '1235' },
  { amount: LARGE_AMOUNT, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '12346' },
  { amount: VERY_LARGE_AMOUNT, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '123457' },
  { amount: VERY_LARGE_AMOUNT_WITH_SIGS, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '123457' },
  { amount: VERY_VERY_LARGE_AMOUNT, nativePrice: REGULAR_PRICE_10, isStablecoin: false, expected: '1234568' },

  // regular price: ~$1 (non-stablecoin)
  { amount: VERY_SMALL_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '0.000000013' },
  { amount: SMALL_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '0.13' },
  { amount: REGULAR_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '1.13' },
  { amount: REGULAR_AMOUNT_1_WITH_SIGS, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '1.00000013' },
  { amount: REGULAR_AMOUNT_10, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '12.13' },
  { amount: REGULAR_AMOUNT_100, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '123.13' },
  { amount: REGULAR_AMOUNT_100_WITH_SIGS, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '123.01' },
  { amount: REGULAR_AMOUNT_1000, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '1235' },
  { amount: LARGE_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '12346' },
  { amount: VERY_LARGE_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '123457' },
  { amount: VERY_LARGE_AMOUNT_WITH_SIGS, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '123457' },
  { amount: VERY_VERY_LARGE_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: false, expected: '1234568' },

  // stablecoin tests
  { amount: VERY_SMALL_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '0.000000013' },
  { amount: SMALL_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '0.13' },
  { amount: REGULAR_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '1.13' },
  { amount: REGULAR_AMOUNT_1_WITH_SIGS, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '1.00000013' },
  { amount: REGULAR_AMOUNT_10, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '12.13' },
  { amount: REGULAR_AMOUNT_100, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '123.13' },
  { amount: REGULAR_AMOUNT_100_WITH_SIGS, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '123.01' },
  { amount: REGULAR_AMOUNT_1000, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '1234.13' },
  { amount: LARGE_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '12345.13' },
  { amount: VERY_LARGE_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '123456.13' },
  { amount: VERY_LARGE_AMOUNT_WITH_SIGS, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '123456.01' },
  { amount: VERY_VERY_LARGE_AMOUNT, nativePrice: REGULAR_PRICE_1, isStablecoin: true, expected: '1234567.13' },

  // very small price
  { amount: VERY_SMALL_AMOUNT, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '0.000000013' },
  { amount: SMALL_AMOUNT, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '0.13' },
  { amount: REGULAR_AMOUNT, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '1.13' },
  { amount: REGULAR_AMOUNT_1_WITH_SIGS, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '1.00000013' },
  { amount: REGULAR_AMOUNT_10, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '12.13' },
  { amount: REGULAR_AMOUNT_100, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '123.13' },
  { amount: REGULAR_AMOUNT_100_WITH_SIGS, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '123.01' },
  { amount: REGULAR_AMOUNT_1000, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '1235' },
  { amount: LARGE_AMOUNT, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '12346' },
  { amount: VERY_LARGE_AMOUNT, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '123457' },
  { amount: VERY_LARGE_AMOUNT_WITH_SIGS, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '123457' },
  { amount: VERY_VERY_LARGE_AMOUNT, nativePrice: VERY_SMALL_PRICE, isStablecoin: false, expected: '1234568' },

  // no price
  { amount: VERY_SMALL_AMOUNT, nativePrice: NO_PRICE, isStablecoin: false, expected: '0.000000013' },
  { amount: SMALL_AMOUNT, nativePrice: NO_PRICE, isStablecoin: false, expected: '0.123457' },
  { amount: REGULAR_AMOUNT, nativePrice: NO_PRICE, isStablecoin: false, expected: '1.123457' },
  { amount: REGULAR_AMOUNT_1_WITH_SIGS, nativePrice: NO_PRICE, isStablecoin: false, expected: '1.00000013' },
  { amount: REGULAR_AMOUNT_10, nativePrice: NO_PRICE, isStablecoin: false, expected: '12.12346' },
  { amount: REGULAR_AMOUNT_100, nativePrice: NO_PRICE, isStablecoin: false, expected: '123.1235' },
  { amount: REGULAR_AMOUNT_100_WITH_SIGS, nativePrice: NO_PRICE, isStablecoin: false, expected: '123.0001' },
  { amount: REGULAR_AMOUNT_1000, nativePrice: NO_PRICE, isStablecoin: false, expected: '1234.124' },
  { amount: LARGE_AMOUNT, nativePrice: NO_PRICE, isStablecoin: false, expected: '12345.13' },
  { amount: VERY_LARGE_AMOUNT, nativePrice: NO_PRICE, isStablecoin: false, expected: '123456.2' },
  { amount: VERY_LARGE_AMOUNT_WITH_SIGS, nativePrice: NO_PRICE, isStablecoin: false, expected: '123456.1' },
  { amount: VERY_VERY_LARGE_AMOUNT, nativePrice: NO_PRICE, isStablecoin: false, expected: '1234568' },
];

describe('convertAmountToNativeDisplayWorklet', () => {
  testCases.forEach(({ amount, nativePrice, isStablecoin, expected }) => {
    it(`should format correctly`, () => {
      return expect(
        valueBasedDecimalFormatter({
          amount,
          nativePrice,
          roundingMode: 'up',
          isStablecoin,
        })
      ).toBe(expected);
    });
  });
});
