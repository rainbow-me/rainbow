import { toCompactNotation } from '../strings';

describe('toCompactNotation', () => {
  it('should format large whole numbers with fixed decimals below 1M', () => {
    expect(toCompactNotation({ value: '123456' })).toBe('123456.00');
    expect(toCompactNotation({ value: 999999 })).toBe('999999.00');
    expect(toCompactNotation({ value: '999999.99' })).toBe('999999.99');
  });

  it('should format large whole numbers with scientific notation >= 1M', () => {
    expect(toCompactNotation({ value: '1000000' })).toBe('1.00×10⁶');
    expect(toCompactNotation({ value: 1234567 })).toBe('1.23×10⁶');
    expect(toCompactNotation({ value: '9876543210' })).toBe('9.88×10⁹');
  });

  it('should handle negative large numbers', () => {
    expect(toCompactNotation({ value: '-123456' })).toBe('-123456.00');
    expect(toCompactNotation({ value: '-1000000' })).toBe('-1.00×10⁶');
    expect(toCompactNotation({ value: -9876543210 })).toBe('-9.88×10⁹');
  });

  it('should format numbers around 1 with fixed decimals', () => {
    expect(toCompactNotation({ value: '1.00' })).toBe('1.00');
    expect(toCompactNotation({ value: 1 })).toBe('1.00');
    expect(toCompactNotation({ value: '1.2345', decimalPlaces: 3 })).toBe('1.235');
    expect(toCompactNotation({ value: '0.9999' })).toBe('1.00');
  });

  it('should handle negative numbers around -1', () => {
    expect(toCompactNotation({ value: '-1.00' })).toBe('-1.00');
    expect(toCompactNotation({ value: -1 })).toBe('-1.00');
    expect(toCompactNotation({ value: '-1.2345', decimalPlaces: 3 })).toBe('-1.235');
    expect(toCompactNotation({ value: '-0.9999' })).toBe('-1.00');
  });

  it('should format decimals >= 0.0001 without subscript notation', () => {
    expect(toCompactNotation({ value: '0.12345' })).toBe('0.12');
    expect(toCompactNotation({ value: 0.01 })).toBe('0.01');
    expect(toCompactNotation({ value: '0.001' })).toBe('0.0010');
    expect(toCompactNotation({ value: '0.001', decimalPlaces: 3 })).toBe('0.001');
    expect(toCompactNotation({ value: '0.0001' })).toBe('0.00010');
    expect(toCompactNotation({ value: '0.0001', decimalPlaces: 4 })).toBe('0.0001');
  });

  it('should handle negative decimals without subscript', () => {
    expect(toCompactNotation({ value: '-0.12345' })).toBe('-0.12');
    expect(toCompactNotation({ value: -0.01 })).toBe('-0.01');
    expect(toCompactNotation({ value: '-0.001', decimalPlaces: 3 })).toBe('-0.001');
    expect(toCompactNotation({ value: '-0.0001', decimalPlaces: 4 })).toBe('-0.0001');
  });

  it('should format small decimals < 0.0001 with subscript notation', () => {
    expect(toCompactNotation({ value: '0.0000123' })).toBe('0.0₄12');
    expect(toCompactNotation({ value: 0.000005 })).toBe('0.0₅50');
    expect(toCompactNotation({ value: '0.0000006789' })).toBe('0.0₆67');
  });

  it('should handle small negative decimals with subscript', () => {
    expect(toCompactNotation({ value: '-0.0000123' })).toBe('-0.0₄12');
    expect(toCompactNotation({ value: -0.000005 })).toBe('-0.0₅50');
    expect(toCompactNotation({ value: '-0.0000006789' })).toBe('-0.0₆67');
  });

  it('should handle exponent notation input correctly', () => {
    expect(toCompactNotation({ value: '1.23e6' })).toBe('1.23×10⁶');
    expect(toCompactNotation({ value: '9.87e9' })).toBe('9.87×10⁹');
    expect(toCompactNotation({ value: '-1.23e6' })).toBe('-1.23×10⁶');

    expect(toCompactNotation({ value: '1.23e5' })).toBe('123000.00');
    expect(toCompactNotation({ value: '1.23e-1' })).toBe('0.12');
    expect(toCompactNotation({ value: '1.23e-3', decimalPlaces: 3 })).toBe('0.001');
    expect(toCompactNotation({ value: '1e-4', decimalPlaces: 4 })).toBe('0.0001');

    expect(toCompactNotation({ value: '1.23e-5' })).toBe('0.0₄12');
    expect(toCompactNotation({ value: '5e-6' })).toBe('0.0₅50');
    expect(toCompactNotation({ value: '6.78e-7' })).toBe('0.0₆67');
    expect(toCompactNotation({ value: '-1.23e-5' })).toBe('-0.0₄12');
  });

  it('should format zero correctly', () => {
    expect(toCompactNotation({ value: '0' })).toBe('0.00');
    expect(toCompactNotation({ value: 0 })).toBe('0.00');
    expect(toCompactNotation({ value: 0, decimalPlaces: 4 })).toBe('0.0000');
  });

  it('should apply prefix correctly', () => {
    expect(toCompactNotation({ value: '1234', prefix: '$' })).toBe('$1234.00');
    expect(toCompactNotation({ value: '1000000', prefix: '€' })).toBe('€1.00×10⁶');
    expect(toCompactNotation({ value: '0.123', prefix: '£' })).toBe('£0.12');
    expect(toCompactNotation({ value: '0.0000123', prefix: '¥' })).toBe('¥0.0₄12');
    expect(toCompactNotation({ value: '-50', prefix: '$' })).toBe('$-50.00');
    expect(toCompactNotation({ value: '-1.23e-5', prefix: '$' })).toBe('$-0.0₄12');
    expect(toCompactNotation({ value: 0, prefix: '$' })).toBe('$0.00');
  });

  it('should return input string if invalid', () => {
    expect(toCompactNotation({ value: 'abc' })).toBe('abc');
    expect(toCompactNotation({ value: '1.2.3' })).toBe('1.2.3');
    expect(toCompactNotation({ value: '--5' })).toBe('--5');
    expect(toCompactNotation({ value: '' })).toBe('');
  });
});
