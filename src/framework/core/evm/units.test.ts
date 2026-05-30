import { parsePositiveRawAmount } from './units';

describe('parsePositiveRawAmount', () => {
  it('parses exact positive decimal amounts as base units', () => {
    expect(parsePositiveRawAmount('0.999999999999999999', 18)).toBe(999999999999999999n);
    expect(parsePositiveRawAmount('1', 18)).toBe(1000000000000000000n);
    expect(parsePositiveRawAmount('1.0000000000000000000', 18)).toBe(1000000000000000000n);
    expect(parsePositiveRawAmount('.', 18)).toBeNull();
    expect(parsePositiveRawAmount('0', 18)).toBeNull();
  });

  it('rejects decimal amounts that cannot be represented in base units', () => {
    expect(parsePositiveRawAmount('0.9999999999999999999', 18)).toBeNull();
    expect(parsePositiveRawAmount('0.0000000000000000005', 18)).toBeNull();
  });

  it('throws the supplied error when requested', () => {
    const error = new Error('invalid amount');

    expect(() => parsePositiveRawAmount('0', 18, error)).toThrow(error);
  });
});
