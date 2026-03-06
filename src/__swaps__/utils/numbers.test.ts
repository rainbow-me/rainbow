import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { supportedCurrencies } from '@/references/supportedCurrencies';

const testCases = [
  { value: 1234.56, currency: supportedCurrencies.USD, expected: '$1,234.56' },
  { value: 0.1, currency: supportedCurrencies.EUR, expected: '€0.10' },
  { value: 1.234567899999, currency: supportedCurrencies.ETH, expected: 'Ξ1.234568' },
  { value: 1000, currency: supportedCurrencies.KRW, expected: '₩1,000' },
  // App doesn't currently support `,` as a decimal separator
  { value: 1234.56, currency: supportedCurrencies.RUB, expected: '1,234.56₽' },
  { value: 1234.56, currency: supportedCurrencies.AUD, expected: 'A$1,234.56' },
  { value: 1234.56, currency: supportedCurrencies.CAD, expected: 'CA$1,234.56' },
  { value: 1234.56, currency: supportedCurrencies.NZD, expected: 'NZ$1,234.56' },
  { value: 1234.56, currency: supportedCurrencies.GBP, expected: '£1,234.56' },
  { value: 1234.56, currency: supportedCurrencies.CNY, expected: '¥1,234.56' },
  { value: 1234.56, currency: supportedCurrencies.JPY, expected: '¥1,235' },
  { value: 1234.56, currency: supportedCurrencies.INR, expected: '₹1,234.56' },
  { value: 1234.56, currency: supportedCurrencies.TRY, expected: '₺1,234.56' },
  { value: 1234.56, currency: supportedCurrencies.ZAR, expected: 'R1,234.56' },
];

describe('convertAmountToNativeDisplayWorklet', () => {
  testCases.forEach(({ value, currency, expected }) => {
    it(`should format ${currency.currency} correctly`, () => {
      return expect(convertAmountToNativeDisplayWorklet(value, currency.currency)).toBe(expected);
    });
  });

  it('should handle very small ETH values', () => {
    expect(convertAmountToNativeDisplayWorklet(0.000000000000000001, 'ETH')).toBe('Ξ0');
  });

  it('should handle KRW with no decimal places', () => {
    expect(convertAmountToNativeDisplayWorklet(1234.56, 'KRW')).toBe('₩1,235');
  });

  it('should apply threshold when useThreshold is true', () => {
    expect(convertAmountToNativeDisplayWorklet(0.001, 'USD', true)).toBe('<$0.01');
    expect(convertAmountToNativeDisplayWorklet(0.00000001, 'ETH', true)).toBe('<Ξ0.0001');
  });

  it('should not apply threshold when useThreshold is false', () => {
    expect(convertAmountToNativeDisplayWorklet(0.001, 'USD', false)).toBe('$0.00');
    expect(convertAmountToNativeDisplayWorklet(0.00000001, 'ETH', false)).toBe('Ξ0');
  });

  it('should handle string inputs', () => {
    expect(convertAmountToNativeDisplayWorklet('1234.56', 'USD')).toBe('$1,234.56');
  });

  it('should handle zero values', () => {
    expect(convertAmountToNativeDisplayWorklet(0, 'USD')).toBe('$0.00');
    expect(convertAmountToNativeDisplayWorklet(0, 'ETH')).toBe('Ξ0');
    expect(convertAmountToNativeDisplayWorklet(0, 'KRW')).toBe('₩0');
  });

  it('should handle negative values', () => {
    expect(convertAmountToNativeDisplayWorklet(-1234.56, 'USD')).toBe('$-1,234.56');
    expect(convertAmountToNativeDisplayWorklet(-0.1, 'EUR')).toBe('€-0.10');
    expect(convertAmountToNativeDisplayWorklet(-1.234567, 'ETH')).toBe('Ξ-1.234567');
  });

  it('should handle large numbers', () => {
    expect(convertAmountToNativeDisplayWorklet(1000000.123456, 'USD')).toBe('$1,000,000.12');
    expect(convertAmountToNativeDisplayWorklet(1000000.123456, 'ETH')).toBe('Ξ1,000,000.123456');
  });

  it('should handle currencies with multi-character symbols', () => {
    expect(convertAmountToNativeDisplayWorklet(1234.56, 'AUD')).toBe('A$1,234.56');
    expect(convertAmountToNativeDisplayWorklet(1234.56, 'CAD')).toBe('CA$1,234.56');
    expect(convertAmountToNativeDisplayWorklet(1234.56, 'NZD')).toBe('NZ$1,234.56');
  });

  // App doesn't currently support `,` as a decimal separator
  it('should handle RUB with right alignment', () => {
    expect(convertAmountToNativeDisplayWorklet(1234.56, 'RUB')).toBe('1,234.56₽');
  });

  it('should handle ETH with 18 decimal places', () => {
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    expect(convertAmountToNativeDisplayWorklet(1.234567890123456789, 'ETH')).toBe('Ξ1.234568');
  });
});
